import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary';
import { setupZustandAdapter } from './agent';
import { initializeRegistry } from './registry/defaultRegistry';
import { setupWorkspaceAdapter } from './agent/adapters/workspaceAdapter';

// Initialize Agent OS adapters and registries
initializeRegistry();
setupZustandAdapter();
setupWorkspaceAdapter();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <App />
      </HashRouter>
    </QueryClientProvider>
  </ErrorBoundary>
);
