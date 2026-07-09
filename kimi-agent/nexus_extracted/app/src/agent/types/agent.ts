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

export interface AgentState {
  status: AgentStatus;
  currentPlan?: Plan;
  history: AgentEvent[];
}

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

export interface AgentAction {
  type: AgentActionType;
  payload: Record<string, unknown>;
}

export interface AgentEvent {
  type: AgentEventType;
  payload: Record<string, unknown>;
  timestamp: number;
}

// Interfaces for future extension points
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

export type { AgentProtocolAction } from '../protocol/actions';
export type { AgentProtocolEvent } from '../protocol/events';
