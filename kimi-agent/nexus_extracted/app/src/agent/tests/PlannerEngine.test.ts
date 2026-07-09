import { describe, it, expect, vi } from 'vitest';
import { PlannerEngine } from '../planner/PlannerEngine';
import { MockLLMProvider } from '../providers/MockLLMProvider';
import { ToolRegistry } from '../tools/ToolRegistry';

describe('PlannerEngine', () => {
  it('should generate a structured plan from a goal', async () => {
    const provider = new MockLLMProvider();
    const registry = new ToolRegistry();
    const engine = new PlannerEngine(provider, registry);
    
    const plan = await engine.generatePlan('Plan a trip', { status: 'idle', history: [] });
    
    expect(plan.goal).toBe('Plan a trip');
    expect(plan.tasks.length).toBeGreaterThan(0);
    expect(plan.reasoning).toBeDefined();
    expect(plan.tasks[0].status).toBe('pending');
  });
});
