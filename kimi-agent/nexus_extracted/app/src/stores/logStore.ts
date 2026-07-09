import { create } from 'zustand';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  source: string;
  message: string;
  metadata?: Record<string, unknown>;
}

interface LogState {
  entries: LogEntry[];
  filterLevel: LogLevel | 'all';
  addEntry: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  clearEntries: () => void;
  setFilterLevel: (level: LogLevel | 'all') => void;
  getFilteredEntries: () => LogEntry[];
}

export const useLogStore = create<LogState>((set, get) => ({
  entries: [
    {
      id: 'init-1',
      timestamp: new Date(Date.now() - 60000).toISOString(),
      level: 'info',
      source: 'System',
      message: 'Nexus workspace initialized',
    },
    {
      id: 'init-2',
      timestamp: new Date(Date.now() - 55000).toISOString(),
      level: 'info',
      source: 'IntentAnalyzer',
      message: 'Intent engine loaded with 6 intent categories',
    },
    {
      id: 'init-3',
      timestamp: new Date(Date.now() - 50000).toISOString(),
      level: 'debug',
      source: 'UIGenerator',
      message: 'Component library ready: 8 component types',
    },
    {
      id: 'init-4',
      timestamp: new Date(Date.now() - 45000).toISOString(),
      level: 'info',
      source: 'PredictiveEngine',
      message: 'Predictive models loaded — context-aware suggestions enabled',
    },
    {
      id: 'init-5',
      timestamp: new Date(Date.now() - 40000).toISOString(),
      level: 'info',
      source: 'NeuralCore',
      message: 'AI connection ready — Moonshot API v1',
    },
  ],
  filterLevel: 'all',

  addEntry: (entry) =>
    set((state) => ({
      entries: [
        ...state.entries,
        {
          ...entry,
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
        },
      ].slice(-200), // Keep last 200 entries
    })),

  clearEntries: () =>
    set({
      entries: [{
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        level: 'info',
        source: 'System',
        message: 'Log cleared by user',
      }],
    }),

  setFilterLevel: (level) => set({ filterLevel: level }),

  getFilteredEntries: () => {
    const { entries, filterLevel } = get();
    if (filterLevel === 'all') return entries;
    return entries.filter((e) => e.level === filterLevel);
  },
}));

// Convenience function for adding logs outside React components
export function addLog(
  level: LogLevel,
  source: string,
  message: string,
  metadata?: Record<string, unknown>
) {
  useLogStore.getState().addEntry({ level, source, message, metadata });
}
