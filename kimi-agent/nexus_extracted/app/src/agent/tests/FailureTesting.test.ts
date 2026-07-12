import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createAgent } from '../bootstrap/createAgent';
import { AgentFactory } from '../core/AgentFactory';
import { ExecutiveBrain } from '../core/ExecutiveBrain';
import { CoordinatorAgent } from '../core/CoordinatorAgent';
import { MockLLMProvider } from '../providers/MockLLMProvider';
import type { AgentRole } from '../types/agent';
import { AgentInbox } from '../core/AgentInbox';
import { AgentOutbox } from '../core/AgentOutbox';
import { MessageRouter } from '../core/MessageRouter';
import { AgentMessageBus } from '../core/AgentMessageBus';
import { AgentChannel } from '../core/AgentChannel';
import { EventBus } from '../core/EventBus';
import { AgentRegistry } from '../core/AgentRegistry';
import { ToolRegistry } from '../tools/ToolRegistry';
import { UnifiedEventBus } from '../core/UnifiedEventBus';
import { ServiceContainer } from '../core/ServiceContainer';

describe('Phase 8.3 — Failure Testing', () => {
  let agent: ReturnType<typeof createAgent>;
  let brain: ExecutiveBrain;
  let coordinator: CoordinatorAgent;
  let provider: MockLLMProvider;
  let eventBus: EventBus;

  beforeEach(() => {
    const container = new ServiceContainer();
    provider = new MockLLMProvider();
    container.registerSingleton('LLMProvider', provider);

    const localUnifiedBus = new UnifiedEventBus();
    eventBus = new EventBus(localUnifiedBus);
    container.registerSingleton(EventBus, eventBus);
    
    agent = createAgent(container);
    const factory = agent.container.resolve(AgentFactory);
    const registry = agent.container.resolve(AgentRegistry);
    
    const messageBus = new AgentMessageBus(eventBus);
    const router = new MessageRouter(registry, messageBus);
    
    const identity = { id: 'coordinator', name: 'Coordinator', role: 'coordinator' as AgentRole, capabilities: ['coordination'] };
    const channel = new AgentChannel(identity.id, new AgentInbox(), new AgentOutbox(router));
    messageBus.subscribe(identity.id, (msg) => (channel as any).inbox.push(msg));
    coordinator = factory.createCoordinator(identity, channel);
    
    const workerIdentity = { id: 'worker', name: 'Worker', role: 'worker' as AgentRole, capabilities: ['execution'] };
    const workerChannel = new AgentChannel(workerIdentity.id, new AgentInbox(), new AgentOutbox(router));
    messageBus.subscribe(workerIdentity.id, (msg) => (workerChannel as any).inbox.push(msg));
    const worker = factory.createAgent(workerIdentity, workerChannel);
    
    registry.register(workerIdentity, worker);
    registry.register(identity, coordinator);
    
    workerChannel.onMessage(async (message) => {
      if (message.type === 'TASK_ASSIGNMENT') {
        const payload = message.payload as { taskId: string; description: string; tool: string; metadata?: Record<string, unknown>; planId: string };
        const result = await worker.executor?.executeTask({
          id: payload.taskId,
          description: payload.description,
          tool: payload.tool,
          metadata: payload.metadata,
          dependencies: [],
          status: 'pending'
        } as any, {});
        
        await workerChannel.sendDirect('coordinator', result?.success ? 'TASK_COMPLETED' : 'TASK_FAILED', {
          taskId: payload.taskId,
          planId: payload.planId,
          result: result?.data,
          error: result?.error
        });
      }
    });
    
    provider = agent.container.resolve('LLMProvider') as MockLLMProvider;
    brain = new ExecutiveBrain(eventBus, coordinator);
  });

  const waitForStatus = async (missionId: string, statuses: string[], timeout = 10000) => {
    return new Promise<string>((resolve) => {
      const unsubscribe = eventBus.subscribe('agent:events', (event: { payload?: Record<string, unknown> }) => {
        const payload = (event.payload || event) as Record<string, unknown>;
        if (payload.missionId === missionId && statuses.includes(payload.status as string)) {
          unsubscribe();
          resolve(payload.status as string);
        }
      });
      setTimeout(() => { unsubscribe(); resolve('timeout'); }, timeout);
    });
  };

  it('Failure: Missing Tool (Graceful Error Handling)', async () => {
    provider.setMockResponse({
      id: 'fail-tool',
      goal: 'Use non-existent tool',
      tasks: [{ id: 'T1', description: 'Ghost task', tool: 'ghost_tool', dependencies: [] } as any]
    });

    const missionId = await brain.createMission('Ghost Mission', {
      description: 'Use a tool that does not exist.',
      successCriteria: [],
      priority: 'medium'
    });

    const status = await waitForStatus(missionId, ['PLAN_FAILED', 'failed']);
    expect(status).toBe('PLAN_FAILED');
    
    // Wait a bit for ExecutiveBrain to process the failure and update status
    let mission = brain.getGoalManager().getMission(missionId);
    let attempts = 0;
    while (mission?.status !== 'failed' && attempts < 10) {
      await new Promise(resolve => setTimeout(resolve, 500));
      mission = brain.getGoalManager().getMission(missionId);
      attempts++;
    }
    expect(mission?.status).toBe('failed');
  });

  it('Failure: Invalid Plan (Circular Dependency Detection)', async () => {
    provider.setMockResponse({
      id: 'fail-cycle',
      goal: 'Cyclic goal',
      tasks: [
        { id: 'T1', description: 'Task 1', tool: 'search_flights', dependencies: ['T2'] } as any,
        { id: 'T2', description: 'Task 2', tool: 'find_hotels', dependencies: ['T1'] } as any
      ]
    });

    const missionId = await brain.createMission('Cycle Mission', {
      description: 'A plan with a circular dependency.',
      successCriteria: [],
      priority: 'medium'
    });

    // PlanValidator should detect this and fail planning or start
    const status = await waitForStatus(missionId, ['PLAN_FAILED', 'failed']);
    expect(status).toBe('PLAN_FAILED');
  });

  it('Failure: LLM Provider Outage (Planning Resilience)', async () => {
    vi.spyOn(provider, 'generateStructuredOutput').mockRejectedValue(new Error('LLM Service Down'));

    const missionId = await brain.createMission('Outage Test', {
      description: 'Should fail gracefully when LLM is down.',
      successCriteria: [],
      priority: 'medium'
    });

    const status = await waitForStatus(missionId, ['PLAN_FAILED', 'failed']);
    expect(status).toBe('PLAN_FAILED');
  });

  it('Failure: Slow Tool (Timeout and Recovery)', async () => {
    const toolRegistry = agent.container.resolve(ToolRegistry);
    toolRegistry.register({
      name: 'slow_tool',
      description: 'Takes too long',
      execute: async () => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return { done: true };
      }
    });

    provider.setMockResponse({
      id: 'fail-slow',
      goal: 'Slow goal',
      tasks: [{ id: 'S1', description: 'Slow task', tool: 'slow_tool', dependencies: [] } as any]
    });

    const missionId = await brain.createMission('Slow Mission', {
      description: 'A tool that exceeds expected latency.',
      successCriteria: [],
      priority: 'medium'
    });

    // In a real system, TaskExecutor or WorkflowEngine might have a timeout
    // For now we just verify it eventually completes or fails correctly
    const status = await waitForStatus(missionId, ['PLAN_COMPLETED', 'completed', 'PLAN_FAILED', 'failed']);
    expect(['PLAN_COMPLETED', 'completed', 'PLAN_FAILED', 'failed']).toContain(status);
  });

  it('Failure: Message Loss Simulation', async () => {
    // Inject packet loss into the event bus for this mission
    let lostCount = 0;
    const originalPublish = eventBus.publish.bind(eventBus);
    vi.spyOn(eventBus, 'publish').mockImplementation((topic, message) => {
      // Randomly drop 50% of communication messages but not core events
      if (topic === 'agent.communication' && Math.random() > 0.5) {
        lostCount++;
        return;
      }
      return originalPublish(topic, message);
    });

    provider.setMockResponse({
      id: 'res-loss',
      goal: 'Resilient goal',
      tasks: [{ id: 'L1', description: 'Resilient task', tool: 'search_flights', dependencies: [] } as any]
    });

    const missionId = await brain.createMission('Lossy Mission', {
      description: 'Mission with simulated network issues.',
      successCriteria: [],
      priority: 'medium'
    });

    // Recovery depends on SelfCorrection or retry logic in Coordinator
    const status = await waitForStatus(missionId, ['PLAN_COMPLETED', 'completed', 'PLAN_FAILED', 'failed'], 15000);
    console.log(`[FailureTest] Lossy Mission Status: ${status}, Lost Messages: ${lostCount}`);
    
    // If system is resilient, it should eventually complete or hit replan limit
    expect(status).not.toBe('timeout');
  });
});
