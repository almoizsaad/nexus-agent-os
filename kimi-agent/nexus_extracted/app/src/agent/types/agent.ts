export const AgentEventType = {
  USER_MESSAGE: 'USER_MESSAGE',
  WORKSPACE_ACTION: 'WORKSPACE_ACTION',
  TOOL_RESULT: 'TOOL_RESULT',
  AGENT_UPDATE: 'AGENT_UPDATE',
  ERROR: 'ERROR',
} as const;

export type AgentEventType = typeof AgentEventType[keyof typeof AgentEventType];

export const AgentActionType = {
  UPDATE_WORKSPACE: 'UPDATE_WORKSPACE',
  REQUEST_TOOL: 'REQUEST_TOOL',
  SHOW_NOTIFICATION: 'SHOW_NOTIFICATION',
  UPDATE_PLAN: 'UPDATE_PLAN',
  AGENT_UPDATE: 'AGENT_UPDATE',
  RENDER_COMPONENT: 'RENDER_COMPONENT',
  REQUIRE_APPROVAL: 'REQUIRE_APPROVAL',
} as const;

export type AgentActionType = typeof AgentActionType[keyof typeof AgentActionType];

export type AgentStatus = 'idle' | 'thinking' | 'executing' | 'error';

export interface Task {
  id: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  metadata?: Record<string, unknown>;
}

export interface Plan {
  id: string;
  tasks: Task[];
  goal: string;
  reasoning?: string;
  createdAt: number;
}

export interface AgentState {
  status: AgentStatus;
  currentPlan?: Plan;
  history: AgentEvent[];
}

export interface AgentEvent {
  type: AgentEventType;
  payload: Record<string, unknown>;
  timestamp: number;
}

export interface AgentAction {
  type: AgentActionType;
  payload: Record<string, unknown>;
}

// --- Protocol Actions ---

export interface UpdateWorkspaceAction {
  type: typeof AgentActionType.UPDATE_WORKSPACE;
  payload: {
    files?: Array<{ path: string; content: string }>;
    deleteFiles?: string[];
    metadata?: Record<string, unknown>;
  };
}

export interface RequestToolAction {
  type: typeof AgentActionType.REQUEST_TOOL;
  payload: {
    toolName: string;
    args: Record<string, unknown>;
  };
}

export interface ShowNotificationAction {
  type: typeof AgentActionType.SHOW_NOTIFICATION;
  payload: {
    message: string;
    level: 'info' | 'warning' | 'error' | 'success';
  };
}

export interface UpdatePlanAction {
  type: typeof AgentActionType.UPDATE_PLAN;
  payload: {
    planId: string;
    tasks: Array<{
      id: string;
      status: 'pending' | 'in-progress' | 'completed' | 'failed';
    }>;
  };
}

export interface AgentUpdateAction {
  type: typeof AgentActionType.AGENT_UPDATE;
  payload: {
    status: string;
    message?: string;
    progress?: number;
    data?: Record<string, unknown>;
  };
}

export interface RenderComponentAction {
  type: typeof AgentActionType.RENDER_COMPONENT;
  payload: {
    componentId: string;
    props: Record<string, unknown>;
    position?: 'sidebar' | 'main' | 'modal';
  };
}

export interface RequireApprovalAction {
  type: typeof AgentActionType.REQUIRE_APPROVAL;
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

// --- Protocol Events ---

export interface UserMessageEvent extends AgentEvent {
  type: typeof AgentEventType.USER_MESSAGE;
  payload: {
    text: string;
    sender: 'user';
  };
}

export interface WorkspaceActionEvent extends AgentEvent {
  type: typeof AgentEventType.WORKSPACE_ACTION;
  payload: {
    action: string;
    path?: string;
    metadata?: Record<string, unknown>;
  };
}

export interface ToolResultEvent extends AgentEvent {
  type: typeof AgentEventType.TOOL_RESULT;
  payload: {
    toolName: string;
    result: unknown;
    success: boolean;
  };
}

export interface AgentUpdateEvent extends AgentEvent {
  type: typeof AgentEventType.AGENT_UPDATE;
  payload: {
    status: string;
    message?: string;
    progress?: number;
  };
}

export interface ErrorEvent extends AgentEvent {
  type: typeof AgentEventType.ERROR;
  payload: {
    code: string;
    message: string;
    details?: unknown;
    fatal: boolean;
  };
}

export type AgentProtocolEvent = 
  | UserMessageEvent 
  | WorkspaceActionEvent 
  | ToolResultEvent 
  | AgentUpdateEvent
  | ErrorEvent;

// --- Extension Points ---

export interface Planner {
  generatePlan(goal: string, state: AgentState): Promise<Plan>;
}

export interface Executor {
  executeTask(task: Task, context: Record<string, unknown>): Promise<Record<string, unknown>>;
}

export interface Memory {
  store(key: string, value: unknown): Promise<void>;
  retrieve(key: string): Promise<unknown>;
  search(query: string): Promise<unknown[]>;
}
