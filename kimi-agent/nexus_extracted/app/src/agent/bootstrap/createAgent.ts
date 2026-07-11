import { EventBus } from '../core/EventBus';
import { ToolRegistry } from '../tools/ToolRegistry';
import { TaskPlanner } from '../planner/TaskPlanner';
import { TaskExecutor } from '../executor/TaskExecutor';
import { AgentRuntime } from '../core/AgentRuntime';
import { MockWeatherTool } from '../tools/mocks/MockWeatherTool';
import { LLMPlanner } from '../planner/LLMPlanner';
import { MockLLMProvider } from '../providers/MockLLMProvider';
import { PerformanceMonitor } from '../improvement/PerformanceMonitor';
import { ImprovementEngine } from '../improvement/ImprovementEngine';
import { OptimizationSuggestions } from '../improvement/OptimizationSuggestions';
import { AgentManager } from '../core/AgentManager';
import { AgentChannel } from '../core/AgentChannel';
import { KnowledgeGraph } from '../knowledge/KnowledgeGraph';
import type { AgentIdentity } from '../types/agent';

/**
 * Bootstraps and returns a fully configured Agent OS instance.
 */
export function createAgent() {
  const eventBus = new EventBus();
  const toolRegistry = new ToolRegistry();
  const monitor = new PerformanceMonitor();
  const improvementEngine = new ImprovementEngine();
  const suggestions = new OptimizationSuggestions();
  const knowledgeGraph = new KnowledgeGraph();
  
  // Register default tools
  toolRegistry.register(new MockWeatherTool());
  
  const provider = new MockLLMProvider();
  const fallbackPlanner = new TaskPlanner();
  const planner = new LLMPlanner(provider, toolRegistry, fallbackPlanner, monitor, knowledgeGraph);
  
  const executor = new TaskExecutor(toolRegistry, monitor);
  
  const runtime = new AgentRuntime(eventBus, planner, executor, monitor, improvementEngine, suggestions, undefined, undefined, knowledgeGraph);

  const manager = new AgentManager(eventBus, (identity: AgentIdentity, channel: AgentChannel) => {
    return new AgentRuntime(eventBus, planner, executor, monitor, improvementEngine, suggestions, identity, channel, knowledgeGraph);
  });

  return {
    runtime,
    manager,
    eventBus,
    toolRegistry,
    planner,
    executor,
    provider,
    monitor,
    improvementEngine,
    suggestions,
    knowledgeGraph
  };
}

// Global agent instance
export const agent = createAgent();
