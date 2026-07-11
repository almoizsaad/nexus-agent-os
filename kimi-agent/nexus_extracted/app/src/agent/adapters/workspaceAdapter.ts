import { agent } from '../bootstrap/createAgent';
import { AgentActionType, AgentEventType } from '../types/agent';
import type { AgentProtocolAction } from '../types/agent';
import { useWorkspaceStore } from '../../workspace/state/workspaceStore';
import type { WorkspaceComponent } from '../../workspace/state/workspaceTypes';
import { globalWorkspaceBus } from '../../workspace/events/WorkspaceEventBus';

/**
 * WorkspaceAdapter maps Agent actions into Workspace state changes
 * and bridges Workspace events back to the Agent.
 */
export function setupWorkspaceAdapter() {
  const workspace = useWorkspaceStore.getState();

  // 1. Agent -> Workspace (Actions)
  agent.eventBus.subscribe<AgentProtocolAction>('agent:actions', (action) => {
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
    }
  });

  // 2. Workspace -> Agent (Bridge)
  globalWorkspaceBus.onEvent((event) => {
    if (event.type === 'REQUEST_AGENT_ACTION') {
      agent.eventBus.publish('agent:events', {
        type: AgentEventType.WORKSPACE_ACTION,
        payload: {
          action: event.payload.actionType as string,
          metadata: event.payload.args as Record<string, unknown>,
        },
        timestamp: Date.now(),
      });
    }
  });
}
