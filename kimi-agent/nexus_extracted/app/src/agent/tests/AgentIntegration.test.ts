import { describe, it, expect, vi } from 'vitest';
import { createAgent } from '../bootstrap/createAgent';
import { AgentEventType, AgentActionType } from '../types/agent';

describe('Agent OS Integration', () => {
  it('should complete a full loop: User Message -> Plan -> Execute -> Actions', async () => {
    const { runtime, eventBus, toolRegistry } = createAgent();
    
    // Register missing tools for the "Plan a trip" goal
    toolRegistry.register({ name: 'search_flights', description: 'flights', execute: async () => ({ success: true }) });
    toolRegistry.register({ name: 'find_hotels', description: 'hotels', execute: async () => ({ success: true }) });
    
    const actionListener = vi.fn();
    
    eventBus.subscribe('agent:actions', actionListener);

    // 1. Simulate User Message
    eventBus.publish('agent:events', {
      type: AgentEventType.USER_MESSAGE,
      payload: { text: 'Plan a trip' },
      timestamp: Date.now(),
    });

    // Wait for the async process to complete (TaskPlanner and TaskExecutor are async)
    // In our deterministic mock, it should be relatively fast.
    // We can use a small delay or a more robust wait mechanism.
    await new Promise((resolve) => setTimeout(resolve, 100));

    // 2. Verify Actions Emitted
    // Should have AGENT_UPDATE (thinking), UPDATE_PLAN, AGENT_UPDATE (executing), etc.
    expect(actionListener).toHaveBeenCalled();
    
    const actions = actionListener.mock.calls.map(call => call[0].type);
    
    expect(actions).toContain(AgentActionType.AGENT_UPDATE);
    expect(actions).toContain(AgentActionType.UPDATE_PLAN);
    
    // Verify final state is idle
    expect(runtime.getStatus()).toBe('idle');
  });
});
