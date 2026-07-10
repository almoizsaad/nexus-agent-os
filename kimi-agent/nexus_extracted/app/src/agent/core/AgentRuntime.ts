import { AgentEventType, AgentActionType } from '../types/agent';
import type { AgentState, AgentEvent, AgentStatus, Planner, Executor, Plan } from '../types/agent';
import type { AgentProtocolEvent } from '../protocol/events';
import type { AgentProtocolAction } from '../protocol/actions';
import { EventBus } from './EventBus';
import { WorkflowEngine } from '../workflow/WorkflowEngine';
import { MemoryManager } from '../memory/MemoryManager';
import { SelfCorrection } from './SelfCorrection';
import { AgentStream } from '../events/AgentStream';
import { OptimizationSuggestions } from '../improvement/OptimizationSuggestions';
import type { 
  IPerformanceMonitor, 
  IImprovementEngine, 
  SystemMetrics,
  OptimizationRecommendation
} from '../types/improvement';

export class AgentRuntime {
  private state: AgentState;
  private eventBus: EventBus;
  private stream: AgentStream;
  
  private planner: Planner | null = null;
  private executor: Executor | null = null;
  private memory: MemoryManager;
  private workflowEngine: WorkflowEngine | null = null;
  private selfCorrection: SelfCorrection;
  
  private monitor?: IPerformanceMonitor;
  private improvementEngine?: IImprovementEngine;
  private suggestions?: OptimizationSuggestions;

  constructor(
    eventBus: EventBus, 
    planner?: Planner, 
    executor?: Executor,
    monitor?: IPerformanceMonitor,
    improvementEngine?: IImprovementEngine,
    suggestions?: OptimizationSuggestions
  ) {
    this.eventBus = eventBus;
    this.stream = new AgentStream(eventBus);
    this.planner = planner || null;
    this.executor = executor || null;
    this.monitor = monitor;
    this.improvementEngine = improvementEngine;
    this.suggestions = suggestions;

    this.memory = new MemoryManager(monitor);
    this.selfCorrection = new SelfCorrection(this);
    
    if (this.executor) {
      this.workflowEngine = new WorkflowEngine(this.executor, monitor);
    }

    this.state = this.getInitialState();

    // Subscribe to incoming agent events
    this.eventBus.subscribe<AgentProtocolEvent>('agent:events', (event) => {
      this.handleEvent(event);
      this.memory.addSessionEvent(event);
    });

    // Subscribe to incoming actions (e.g. from workspace)
    this.eventBus.subscribe<AgentProtocolAction>('agent:actions', (action) => {
      this.handleAction(action);
    });
  }

  private getInitialState(): AgentState {
    return {
      status: 'idle',
      history: [],
    };
  }

  public reset(): void {
    this.state = this.getInitialState();
    this.memory.clear();
    this.dispatchAction({
      type: AgentActionType.AGENT_UPDATE,
      payload: {
        status: 'idle',
        message: 'Agent state has been reset.',
      },
    });
  }

  public getCurrentPlan(): Plan | undefined {
    return this.state.currentPlan;
  }

  public async handleEvent(event: AgentProtocolEvent): Promise<void> {
    this.recordEvent(event);
    
    switch (event.type) {
      case AgentEventType.USER_MESSAGE:
        await this.onUserMessage(event.payload.text);
        break;
      case AgentEventType.WORKSPACE_ACTION:
        await this.onWorkspaceAction(event.payload.action, event.payload.metadata);
        break;
      case AgentEventType.TOOL_RESULT:
        await this.onToolResult(event.payload.toolName, event.payload.result);
        break;
    }
  }

  private handleAction(action: AgentProtocolAction): void {
    // Process actions received by the agent (e.g. manual overrides or approvals)
    console.debug(`[AgentRuntime] Received action: ${action.type}`);
  }

