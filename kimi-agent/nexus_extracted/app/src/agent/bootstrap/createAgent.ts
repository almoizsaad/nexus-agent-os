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
  
  // Register default tools
  toolRegistry.register(new MockWeatherTool());
  
  const provider = new MockLLMProvider();
  const fallbackPlanner = new TaskPlanner();
  const planner = new LLMPlanner(provider, toolRegistry, fallbackPlanner, monitor);
  
  const executor = new TaskExecutor(toolRegistry, monitor);
  
  const runtime = new AgentRuntime(eventBus, planner, executor, monitor, improvementEngine, suggestions);

  const manager = new AgentManager(eventBus, (identity: AgentIdentity) => {
    return new AgentRuntime(eventBus, planner, executor, monitor, improvementEngine, suggestions, identity);
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
    suggestions
  };
}

// Global agent instance
export const agent = createAgent();
