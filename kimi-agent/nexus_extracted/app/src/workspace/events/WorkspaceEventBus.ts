import { EventBus } from '../../agent/core/EventBus';
import { WorkspaceEvent } from './types';

/**
 * WorkspaceEventBus specializes the generic EventBus for UI-Agent interactions.
 */
export class WorkspaceEventBus extends EventBus {
  public static TOPIC = 'workspace:events';

  public emit(event: WorkspaceEvent): void {
    console.log(`[WorkspaceEventBus] Emitting: ${event.type} from ${event.source}`);
    this.publish(WorkspaceEventBus.TOPIC, event);
  }

  public onEvent(callback: (event: WorkspaceEvent) => void): () => void {
    return this.subscribe(WorkspaceEventBus.TOPIC, callback);
  }
}

export const globalWorkspaceBus = new WorkspaceEventBus();
