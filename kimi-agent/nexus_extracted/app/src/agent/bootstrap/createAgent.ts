import { globalContainer, ServiceContainer } from '../core/ServiceContainer';
import { DependencyRegistry } from '../core/DependencyRegistry';
import { EventBus } from './EventBus';
import { ToolRegistry } from '../tools/ToolRegistry';
import { registerDefaultTools } from '../tools/registerTools';
import { AgentFactory } from '../core/AgentFactory';
import { AgentManager } from '../core/AgentManager';
import { KnowledgeGraph } from '../knowledge/KnowledgeGraph';
import { KnowledgeDatabase } from '../knowledge/KnowledgeDatabase';
import { PerformanceMonitor } from '../improvement/PerformanceMonitor';
import { ImprovementEngine } from '../improvement/ImprovementEngine';
import { OptimizationSuggestions } from '../improvement/OptimizationSuggestions';
import { AgentRuntime } from '../core/AgentRuntime';

/**
 * Bootstraps and returns a fully configured Agent OS instance using DI.
 * Defaults to a new container for isolation (important for tests).
 */
export function createAgent(container: ServiceContainer = new ServiceContainer()) {
  // Register all core services
  DependencyRegistry.registerCoreServices(container);

  // Resolve main components
  const eventBus = container.resolve(EventBus);
  const toolRegistry = container.resolve(ToolRegistry);
  const knowledgeDb = container.resolve(KnowledgeDatabase);

  // Register default production tools
  registerDefaultTools(toolRegistry, knowledgeDb);

  const monitor = container.resolve(PerformanceMonitor);
  const improvementEngine = container.resolve(ImprovementEngine);
  const suggestions = container.resolve(OptimizationSuggestions);
  const knowledgeGraph = container.resolve(KnowledgeGraph);
  container.resolve(AgentFactory);
  const manager = container.resolve(AgentManager);

  // Get or create default runtime instance
  const runtime = container.resolve(AgentRuntime);


  return {
    runtime,
    manager,
    eventBus,
    toolRegistry,
    planner: container.resolve('Planner'),
    executor: container.resolve('Executor'),
    provider: container.resolve('LLMProvider'),
    monitor,
    improvementEngine,
    suggestions,
    knowledgeGraph,
    container
  };
}

// Global agent instance (legacy support, now points to global container's runtime)
export const agent = createAgent(globalContainer);
