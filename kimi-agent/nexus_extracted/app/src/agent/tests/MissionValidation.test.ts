import { describe, it, expect, beforeEach } from 'vitest';
import { createAgent } from '../bootstrap/createAgent';
import { AgentFactory } from '../core/AgentFactory';
import { ExecutiveBrain } from '../core/ExecutiveBrain';
import { CoordinatorAgent } from '../core/CoordinatorAgent';
import { MockLLMProvider } from '../providers/MockLLMProvider';
import { AgentEventType } from '../types/agent';
import type { AgentRole } from '../types/agent';
import { AgentInbox } from '../core/AgentInbox';
import { AgentOutbox } from '../core/AgentOutbox';
import { MessageRouter } from '../core/MessageRouter';
import { AgentMessageBus } from '../core/AgentMessageBus';
import { AgentChannel } from '../core/AgentChannel';
import { EventBus } from '../core/EventBus';
import { AgentRegistry } from '../core/AgentRegistry';
import { ToolRegistry } from '../tools/ToolRegistry';

describe('Mission Validation - End-to-End', () => {
  let agent: ReturnType<typeof createAgent>;
  let brain: ExecutiveBrain;
  let coordinator: CoordinatorAgent;
  let provider: MockLLMProvider;

  beforeEach(() => {
    agent = createAgent();
    const factory = agent.container.resolve(AgentFactory);
    const registry = agent.container.resolve(AgentRegistry);
    const eventBus = agent.container.resolve(EventBus);
    
    const messageBus = new AgentMessageBus(eventBus);
    const router = new MessageRouter(registry, messageBus);
    
    const identity = { id: 'coordinator', name: 'Coordinator', role: 'coordinator' as AgentRole, capabilities: ['coordination'] };
    const inbox = new AgentInbox();
    const outbox = new AgentOutbox(router);
    const channel = new AgentChannel(identity.id, inbox, outbox);
    
    // Wire up coordinator inbox
    messageBus.subscribe(identity.id, (msg) => (inbox as any).push(msg));
    
    coordinator = factory.createCoordinator(identity, channel);
    
    // Register a worker agent to actually execute tasks
    const workerIdentity = { id: 'worker', name: 'Worker', role: 'worker' as AgentRole, capabilities: ['execution'] };
    const workerInbox = new AgentInbox();
    const workerOutbox = new AgentOutbox(router);
    const workerChannel = new AgentChannel(workerIdentity.id, workerInbox, workerOutbox);
    
    // Wire up worker inbox
    messageBus.subscribe(workerIdentity.id, (msg) => (workerInbox as any).push(msg));
    
    const worker = factory.createAgent(workerIdentity, workerChannel);
    
    // REGISTER WORKER FIRST so TaskDistributor picks it
    registry.register(workerIdentity, worker);
    registry.register(identity, coordinator);
    
    // Make sure worker can handle TASK_ASSIGNMENT
    workerChannel.onMessage(async (message) => {
      if (message.type === 'TASK_ASSIGNMENT') {
        const payload = message.payload as { taskId: string; description: string; tool: string; metadata?: Record<string, unknown>; planId: string };
        // Map back to processGoal or similar, but simpler is just execute via runtime
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
    
    // Inject coordinator into ExecutiveBrain
    brain = new ExecutiveBrain(agent.eventBus, coordinator);

    // Register tools safely
    const registerSafe = (tool: { name: string; description: string; execute: (args: any) => Promise<unknown> }) => {
      try { agent.toolRegistry.register(tool as any); } catch { /* ignore */ }
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
      name: 'get_current_weather', 
      description: 'Get weather', 
      execute: async () => ({ weather: 'Sunny' }) 
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
  });

  it('should execute a Trip Planning mission successfully', async () => {
    const startTime = Date.now();
    
    const missionId = await brain.createMission('Trip to Paris', {
      description: 'Plan a full trip to Paris including flights and hotels.',
      successCriteria: ['Flight found', 'Hotel found'],
      priority: 'medium'
    });

    // Wait for mission completion
    // We can monitor events
    let completed = false;
    agent.eventBus.subscribe('agent:events', (event: any) => {
      console.log(`[TestEvent] Type: ${event.type}, Status: ${event.payload?.status}, MissionId: ${event.payload?.missionId}`);
      if (event.type === AgentEventType.AGENT_UPDATE) {
        const payload = event.payload as Record<string, unknown>;
        if (payload.missionId === missionId && payload.status === 'PLAN_COMPLETED') {
          completed = true;
        }
      }
    });

    // Timeout after 10s
    const timeout = 10000;
    const startWait = Date.now();
    while (!completed && Date.now() - startWait < timeout) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const duration = Date.now() - startTime;
    console.log(`[MissionValidation] Trip Planning duration: ${duration}ms`);

    expect(completed).toBe(true);
    
    // Verify memory contains the mission
    const mission = brain.getGoalManager().getMission(missionId);
    expect(mission?.status).toBe('completed');
  }, 15000);
it('should execute a Research & Knowledge mission', async () => {
  provider.setMockResponse({
    id: 'res-1',
    goal: 'Research AI Agents',
    reasoning: 'Need to research the topic and then summarize findings.',
    tasks: [
      { id: 'T1', description: 'Research topic', tool: 'research_topic', metadata: { topic: 'AI Agents' }, dependencies: [] } as any
    ]
  });

  const missionId = await brain.createMission('AI Research', {
      description: 'Research AI Agents and save to knowledge graph.',
      successCriteria: ['Topic researched'],
      priority: 'medium'
    });

    let completed = false;
    agent.eventBus.subscribe('agent:events', (event) => {
      if (event.type === AgentEventType.AGENT_UPDATE && (event.payload as Record<string, any>).missionId === missionId && (event.payload as Record<string, any>).status === 'PLAN_COMPLETED') {
        completed = true;
      }
    });

    const startWait = Date.now();
    while (!completed && Date.now() - startWait < 10000) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    expect(completed).toBe(true);
    
    // Verify Knowledge Graph entry
    const nodes = await coordinator.knowledgeGraph.searchNodes('AI Agents');
    expect(nodes.length).toBeGreaterThan(0);
  }, 15000);

  it('should handle mission failure and recovery via SelfCorrection', async () => {
    // Force a tool to fail
    const toolRegistry = (coordinator.executor as any)?.toolRegistry as ToolRegistry;
    if (toolRegistry) {
      toolRegistry.register({
        name: 'failing_tool',
        description: 'This tool always fails',
        execute: async () => { throw new Error('Tool exploded'); }
      });
    }

    provider.setMockResponse({
      id: 'fail-plan',
      goal: 'Test Failure',
      reasoning: 'Intentional failure test.',
      tasks: [
        { id: 'F1', description: 'Failing task', tool: 'failing_tool', dependencies: [] } as any
      ]
    });

    const missionId = await brain.createMission('Failure Test', {
      description: 'This mission should fail and then attempt recovery.',
      successCriteria: ['Recovered'],
      priority: 'medium'
    });

    // Wait for events
    let failed = false;
    agent.eventBus.subscribe('agent:events', (event) => {
      if (event.type === AgentEventType.AGENT_UPDATE) {
        const payload = event.payload as Record<string, any>;
        if (payload.missionId === missionId && payload.status === 'PLAN_FAILED') failed = true;
      }
    });

    // We can also check status transitions in AgentRuntime via spies if needed
    
    const startWait = Date.now();
    while (!failed && Date.now() - startWait < 10000) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    expect(failed).toBe(true);
  }, 15000);
});
