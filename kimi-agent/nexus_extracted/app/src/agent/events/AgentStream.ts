import type { EventBus } from '../core/EventBus';
import { AgentEventType } from '../types/agent';

/**
 * AgentStream provides a high-level API for emitting progress events 
 * during the autonomous agent cycle.
 */
export class AgentStream {
  private eventBus: EventBus;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  public thinking(message: string = 'Agent is thinking...'): void {
    this.emitStatus('thinking', message);
  }

  public planning(goal: string): void {
    this.emitStatus('thinking', `Planning for: ${goal}`);
  }

  public executingTool(toolName: string, args?: any): void {
    this.emitStatus('executing', `Executing tool: ${toolName}`, 0, { toolName, args });
  }

  public completing(message: string = 'Goal accomplished.'): void {
    this.emitStatus('idle', message, 100);
  }

  public error(message: string, fatal: boolean = false): void {
    this.eventBus.publish('agent:events', {
      type: AgentEventType.ERROR,
      payload: {
        code: 'RUNTIME_ERROR',
        message,
        fatal
      },
      timestamp: Date.now()
    });
  }

  private emitStatus(
    status: string, 
    message: string, 
    progress?: number, 
    data?: any
  ): void {
    this.eventBus.publish('agent:actions', {
      type: 'AGENT_UPDATE',
      payload: {
        status,
        message,
        progress,
        data
      }
    });
  }
}
