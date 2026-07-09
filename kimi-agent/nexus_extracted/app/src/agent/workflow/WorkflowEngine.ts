import { Executor, Plan, Task } from '../types/agent';
import { TaskGraph } from './TaskGraph';
import { StructuredTask } from '../planner/schemas';

/**
 * WorkflowEngine orchestrates the execution of a Plan using a TaskGraph.
 */
export class WorkflowEngine {
  private executor: Executor;
  private maxRetries = 1;

  constructor(executor: Executor) {
    this.executor = executor;
  }

  public async executePlan(plan: Plan, onUpdate?: (taskId: string, status: string, result?: any) => void): Promise<boolean> {
    const graph = new TaskGraph(plan.tasks as StructuredTask[]);
    
    while (!graph.isComplete()) {
      const nextTasks = graph.getNextExecutableTasks();
      
      if (nextTasks.length === 0 && !graph.isComplete()) {
        console.error('[WorkflowEngine] Deadlock detected or all remaining tasks have failed dependencies.');
        break;
      }

      // Execute available tasks in parallel
      await Promise.all(nextTasks.map(async (task) => {
        graph.markRunning(task.id);
        onUpdate?.(task.id, 'in-progress');

        let success = false;
        let result: any;
        let attempts = 0;

        while (!success && attempts <= this.maxRetries) {
          attempts++;
          result = await this.executor.executeTask(task);
          success = result.success;

          if (!success && attempts <= this.maxRetries) {
            console.warn(`[WorkflowEngine] Task ${task.id} failed, retrying (${attempts}/${this.maxRetries})...`);
          }
        }

        if (success) {
          graph.markCompleted(task.id);
          onUpdate?.(task.id, 'completed', result);
        } else {
          graph.markFailed(task.id);
          onUpdate?.(task.id, 'failed', result);
        }
      }));
    }

    return !graph.hasFailed();
  }
}
