import { AgentRuntime } from './AgentRuntime';
import { PlannerCoordinator } from '../planner/PlannerCoordinator';
import { PlannerConsensus } from '../planner/PlannerConsensus';
import { AgentRegistry } from './AgentRegistry';
import type { CooperativePlan } from '../types/planning';
import type { AgentCommunicationMessage } from '../types/communication';
import { EventBus } from './EventBus';
import type { Planner, Executor, AgentIdentity } from '../types/agent';
import { AgentEventType } from '../types/agent';
import type { IPerformanceMonitor, IImprovementEngine } from '../types/improvement';
import { OptimizationSuggestions } from '../improvement/OptimizationSuggestions';
import { AgentChannel } from './AgentChannel';

export class CoordinatorAgent extends AgentRuntime {
  private coordinator: PlannerCoordinator;
  private consensus: PlannerConsensus;
  private activePlans: Map<string, CooperativePlan> = new Map();
  private maxRetries = 3;

  constructor(
    eventBus: EventBus,
    registry: AgentRegistry,
    planner?: Planner,
    executor?: Executor,
    monitor?: IPerformanceMonitor,
    improvementEngine?: IImprovementEngine,
    suggestions?: OptimizationSuggestions,
    identity?: AgentIdentity,
    channel?: AgentChannel
  ) {
    super(eventBus, planner, executor, monitor, improvementEngine, suggestions, identity, channel);
    this.coordinator = new PlannerCoordinator(registry);
    this.consensus = new PlannerConsensus();
    
    this.setupMessageHandlers();
  }

  protected setupMessageHandlers(): void {
    if (!this.channel) return;

    this.channel.onMessage(async (message: AgentCommunicationMessage) => {
      switch (message.type) {
        case 'TASK_COMPLETED':
          await this.handleTaskResult(message, true);
          break;
        case 'TASK_FAILED':
          await this.handleTaskResult(message, false);
          break;
        case 'SUBPLAN_PROPOSED':
          this.handleSubPlan(message);
          break;
        case 'PLAN_APPROVAL':
          this.handleApproval(message);
          break;
        case 'PLAN_REJECTION':
          this.handleRejection(message);
          break;
      }
    });
  }

  public async startCooperativePlan(plan: CooperativePlan): Promise<void> {
    this.activePlans.set(plan.id, plan);
    this.consensus.proposePlan(plan.id);
    
    // Decompose and delegate
    await this.coordinator.coordinatePlan(plan);
    
    this._eventBus.publish('agent:events', {
      type: AgentEventType.AGENT_UPDATE,
      payload: { planId: plan.id, coordinatorId: this.identity?.id, status: 'PLAN_STARTED' },
      timestamp: Date.now()
    });
  }

  private async handleTaskResult(message: AgentCommunicationMessage, success: boolean): Promise<void> {
    const payload = message.payload as Record<string, unknown>;
    const planId = payload.planId as string;
    const taskId = payload.taskId as string;
    const result = payload.result;
    const error = payload.error as string;
    const plan = this.activePlans.get(planId);
    
    if (!plan) return;

    if (success) {
      this.coordinator.handleTaskCompletion(plan, taskId, result);
      
      // Check if plan is complete or if new tasks are ready
      const readyTasks = this.coordinator.getReadyTasks(plan);
      if (readyTasks.length > 0) {
        for (const task of readyTasks) {
          await this.coordinator.delegateTask(task, plan.id);
        }
      } else if (this.isPlanComplete(plan)) {
        await this.finalizePlan(plan);
      }
    } else {
      await this.handleTaskFailure(plan, taskId, error);
    }
  }

