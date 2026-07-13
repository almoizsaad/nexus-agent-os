import { AgentActionType, AgentEventType } from '../types/agent';
import type { AgentProtocolAction } from '../types/agent';
import { EventBus } from '../core/EventBus';
import { useWorkspaceStore } from '../../workspace/state/workspaceStore';
import type { WorkspaceComponent } from '../../workspace/state/workspaceTypes';
import { globalWorkspaceBus } from '../../workspace/events/WorkspaceEventBus';

/**
 * WorkspaceAdapter maps Agent actions into Workspace state changes
 * and bridges Workspace events back to the Agent.
 */
export class WorkspaceAdapter {
  private eventBus: EventBus;
  private unsubscribers: Array<() => void> = [];

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.setupSubscriptions();
  }

  private setupSubscriptions() {
    const workspace = useWorkspaceStore.getState();

    // 1. Agent -> Workspace (Actions)
    const unsubActions = this.eventBus.subscribe<AgentProtocolAction>('agent:actions', (action: AgentProtocolAction) => {
      switch (action.type) {
        case AgentActionType.UPDATE_WORKSPACE:
          if (action.payload.metadata?.components) {
            const components = action.payload.metadata.components as WorkspaceComponent[];
            workspace.setComponents(components);
          }
          break;

        case AgentActionType.AGENT_UPDATE:
          // Handle global agent status if needed
          break;

        case AgentActionType.RENDER_COMPONENT:
          workspace.addComponent(action.payload as unknown as WorkspaceComponent);
          break;

        case AgentActionType.UPDATE_COMPONENT: {
          const { id, updates } = action.payload as { id: string; updates: Partial<WorkspaceComponent> };
          workspace.updateComponent(id, updates);
          break;
        }

        case AgentActionType.UPDATE_ENTITY:
          // This could be mapped to a specific entity in the workspace or knowledge graph
          console.log('[WorkspaceAdapter] Agent updating entity:', action.payload);
          break;
      }
    });
    this.unsubscribers.push(unsubActions);

    // 2. Workspace -> Agent (Bridge)
    const unsubWorkspace = globalWorkspaceBus.onEvent((event) => {
      if (event.type === 'REQUEST_AGENT_ACTION') {
        this.eventBus.publish('agent:events', {
          type: AgentEventType.WORKSPACE_ACTION,
          payload: {
            action: event.payload.actionType as string,
            metadata: event.payload.args as Record<string, unknown>,
          },
          timestamp: Date.now(),
        });
      }
    });
    
    if (typeof unsubWorkspace === 'function') {
      this.unsubscribers.push(unsubWorkspace);
    }
  }

  public destroy() {
    this.unsubscribers.forEach(unsub => unsub());
    this.unsubscribers = [];
  }
}
