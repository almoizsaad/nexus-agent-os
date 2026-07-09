import type { AgentEvent } from '../types/agent';

export interface UserMessageEvent extends AgentEvent {
  type: 'USER_MESSAGE';
  payload: {
    text: string;
    sender: 'user';
  };
}

export interface WorkspaceActionEvent extends AgentEvent {
  type: 'WORKSPACE_ACTION';
  payload: {
    action: string;
    path?: string;
    metadata?: Record<string, any>;
  };
}

export interface ToolResultEvent extends AgentEvent {
  type: 'TOOL_RESULT';
  payload: {
    toolName: string;
    result: any;
    success: boolean;
  };
}

export interface AgentUpdateEvent extends AgentEvent {
  type: 'AGENT_UPDATE';
  payload: {
    status: string;
    message?: string;
    progress?: number;
  };
}

export interface ErrorEvent extends AgentEvent {
  type: 'ERROR';
  payload: {
    code: string;
    message: string;
    details?: any;
    fatal: boolean;
  };
}

export type AgentProtocolEvent = 
  | UserMessageEvent 
  | WorkspaceActionEvent 
  | ToolResultEvent 
  | AgentUpdateEvent
  | ErrorEvent;

