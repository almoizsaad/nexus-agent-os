import { AgentEvent, AgentEventType } from '../types/agent';

export interface UserMessageEvent extends AgentEvent {
  type: AgentEventType.USER_MESSAGE;
  payload: {
    text: string;
    sender: 'user';
  };
}

export interface WorkspaceActionEvent extends AgentEvent {
  type: AgentEventType.WORKSPACE_ACTION;
  payload: {
    action: string;
    path?: string;
    metadata?: Record<string, any>;
  };
}

export interface ToolResultEvent extends AgentEvent {
  type: AgentEventType.TOOL_RESULT;
  payload: {
    toolName: string;
    result: any;
    success: boolean;
  };
}

export interface AgentUpdateEvent extends AgentEvent {
  type: AgentEventType.AGENT_UPDATE;
  payload: {
    status: string;
    message?: string;
    progress?: number;
  };
}

export type AgentProtocolEvent = 
  | UserMessageEvent 
  | WorkspaceActionEvent 
  | ToolResultEvent 
  | AgentUpdateEvent;