  public async processGoal(goal: string): Promise<void> {
    if (!this.planner || !this.workflowEngine) {
      this.stream.error('Planner or WorkflowEngine not initialized.');
      return;
    }

    this.state.status = 'thinking';
    this.memory.setGoal(goal);
    this.stream.thinking('Analyzing goal and generating autonomous plan...');

    try {
      // Recall relevant context from memory
      const context = await this.memory.recallMemories(goal);
      const enhancedGoal = context.length > 0 ? `${goal} (Context: ${JSON.stringify(context)})` : goal;

      this.stream.planning(enhancedGoal);
      const plan = await this.planner.generatePlan(enhancedGoal, this.state);
      this.state.currentPlan = JSON.parse(JSON.stringify(plan));
      
      if (!this.state.currentPlan) return;

      this.dispatchAction({
        type: AgentActionType.UPDATE_PLAN,
        payload: {
          planId: this.state.currentPlan.id,
          tasks: this.state.currentPlan.tasks.map(t => ({ id: t.id, status: t.status })),
        },
      });

      this.state.status = 'executing';
      
      const success = await this.workflowEngine.executePlan(this.state.currentPlan, (taskId, status, result) => {
        if (status === 'in-progress') {
          const task = this.state.currentPlan!.tasks.find(t => t.id === taskId);
          this.stream.executingTool(task?.description || taskId);
        }

        // Sync plan state
        const taskIndex = this.state.currentPlan!.tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
          this.state.currentPlan!.tasks[taskIndex].status = status as Task['status'];
        }

        this.dispatchAction({
          type: AgentActionType.UPDATE_PLAN,
          payload: {
            planId: this.state.currentPlan!.id,
            tasks: this.state.currentPlan!.tasks.map(t => ({ id: t.id, status: t.status })),
          },
        });

        if (status === 'failed') {
          this.selfCorrection.handleTaskFailure(taskId, result?.error || 'Unknown error');
        }
      });

      // Self-Improvement: Generate recommendations after each workflow attempt
      this.runSelfImprovement();

      if (success) {
        this.state.status = 'idle';
        await this.memory.remember(goal, { completed: true, planId: plan.id });
        
        // Phase 4.1: Consolidate session into semantic memory
        await this.memory.consolidateSession(plan.id);
        
        this.stream.completing('Goal accomplished successfully.');
      }

    } catch (error) {
      this.state.status = 'error';
      this.stream.error(`Critical error: ${error}`, true);
    }
  }

  public dispatchAction(action: AgentProtocolAction): void {
    this.eventBus.publish('agent:actions', action);
  }

  public getStatus(): AgentStatus {
    return this.state.status;
  }

  public getMetrics(): SystemMetrics | null {
    return this.monitor?.getMetrics() || null;
  }

  public getRecommendations(): OptimizationRecommendation[] {
    return this.suggestions?.getSuggestions() || [];
  }

  private runSelfImprovement(): void {
    if (this.monitor && this.improvementEngine && this.suggestions) {
      const metrics = this.monitor.getMetrics();
      const recommendations = this.improvementEngine.generateRecommendations(metrics);
      this.suggestions.updateSuggestions(recommendations);
      
      if (recommendations.length > 0) {
        console.log(`[AgentRuntime] Generated ${recommendations.length} optimization suggestions.`);
      }
    }
  }

  public getState(): AgentState {
    return { ...this.state };
  }

  private recordEvent(event: AgentEvent): void {
    this.state.history.push(event);
  }

  private async onUserMessage(text: string): Promise<void> {
    await this.processGoal(text);
  }

  private async onWorkspaceAction(action: string, metadata?: Record<string, unknown>): Promise<void> {
    console.log(`[AgentRuntime] Workspace action: ${action}`, metadata);
    if (action === 'REPLAN') {
      const goal = this.memory.getGoal();
      if (goal) await this.processGoal(goal);
    }
  }

  private async onToolResult(toolName: string, result: unknown): Promise<void> {
    console.log(`[AgentRuntime] Reactive tool result for ${toolName}:`, result);
  }

  public registerPlanner(planner: Planner): void {
    this.planner = planner;
  }

  public registerExecutor(executor: Executor): void {
    this.executor = executor;
    this.workflowEngine = new WorkflowEngine(executor);
  }

  public registerMemory(memory: MemoryManager): void {
    this.memory = memory;
  }
}
