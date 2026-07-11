import { ServiceContainer } from '../core/ServiceContainer';
import { DependencyRegistry } from '../core/DependencyRegistry';
import { EventBus } from '../core/EventBus';
import { ToolRegistry } from '../tools/ToolRegistry';
import { AgentFactory } from '../core/AgentFactory';
import { AgentManager } from '../core/AgentManager';
import { KnowledgeGraph } from '../knowledge/KnowledgeGraph';
import { PerformanceMonitor } from '../improvement/PerformanceMonitor';
import { ImprovementEngine } from '../improvement/ImprovementEngine';
import { OptimizationSuggestions } from '../improvement/OptimizationSuggestions';

/**
 * Bootstraps and returns a fully configured Agent OS instance using DI.
 */
export function createAgent(container: ServiceContainer = new ServiceContainer()) {
  // Register all core services
  DependencyRegistry.registerCoreServices(container);

  // Resolve main components
  const eventBus = container.resolve(EventBus);
  const toolRegistry = container.resolve(ToolRegistry);
  const monitor = container.resolve(PerformanceMonitor);
  const improvementEngine = container.resolve(ImprovementEngine);
  const suggestions = container.resolve(OptimizationSuggestions);
  const knowledgeGraph = container.resolve(KnowledgeGraph);
  const factory = container.resolve(AgentFactory);
  const manager = container.resolve(AgentManager);

  // Create default runtime instance
  const runtime = factory.createAgent();

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

// Global agent instance
export const agent = createAgent();
