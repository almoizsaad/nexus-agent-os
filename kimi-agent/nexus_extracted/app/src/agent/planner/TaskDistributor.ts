import type { DelegatedTask } from '../types/planning';
import { AgentRegistry } from '../core/AgentRegistry';

export class TaskDistributor {
  private registry: AgentRegistry;

  constructor(registry: AgentRegistry) {
    this.registry = registry;
  }

  public findBestAssignee(task: DelegatedTask): string | undefined {
    const requiredRole = task.assignedRole;
    const requiredCapability = (task.metadata?.requiredCapability as string) || '';

    let candidates = this.registry.listAgents();

    if (requiredRole) {
      candidates = candidates.filter(a => a.identity.role === requiredRole);
    } else {
      // By default, don't assign to coordinators/orchestrators unless they are the only ones
      // or if they are specifically requested (handled above)
      const nonCoordinators = candidates.filter(a => a.identity.role !== 'coordinator' && a.identity.role !== 'orchestrator');
      if (nonCoordinators.length > 0) {
        candidates = nonCoordinators;
      }
    }

    if (requiredCapability) {
      candidates = candidates.filter(a => a.identity.capabilities.includes(requiredCapability));
    }

    // Simple heuristic: pick the first available candidate
    // In a more advanced version, we could check agent load or performance metrics
    return candidates[0]?.identity.id;
  }

  public distributeTasks(tasks: DelegatedTask[]): DelegatedTask[] {
    return tasks.map(task => ({
      ...task,
      assigneeId: task.assigneeId || this.findBestAssignee(task)
    }));
  }
}
