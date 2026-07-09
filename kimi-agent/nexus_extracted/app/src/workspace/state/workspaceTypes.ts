export interface WorkspaceComponent {
  id: string;
  type: string;
  props: Record<string, any>;
  status: 'loading' | 'ready' | 'error' | 'stale';
  metadata?: Record<string, any>;
}

export interface WorkspaceState {
  components: WorkspaceComponent[];
  selectedId: string | null;
  interactionHistory: any[];
  isLocked: boolean; // For human approval or workflow pauses
}
