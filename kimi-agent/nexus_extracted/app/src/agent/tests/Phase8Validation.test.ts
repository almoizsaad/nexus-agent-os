import { describe, it, expect, beforeEach } from 'vitest';
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
import type { StructuredTask } from '../planner/schemas';
import { createTestTool } from './testUtils';

describe('Phase 8.2 — End-to-End Autonomous Mission Validation', () => {
  let agent: ReturnType<typeof createAgent>;
  let brain: ExecutiveBrain;
  let coordinator: CoordinatorAgent;
  let provider: MockLLMProvider;

  beforeEach(() => {
    // Isolated environment for each test
    const container = new ServiceContainer();
    provider = new MockLLMProvider();
    container.registerSingleton('LLMProvider', provider);

    const localUnifiedBus = new UnifiedEventBus();
    const localEventBus = new EventBus(localUnifiedBus);
    container.registerSingleton(EventBus, localEventBus);
    
    agent = createAgent(container);
    
    // Register local mock tools
    const toolRegistry = agent.container.resolve(ToolRegistry);
    toolRegistry.register(new MockWeatherTool());

    const factory = agent.container.resolve(AgentFactory);
    const registry = agent.container.resolve(AgentRegistry);
    const eventBus = agent.container.resolve(EventBus);
    
    const messageBus = new AgentMessageBus(eventBus);
    const router = new MessageRouter(registry, messageBus);
    
    const identity = { id: 'coordinator', name: 'Coordinator', role: 'coordinator' as AgentRole, capabilities: ['coordination'] };
    const inbox = new AgentInbox();
    const outbox = new AgentOutbox(router);
    const channel = new AgentChannel(identity.id, inbox, outbox);
    
    messageBus.subscribe(identity.id, (msg) => inbox.push(msg));
    coordinator = factory.createCoordinator(identity, channel);
    
    const workerIdentity = { id: 'worker', name: 'Worker', role: 'worker' as AgentRole, capabilities: ['execution', 'coding', 'research'] };
    const workerInbox = new AgentInbox();
    const workerOutbox = new AgentOutbox(router);
    const workerChannel = new AgentChannel(workerIdentity.id, workerInbox, workerOutbox);
    
    messageBus.subscribe(workerIdentity.id, (msg) => workerInbox.push(msg));
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
        } as StructuredTask, {});
        
        await workerChannel.sendDirect('coordinator', result?.success ? 'TASK_COMPLETED' : 'TASK_FAILED', {
          taskId: payload.taskId,
          planId: payload.planId,
          result: result?.data,
          error: result?.error
        });
      }
    });
    
    provider = agent.container.resolve('LLMProvider') as MockLLMProvider;
    brain = new ExecutiveBrain(agent.eventBus, coordinator);

    const registerSafe = (tool: Tool) => {
      try { toolRegistry.register(tool); } catch {
        try { toolRegistry.unregister(tool.name); toolRegistry.register(tool); } catch { /* ignore */ }
      }
    };

    registerSafe({ 
      name: 'search_flights', 
      description: 'Search flights', 
      execute: async () => ({ flights: [{ id: 'F1', price: 500 }] }) 
    });
    registerSafe({ 
      name: 'find_hotels', 
      description: 'Find hotels', 
      execute: async () => ({ hotels: [{ id: 'H1', price: 200 }] }) 
    });
    registerSafe({ 
      name: 'research_topic', 
      description: 'Research topic', 
      execute: async (input: { topic: string }) => {
        const summary = `Summary of ${input.topic}`;
        await coordinator.knowledgeGraph.createNode({
          type: 'entity',
          label: input.topic,
          properties: { summary }
        });
        return { summary };
      }
    });
    registerSafe({ 
      name: 'write_code', 
      description: 'Write code', 
      execute: async (input: { feature: string }) => ({ code: `// Code for ${input.feature}` }) 
    });
    registerSafe({ 
      name: 'run_tests', 
      description: 'Run tests', 
      execute: async () => ({ passed: true }) 
    });
  });

  const waitForMissionCompletion = async (targetId?: string, timeout = 15000) => {
    let completed = false;
    let failed = false;
    let foundMissionId = '';
    
    return new Promise<{ completed: boolean, failed: boolean, duration: number, missionId: string }>((resolve) => {
      const startWait = Date.now();
      
      const unsubscribe = agent.eventBus.subscribe('agent:events', (event) => {
        const payload = (event.payload || event) as Record<string, unknown>;
        const mId = (payload.missionId || payload.planId) as string;
        
        if (!targetId || targetId === 'any' || mId === targetId) {
          if (payload.status === 'PLAN_COMPLETED' || payload.status === 'completed') {
            completed = true;
            foundMissionId = mId;
            finish();
          } else if (payload.status === 'PLAN_FAILED' || payload.status === 'failed') {
            failed = true;
            foundMissionId = mId;
            finish();
          }
        }
      });

      const timeoutId = setTimeout(() => {
        finish();
      }, timeout);

      function finish() {
        unsubscribe();
        clearTimeout(timeoutId);
        resolve({ completed, failed, duration: Date.now() - startWait, missionId: foundMissionId });
      }
    });
  };

  it('Mission: Trip Planning (Multi-step Tool Execution)', async () => {
    const missionPromise = waitForMissionCompletion('any');
    await brain.createMission('Trip to Paris', {
      description: 'Plan a full trip to Paris including flights and hotels.',
      successCriteria: ['Flight found', 'Hotel found'],
      priority: 'medium'
    });

    const result = await missionPromise;
    expect(result.completed).toBe(true);
  }, 20000);

  it('Mission: Research & Knowledge Retrieval', async () => {
    provider.setMockResponse({
      id: 'res-1',
      goal: 'Research AI Agents',
      tasks: [
        { id: 'T1', description: 'Research topic', tool: 'research_topic', metadata: { topic: 'AI Agents' }, dependencies: [] }
      ]
    });

    const missionPromise = waitForMissionCompletion('any');
    await brain.createMission('AI Research', {
      description: 'Research AI Agents and save to knowledge graph.',
      successCriteria: ['Topic researched'],
      priority: 'medium'
    });

    const result = await missionPromise;
    expect(result.completed).toBe(true);
    
    const nodes = await coordinator.knowledgeGraph.searchNodes('AI Agents');
    expect(nodes.length).toBeGreaterThan(0);
  }, 20000);

  it('Mission: Multi-step Coding (Dependency Chain)', async () => {
    provider.setMockResponse({
      id: 'code-1',
      goal: 'Implement Auth',
      tasks: [
        { id: 'T1', description: 'Write code', tool: 'write_code', metadata: { feature: 'Auth' }, dependencies: [] },
        { id: 'T2', description: 'Run tests', tool: 'run_tests', dependencies: ['T1'] }
      ]
    });

    const missionPromise = waitForMissionCompletion('any');
    await brain.createMission('Coding Mission', {
      description: 'Implement Auth and verify with tests.',
      successCriteria: ['Code written', 'Tests passed'],
      priority: 'medium'
    });

    const result = await missionPromise;
    expect(result.completed).toBe(true);
  }, 20000);

  it('Mission: Failure Recovery (Self-Correction)', async () => {
    let callCount = 0;
    const toolName = 'flaky_tool';
    
    const toolRegistry = agent.container.resolve(ToolRegistry);
    toolRegistry.register({
      name: toolName,
      description: 'Fails first time, succeeds second time',
      execute: async () => { 
        callCount++;
        if (callCount === 1) throw new Error('First attempt failed');
        return { data: 'Success after retry' };
      }
    });

    provider.setMockResponse({
      id: 'fail-1',
      goal: 'Test Recovery',
      tasks: [
        { id: 'F1', description: 'Flaky task', tool: toolName, dependencies: [] }
      ]
    });

    const missionPromise = waitForMissionCompletion('any', 20000);
    await brain.createMission('Recovery Test', {
      description: 'This mission should fail and then attempt recovery.',
      successCriteria: ['Recovered'],
      priority: 'medium'
    });

    const result = await missionPromise;
    expect(result.completed || callCount > 1).toBe(true);
  }, 30000);
});
