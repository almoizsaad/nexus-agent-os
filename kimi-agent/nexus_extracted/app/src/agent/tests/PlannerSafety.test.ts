import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PlannerEngine } from '../planner/PlannerEngine';
import { LLMPlanner } from '../planner/LLMPlanner';
import { MockLLMProvider } from '../providers/MockLLMProvider';
import { ToolRegistry } from '../tools/ToolRegistry';
import { SafetyGuard } from '../core/SafetyLayer';

describe('Planner Safety Integration', () => {
  let provider: MockLLMProvider;
  let registry: ToolRegistry;
  let safetyGuard: SafetyGuard;

  beforeEach(() => {
    provider = new MockLLMProvider();
    registry = new ToolRegistry();
    safetyGuard = new SafetyGuard();
  });

  it('PlannerEngine should reject unsafe plans', async () => {
    const engine = new PlannerEngine(provider, registry, undefined, safetyGuard);
    
    // Mock the provider to return a dangerous plan
    vi.spyOn(provider, 'generateStructuredOutput').mockResolvedValue({
      id: 'p-dangerous',
      goal: 'Hack system',
      reasoning: 'I need to hack',
      tasks: [
        { id: 't1', description: 'Delete all logs', status: 'pending' },
        { id: 't2', description: 'Execute shell malware', status: 'pending' }
      ]
    });

    await expect(engine.generatePlan('Dangerous Goal', { status: 'idle', history: [] }))
      .rejects.toThrow('Safety Violation');
  });

  it('LLMPlanner should reject unsafe plans', async () => {
    registry.register({ name: 'read_secrets', description: 'Read secrets', execute: async () => ({ success: true }) });
    const planner = new LLMPlanner(provider, registry, undefined, undefined, undefined, safetyGuard);
    
    vi.spyOn(provider, 'generateStructuredOutput').mockResolvedValue(JSON.stringify({
      id: 'p-dangerous',
      goal: 'Leak data',
      reasoning: 'Leaking is good',
      tasks: [
        { id: 't1', description: 'Get all passwords', status: 'pending', tool: 'read_secrets' }
      ]
    }));

    await expect(planner.generatePlan('Data leak', { status: 'idle', history: [] }))
      .rejects.toThrow('Safety Violation');
  });

  it('should allow safe plans', async () => {
    const engine = new PlannerEngine(provider, registry, undefined, safetyGuard);
    
    vi.spyOn(provider, 'generateStructuredOutput').mockResolvedValue({
      id: 'p-safe',
      goal: 'Read weather',
      reasoning: 'Check if sunny',
      tasks: [
        { id: 't1', description: 'Get weather for Tokyo', status: 'pending' }
      ]
    });

    const plan = await engine.generatePlan('Weather Tokyo', { status: 'idle', history: [] });
    expect(plan.id).toBe('p-safe');
  });
});
