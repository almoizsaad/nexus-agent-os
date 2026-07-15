import { ServiceContainer } from './ServiceContainer';
import { EventBus } from './EventBus';
import { ToolRegistry } from '../tools/ToolRegistry';
import { PerformanceMonitor } from '../improvement/PerformanceMonitor';
import { ImprovementEngine } from '../improvement/ImprovementEngine';
import { OptimizationSuggestions } from '../improvement/OptimizationSuggestions';
import { KnowledgeGraph } from '../knowledge/KnowledgeGraph';
import { KnowledgeDatabase } from '../knowledge/KnowledgeDatabase';
import { EmbeddingStore } from '../knowledge/EmbeddingStore';
import { VectorSearch } from '../knowledge/VectorSearch';
import { GeminiLLMProvider } from '../providers/GeminiLLMProvider';
import { LLMPlanner } from '../planner/LLMPlanner';
import { TaskPlanner } from '../planner/TaskPlanner';
import { TaskExecutor } from '../executor/TaskExecutor';
import { AgentRegistry } from './AgentRegistry';
import { AgentFactory } from './AgentFactory';
import { AgentManager } from './AgentManager';
import type { AgentIdentity, Executor } from '../types/agent';
import { AgentChannel } from './AgentChannel';
import { AgentStream } from '../events/AgentStream';
import { MemoryManager } from '../memory/MemoryManager';

// Phase 8 additions
import { ExecutiveBrain } from './ExecutiveBrain';
import { CoordinatorAgent } from './CoordinatorAgent';
import { AgentRuntime } from './AgentRuntime';
import { WorkflowEngine } from '../workflow/WorkflowEngine';
import { ReflectionEngine } from '../reflection/ReflectionEngine';
import { SafetyGuard } from './SafetyLayer';
import { ThoughtManager } from '../reflection/ThoughtManager';
import { ComponentRegistry } from '../../registry/ComponentRegistry';
import { WorkspaceAdapter } from '../adapters/workspaceAdapter';
import { PersistentMemory } from '../memory/PersistentMemory';

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
    
    // Knowledge Database & Vector Search
    if (!container.has(EmbeddingStore)) container.registerSingleton(EmbeddingStore, new EmbeddingStore());
    if (!container.has(VectorSearch)) container.registerSingleton(VectorSearch, (c) => new VectorSearch(c.resolve(EmbeddingStore)));
    if (!container.has(KnowledgeDatabase)) {
      container.registerSingleton(KnowledgeDatabase, (c) => {
        return new KnowledgeDatabase(
          c.resolve(VectorSearch),
          c.resolve('LLMProvider')
        );
      });
    }

    if (!container.has(AgentRegistry)) container.registerSingleton(AgentRegistry, () => new AgentRegistry());
    
    // Safety
    if (!container.has('Safety')) container.registerSingleton('Safety', new SafetyGuard());

    // Provider/Implementation mapping
    if (!container.has('LLMProvider')) container.registerSingleton('LLMProvider', () => new GeminiLLMProvider());
    
    if (!container.has('Planner')) {
      container.registerSingleton('Planner', (c) => {
        const provider = c.resolve<GeminiLLMProvider>('LLMProvider');
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

    // Workflow & Reflection
    if (!container.has('Workflow')) {
      container.registerSingleton('Workflow', (c) => {
        const executor = c.resolve<Executor>('Executor');
        const monitor = c.resolve(PerformanceMonitor);
        return new WorkflowEngine(executor, monitor);
      });
    }

    if (!container.has('Reflection')) {
      container.registerSingleton('Reflection', (c) => {
        const graph = c.resolve(KnowledgeGraph);
        const stream = c.resolve(AgentStream);
        return new ReflectionEngine(graph, stream);
      });
    }

    // Alias interfaces to implementations
    if (!container.has('PerformanceMonitor')) container.registerSingleton('PerformanceMonitor', (c) => c.resolve(PerformanceMonitor));
    if (!container.has('ImprovementEngine')) container.registerSingleton('ImprovementEngine', (c) => c.resolve(ImprovementEngine));
    if (!container.has('Memory')) container.registerSingleton('Memory', (c) => c.resolve(MemoryManager));

    // Factories
    if (!container.has(AgentFactory)) container.registerSingleton(AgentFactory, (c) => new AgentFactory(c));

    // Thought Management
    if (!container.has(ThoughtManager)) {
      container.registerSingleton(ThoughtManager, (c) => {
        const eventBus = c.resolve(EventBus);
        const persistentMemory = new PersistentMemory();
        return new ThoughtManager(eventBus, persistentMemory);
      });
    }

    // Registry & Adapters
    if (!container.has(ComponentRegistry)) container.registerSingleton(ComponentRegistry, new ComponentRegistry());
    if (!container.has(WorkspaceAdapter)) container.registerSingleton(WorkspaceAdapter, (c) => new WorkspaceAdapter(c.resolve(EventBus)));

    // Manager
    if (!container.has(AgentManager)) {
      container.registerSingleton(AgentManager, (c) => {
        const eventBus = c.resolve(EventBus);
        const factory = c.resolve(AgentFactory);
        const registry = c.resolve(AgentRegistry);
        return new AgentManager(eventBus, (identity: AgentIdentity, channel: AgentChannel) => {
          return factory.createAgent(identity, channel);
        }, registry);
      });
    }

    // Coordinator & Executive Brain
    if (!container.has(CoordinatorAgent)) {
      container.registerSingleton(CoordinatorAgent, (c) => {
        const manager = c.resolve(AgentManager);
        const coordinator = manager.spawnAgent('System Coordinator', 'coordinator', ['orchestration', 'coordination']);
        return coordinator as CoordinatorAgent;
      });
    }

    if (!container.has(ExecutiveBrain)) {
      container.registerSingleton(ExecutiveBrain, (c) => {
        return new ExecutiveBrain(c.resolve(EventBus), c.resolve(CoordinatorAgent));
      });
    }

    // Main AgentRuntime singleton
    if (!container.has(AgentRuntime)) {
      container.registerSingleton(AgentRuntime, (c) => {
        const factory = c.resolve(AgentFactory);
        return factory.createAgent();
      });
    }

    // Self registration
    if (!container.has(DependencyRegistry)) container.registerSingleton(DependencyRegistry, new DependencyRegistry());
  }
}
