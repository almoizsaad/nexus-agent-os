import { AgentActionType } from '../types/agent';

export interface UpdateWorkspaceAction {
  type: AgentActionType.UPDATE_WORKSPACE;
  payload: {
    files?: Array<{ path: string; content: string }>;
    deleteFiles?: string[];
  };
}

export interface RequestToolAction {
  type: AgentActionType.REQUEST_TOOL;
  payload: {
    toolName: string;
    args: Record<string, unknown>;
  };
}

export interface ShowNotificationAction {
  type: AgentActionType.SHOW_NOTIFICATION;
  payload: {
    message: string;
    level: 'info' | 'warning' | 'error' | 'success';
  };
}

export interface UpdatePlanAction {
  type: AgentActionType.UPDATE_PLAN;
  payload: {
    planId: string;
    tasks: Array<{
      id: string;
      status: 'pending' | 'in-progress' | 'completed' | 'failed';
    }>;
  };
}

export interface AgentUpdateAction {
  type: AgentActionType.AGENT_UPDATE;
  payload: {
    status: string;
    message?: string;
    progress?: number;
    data?: Record<string, unknown>;
  };
}

export type AgentProtocolAction =
  | UpdateWorkspaceAction
  | RequestToolAction
  | ShowNotificationAction
  | UpdatePlanAction
  | AgentUpdateAction;
