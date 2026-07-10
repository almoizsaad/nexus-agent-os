import type { Executor, Task } from '../types/agent';
import { ToolRegistry } from '../tools/ToolRegistry';
import type { StructuredTask } from '../planner/schemas';

/**
 * TaskExecutor is responsible for executing individual tasks by mapping them
 * to tools registered in the ToolRegistry.
 */
export class TaskExecutor implements Executor {
  private toolRegistry: ToolRegistry;

  /**
   * Initializes the TaskExecutor with a tool registry.
   * @param toolRegistry The registry to use for resolving tools.
   */
  constructor(toolRegistry: ToolRegistry) {
    this.toolRegistry = toolRegistry;
  }

  /**
   * Executes a specific task.
   * @param task The task to be executed.
   * @param context Additional context/parameters for the execution.
   * @returns A promise that resolves to the result of the execution.
   */
  public async executeTask(
    task: Task,
    context: Record<string, unknown> = {}
  ): Promise<Record<string, unknown>> {
    const toolName = this.resolveToolName(task);
    
    console.log(`[TaskExecutor] Executing task "${task.id}" using tool "${toolName}"`);

    try {
      // Merge task metadata with provided context for tool input
      const toolInput = {
        ...task.metadata,
        ...context,
      };

      const result = await this.toolRegistry.executeTool(toolName, toolInput);

      return {
        success: true,
        data: result,
        taskId: task.id,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[TaskExecutor] Failed to execute task "${task.id}": ${message}`);
      
      return {
        success: false,
        error: message,
        taskId: task.id,
      };
    }
  }

  /**
   * Maps a task to a tool name.
   * Prioritizes the 'tool' field from StructuredTask, falls back to description.
   */
  private resolveToolName(task: Task | StructuredTask): string {
    if ('tool' in task) {
      return task.tool;
    }
    return task.description;
  }
}