  private async handleTaskFailure(plan: CooperativePlan, taskId: string, error: string): Promise<void> {
    const task = plan.tasks.find(t => t.id === taskId);
    if (!task) return;

    const retries = (task.metadata?.retries as number || 0);
    
    if (retries < this.maxRetries) {
      console.info(`[CoordinatorAgent] Retrying task ${taskId} (attempt ${retries + 1})`);
      task.metadata = { ...task.metadata, retries: retries + 1 };
      task.status = 'pending';
      await this.coordinator.delegateTask(task, plan.id);
    } else {
      console.warn(`[CoordinatorAgent] Task ${taskId} failed after ${this.maxRetries} retries. Attempting replan.`);
      this.coordinator.handleTaskFailure(plan, taskId, error);
      await this.replan(plan, taskId, error);
    }
  }

  private async replan(plan: CooperativePlan, failedTaskId: string, error: string): Promise<void> {
    if (!this.planner) return;

    console.info(`[CoordinatorAgent] Replanning for plan ${plan.id} due to failure in task ${failedTaskId}`);
    
    // Logic for replanning: generate a new plan from the current state
    const remainingGoal = `Recover from failure in task ${failedTaskId}: ${error}. Original goal: ${plan.goal}`;
    try {
      const newPlan = await this.planner.generatePlan(remainingGoal, this.getState()) as CooperativePlan;
      newPlan.id = plan.id; // Keep same ID or handle as subplan
      newPlan.coordinatorId = this.identity?.id || 'unknown';
      
      this.activePlans.set(plan.id, newPlan);
      await this.coordinator.coordinatePlan(newPlan);
    } catch (e) {
      console.error(`[CoordinatorAgent] Replanning failed:`, e);
      this._eventBus.publish('agent:events', {
        type: AgentEventType.ERROR,
        payload: { 
          message: 'Replanning failed', 
          code: 'REPLAN_FAILED', 
          fatal: false,
          details: { planId: plan.id }
        },
        timestamp: Date.now()
      });
    }
  }

  private isPlanComplete(plan: CooperativePlan): boolean {
    return plan.tasks.every(t => t.status === 'completed');
  }

  private async finalizePlan(plan: CooperativePlan): Promise<void> {
    console.info(`[CoordinatorAgent] Plan ${plan.id} completed successfully.`);
    const results = plan.tasks.map(t => ({ taskId: t.id, result: t.metadata?.result }));
    this._eventBus.publish('agent:events', {
      type: AgentEventType.AGENT_UPDATE,
      payload: { planId: plan.id, results, status: 'PLAN_COMPLETED' },
      timestamp: Date.now()
    });
    this.activePlans.delete(plan.id);
  }

  private handleSubPlan(message: AgentCommunicationMessage): void {
    const payload = message.payload as Record<string, unknown>;
    const planId = payload.planId as string;
    const taskId = payload.taskId as string;
    const subPlan = payload.subPlan as CooperativePlan;
    const mainPlan = this.activePlans.get(planId);
    
    if (mainPlan) {
      this.coordinator.mergeSubPlan(mainPlan, taskId, subPlan);
      // After merging subplan, we might need to delegate tasks from it
      this.coordinator.coordinatePlan(mainPlan);
    }
  }

  private handleApproval(message: AgentCommunicationMessage): void {
    const payload = message.payload as Record<string, unknown>;
    const planId = payload.planId as string;
    this.consensus.approvePlan(planId, message.sender as string);
    
    const required = Math.ceil((this.consensus.getConsensus(planId)?.approvals.length || 0) / 2) + 1; // Simple majority
    if (this.consensus.resolveConsensus(planId, required) === 'agreed') {
      this._eventBus.publish('agent:events', {
        type: AgentEventType.AGENT_UPDATE,
        payload: { planId, status: 'PLAN_AGREED' },
        timestamp: Date.now()
      });
    }
  }

  private handleRejection(message: AgentCommunicationMessage): void {
    const payload = message.payload as Record<string, unknown>;
    const planId = payload.planId as string;
    this.consensus.rejectPlan(planId);
    this._eventBus.publish('agent:events', {
      type: AgentEventType.AGENT_UPDATE,
      payload: { planId, status: 'PLAN_REJECTED', reason: payload.reason },
      timestamp: Date.now()
    });
  }

  public getActivePlan(planId: string): CooperativePlan | undefined {
    return this.activePlans.get(planId);
  }
}
