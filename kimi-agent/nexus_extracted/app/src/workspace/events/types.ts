export enum WorkspaceEventType {
  SELECT_COMPONENT = 'SELECT_COMPONENT',
  UPDATE_COMPONENT = 'UPDATE_COMPONENT',
  SUBMIT_FORM = 'SUBMIT_FORM',
  REQUEST_AGENT_ACTION = 'REQUEST_AGENT_ACTION',
}

export interface WorkspaceEvent<T = any> {
  type: WorkspaceEventType;
  payload: T;
  source: string; // ID of the component that triggered the event
  timestamp: number;
}
