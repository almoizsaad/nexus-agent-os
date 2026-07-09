import { describe, it, expect, vi } from 'vitest';
import { AgentRuntime } from '../core/AgentRuntime';
import { EventBus } from '../core/EventBus';
import { PlannerEngine } from '../planner/PlannerEngine';
import { MockLLMProvider } from '../providers/MockLLMProvider';
import { ToolRegistry } from '../tools/ToolRegistry';
import { TaskExecutor } from '../executor/TaskExecutor';
import { AgentEventType } from '../types/agent';

describe('Agent OS E2E v2', () => {
  it('should run a full autonomous cycle', async () => {
    const eventBus = new EventBus();
    const provider = new MockLLMProvider();
    const registry = new ToolRegistry();
    const planner = new PlannerEngine(provider, registry);
    const executor = new TaskExecutor(registry);
    const runtime = new AgentRuntime(eventBus, planner, executor);

    // Mock tools
    registry.register({ name: 'search_flights', description: 'flights', execute: async () => ({}) });
    registry.register({ name: 'find_hotels', description: 'hotels', execute: async () => ({}) });
    registry.register({ name: 'get_current_weather', description: 'weather', execute: async () => ({}) });

    const actionListener = vi.fn();
    eventBus.subscribe('agent:actions', actionListener);

    // Send goal
    eventBus.publish('agent:events', {
      type: AgentEventType.USER_MESSAGE,
      payload: { text: 'Plan a trip to Tokyo' },
      timestamp: Date.now()
    });

    // Wait for the autonomous cycle
    await new Promise(resolve => setTimeout(resolve, 500));

    expect(runtime.getStatus()).toBe('idle');
    expect(actionListener).toHaveBeenCalled();
  });
});
