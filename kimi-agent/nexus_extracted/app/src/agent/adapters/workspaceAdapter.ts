import { agent } from '../bootstrap/createAgent';
import { AgentActionType } from '../types/agent';
import type { AgentProtocolAction } from '../types/agent';
import { useWorkspaceStore } from '../../workspace/state/workspaceStore';
import type { WorkspaceComponent } from '../../workspace/state/workspaceTypes';

/**
 * WorkspaceAdapter maps Agent actions into Workspace state changes.
 */
export function setupWorkspaceAdapter() {
  const workspace = useWorkspaceStore.getState();

  agent.eventBus.subscribe<AgentProtocolAction>('agent:actions', (action) => {
    switch (action.type) {
      case AgentActionType.UPDATE_WORKSPACE:
        // For simple file updates, we might just log. 
        // But if the agent sends UI components, we map them.
        if (action.payload.metadata?.components) {
          const components = action.payload.metadata.components as WorkspaceComponent[];
          workspace.setComponents(components);
        }
        break;

      case AgentActionType.AGENT_UPDATE:
        // We can update component statuses based on agent progress
        if (action.payload.data?.taskId) {
          // Find component associated with this task if any
        }
        break;
        
      // NEW CUSTOM ACTIONS for workspace
      case 'SHOW_COMPONENT' as any:
        workspace.addComponent(action.payload as unknown as WorkspaceComponent);
        break;

      case 'REMOVE_COMPONENT' as any:
        workspace.removeComponent((action.payload as any).id);
        break;

      case 'SET_WORKSPACE_STATE' as any:
        workspace.setComponents((action.payload as any).components);
        break;
    }
  });
}
