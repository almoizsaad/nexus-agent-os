import { ServiceContainer } from './ServiceContainer';
import { EventBus } from './EventBus';
import { ToolRegistry } from '../tools/ToolRegistry';
import { PerformanceMonitor } from '../improvement/PerformanceMonitor';
import { ImprovementEngine } from '../improvement/ImprovementEngine';
import { OptimizationSuggestions } from '../improvement/OptimizationSuggestions';
import { KnowledgeGraph } from '../knowledge/KnowledgeGraph';
import { MockLLMProvider } from '../providers/MockLLMProvider';
import { LLMPlanner } from '../planner/LLMPlanner';
import { TaskPlanner } from '../planner/TaskPlanner';
import { TaskExecutor } from '../executor/TaskExecutor';
import { AgentRegistry } from './AgentRegistry';
import { AgentFactory } from './AgentFactory';
import { AgentManager } from './AgentManager';
import { MockWeatherTool } from '../tools/mocks/MockWeatherTool';
import type { AgentIdentity } from '../types/agent';
import { AgentChannel } from './AgentChannel';
import { AgentStream } from '../events/AgentStream';

import { MemoryManager } from '../memory/MemoryManager';

export class DependencyRegistry {
  public static registerCoreServices(container: ServiceContainer): void {
    // Singletons - only if not already registered
    if (!container.has(EventBus)) container.registerSingleton(EventBus, new EventBus());
    if (!container.has(AgentStream)) container.registerSingleton(AgentStream, (c) => new AgentStream(c.resolve(EventBus)));
    if (!container.has(ToolRegistry)) container.registerSingleton(ToolRegistry, new ToolRegistry());
    if (!container.has(PerformanceMonitor)) container.registerSingleton(PerformanceMonitor, new PerformanceMonitor());
    if (!container.has(MemoryManager)) container.registerSingleton(MemoryManager, (c) => new MemoryManager(c.resolve(PerformanceMonitor)));
    if (!container.has(ImprovementEngine)) container.registerSingleton(ImprovementEngine, new ImprovementEngine());
    if (!container.has(OptimizationSuggestions)) container.registerSingleton(OptimizationSuggestions, new OptimizationSuggestions());
    if (!container.has(KnowledgeGraph)) container.registerSingleton(KnowledgeGraph, new KnowledgeGraph());
    if (!container.has(AgentRegistry)) container.registerSingleton(AgentRegistry, () => new AgentRegistry());
    
    // Provider/Implementation mapping
    if (!container.has('LLMProvider')) container.registerSingleton('LLMProvider', new MockLLMProvider());
    
    if (!container.has('Planner')) {
      container.registerSingleton('Planner', (c) => {
        const provider = c.resolve<MockLLMProvider>('LLMProvider');
        const toolRegistry = c.resolve(ToolRegistry);
        const monitor = c.resolve(PerformanceMonitor);
        const graph = c.resolve(KnowledgeGraph);
        const stream = c.resolve(AgentStream);
        const fallback = new TaskPlanner();
        return new LLMPlanner(provider, toolRegistry, fallback, monitor, graph, undefined, stream);
      });
    }

    if (!container.has('Executor')) {
      container.registerSingleton('Executor', (c) => {
        const toolRegistry = c.resolve(ToolRegistry);
        const monitor = c.resolve(PerformanceMonitor);
        return new TaskExecutor(toolRegistry, monitor);
      });
    }

    // Alias interfaces to implementations
    if (!container.has('PerformanceMonitor')) container.registerSingleton('PerformanceMonitor', (c) => c.resolve(PerformanceMonitor));
    if (!container.has('ImprovementEngine')) container.registerSingleton('ImprovementEngine', (c) => c.resolve(ImprovementEngine));

    // Factories
    if (!container.has(AgentFactory)) container.registerSingleton(AgentFactory, (c) => new AgentFactory(c));

    // Manager
    if (!container.has(AgentManager)) {
      container.registerSingleton(AgentManager, (c) => {
        const eventBus = c.resolve(EventBus);
        const factory = c.resolve(AgentFactory);
        return new AgentManager(eventBus, (identity: AgentIdentity, channel: AgentChannel) => {
          return factory.createAgent(identity, channel);
        });
      });
    }

    // Initialize default tools (idempotent)
    const toolRegistry = container.resolve(ToolRegistry);
    const weatherTool = new MockWeatherTool();
    try {
      toolRegistry.register(weatherTool);
    } catch {
      // Ignore if already registered
    }
  }
}
