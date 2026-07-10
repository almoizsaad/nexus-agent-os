import type { CooperativePlan, DelegatedTask } from '../types/planning';
import { DependencyResolver } from './DependencyResolver';
import { TaskDistributor } from './TaskDistributor';
import { TaskDelegator } from './TaskDelegator';
import { AgentRegistry } from '../core/AgentRegistry';

export class PlannerCoordinator {
  private dependencyResolver: DependencyResolver;
  private taskDistributor: TaskDistributor;
  private taskDelegator: TaskDelegator;

  constructor(registry: AgentRegistry) {
    this.dependencyResolver = new DependencyResolver();
    this.taskDistributor = new TaskDistributor(registry);
    this.taskDelegator = new TaskDelegator(registry);
  }

  public async coordinatePlan(plan: CooperativePlan): Promise<void> {
    // 1. Distribute tasks based on roles/capabilities
    plan.tasks = this.taskDistributor.distributeTasks(plan.tasks);

    // 2. Resolve dependencies and identify ready tasks
    const readyTasks = this.getReadyTasks(plan);

    // 3. Delegate ready tasks
    for (const task of readyTasks) {
      await this.delegateTask(task, plan.id);
    }
  }

  public getReadyTasks(plan: CooperativePlan): DelegatedTask[] {
    const completedTaskIds = new Set(
      plan.tasks
        .filter(t => t.status === 'completed')
        .map(t => t.id)
    );
    const runningTaskIds = new Set(
      plan.tasks
        .filter(t => t.status === 'running')
        .map(t => t.id)
    );
    
    return this.dependencyResolver.getReadyTasks(plan, completedTaskIds, runningTaskIds);
  }

  public async delegateTask(task: DelegatedTask, planId: string): Promise<void> {
    task.status = 'running';
    let success = false;
    
    if (task.metadata?.requiresSubPlan) {
      success = await this.taskDelegator.requestSubPlan(task, planId);
    } else {
      success = await this.taskDelegator.delegateTask(task, planId);
    }

    if (!success) {
      task.status = 'failed';
      task.metadata = { ...task.metadata, error: 'Delegation failed' };
    }
  }

  public mergeSubPlan(mainPlan: CooperativePlan, taskId: string, subPlan: CooperativePlan): void {
    const taskIndex = mainPlan.tasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
      const task = mainPlan.tasks[taskIndex];
      task.subPlan = subPlan;
      
      // Integrate subplan tasks into main plan for easier tracking?
      // Or keep it hierarchical. Hierarchical is better for "Split large goals".
    }
  }

  public handleTaskCompletion(plan: CooperativePlan, taskId: string, result: unknown): void {
    const task = plan.tasks.find(t => t.id === taskId);
    if (task) {
      task.status = 'completed';
      task.metadata = { ...task.metadata, result };
    }
  }

  public handleTaskFailure(plan: CooperativePlan, taskId: string, error: string): void {
    const task = plan.tasks.find(t => t.id === taskId);
    if (task) {
      task.status = 'failed';
      task.metadata = { ...task.metadata, error };
    }
  }
}
