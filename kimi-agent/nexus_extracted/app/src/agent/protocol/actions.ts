

export interface UpdateWorkspaceAction {
  type: 'UPDATE_WORKSPACE';
  payload: {
    files?: Array<{ path: string; content: string }>;
    deleteFiles?: string[];
    metadata?: Record<string, any>;
  };
}

export interface RequestToolAction {
  type: 'REQUEST_TOOL';
  payload: {
    toolName: string;
    args: Record<string, unknown>;
  };
}

export interface ShowNotificationAction {
  type: 'SHOW_NOTIFICATION';
  payload: {
    message: string;
    level: 'info' | 'warning' | 'error' | 'success';
  };
}

export interface UpdatePlanAction {
  type: 'UPDATE_PLAN';
  payload: {
    planId: string;
    tasks: Array<{
      id: string;
      status: 'pending' | 'in-progress' | 'completed' | 'failed';
    }>;
  };
}

export interface AgentUpdateAction {
  type: 'AGENT_UPDATE';
  payload: {
    status: string;
    message?: string;
    progress?: number;
    data?: Record<string, unknown>;
  };
}

export interface RenderComponentAction {
  type: 'RENDER_COMPONENT';
  payload: {
    componentId: string;
    props: Record<string, any>;
    position?: 'sidebar' | 'main' | 'modal';
  };
}

export interface RequireApprovalAction {
  type: 'REQUIRE_APPROVAL';
  payload: {
    requestId: string;
    message: string;
    action: AgentProtocolAction;
  };
}

export type AgentProtocolAction =
  | UpdateWorkspaceAction
  | RequestToolAction
  | ShowNotificationAction
  | UpdatePlanAction
  | AgentUpdateAction
  | RenderComponentAction
  | RequireApprovalAction;
