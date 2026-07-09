import { globalWorkspaceBus } from './WorkspaceEventBus';
import { WorkspaceEventType } from './types';

/**
 * Helpers for UI components to communicate with the Workspace/Agent.
 */
export const componentEvents = {
  select: (componentId: string, data?: any) => {
    globalWorkspaceBus.emit({
      type: WorkspaceEventType.SELECT_COMPONENT,
      source: componentId,
      payload: data,
      timestamp: Date.now(),
    });
  },

  update: (componentId: string, updates: any) => {
    globalWorkspaceBus.emit({
      type: WorkspaceEventType.UPDATE_COMPONENT,
      source: componentId,
      payload: updates,
      timestamp: Date.now(),
    });
  },

  action: (componentId: string, actionType: string, args: any) => {
    globalWorkspaceBus.emit({
      type: WorkspaceEventType.REQUEST_AGENT_ACTION,
      source: componentId,
      payload: { actionType, args },
      timestamp: Date.now(),
    });
  },
};
