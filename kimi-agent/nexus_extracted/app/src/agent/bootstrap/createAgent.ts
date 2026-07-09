import { EventBus } from '../core/EventBus';
import { ToolRegistry } from '../tools/ToolRegistry';
import { TaskPlanner } from '../planner/TaskPlanner';
import { TaskExecutor } from '../executor/TaskExecutor';
import { AgentRuntime } from '../core/AgentRuntime';
import { MockWeatherTool } from '../tools/mocks/MockWeatherTool';
import { LLMPlanner } from '../planner/LLMPlanner';
import { MockLLMProvider } from '../providers/MockLLMProvider';

/**
 * Bootstraps and returns a fully configured Agent OS instance.
 */
export function createAgent() {
  const eventBus = new EventBus();
  const toolRegistry = new ToolRegistry();
  
  // Register default tools
  toolRegistry.register(new MockWeatherTool());
  
  const provider = new MockLLMProvider();
  const fallbackPlanner = new TaskPlanner();
  const planner = new LLMPlanner(provider, toolRegistry, fallbackPlanner);
  
  const executor = new TaskExecutor(toolRegistry);
  
  const runtime = new AgentRuntime(eventBus, planner, executor);

  return {
    runtime,
    eventBus,
    toolRegistry,
    planner,
    executor,
    provider
  };
}

// Global agent instance
export const agent = createAgent();
