import type { AgentIdentity, AgentRole, AgentState, AgentStatus } from '../types/agent';
import type { AgentDefinition } from './AgentRegistry';
import { AgentRegistry } from './AgentRegistry';
import { AgentLifecycleManager } from './AgentLifecycleManager';
import { AgentStateManager } from './AgentStateManager';
import { AgentRuntime } from './AgentRuntime';
import { CoordinatorAgent } from './CoordinatorAgent';
import { EventBus } from './EventBus';
import { AgentMessageBus } from './AgentMessageBus';
import { MessageRouter } from './MessageRouter';
import { AgentInbox } from './AgentInbox';
import { AgentOutbox } from './AgentOutbox';
import { AgentChannel } from './AgentChannel';

export class AgentManager {
  private registry: AgentRegistry;
  private lifecycleManager: AgentLifecycleManager;
  private stateManager: AgentStateManager;
  private messageBus: AgentMessageBus;
  private messageRouter: MessageRouter;

  constructor(
    eventBus: EventBus,
    runtimeFactory: (identity: AgentIdentity, channel: AgentChannel) => AgentRuntime,
    registry?: AgentRegistry
  ) {
    this.registry = registry || new AgentRegistry();
    this.messageBus = new AgentMessageBus(eventBus);
    this.messageRouter = new MessageRouter(this.registry, this.messageBus);
    
    const communicationRuntimeFactory = (identity: AgentIdentity) => {
      const inbox = new AgentInbox();
      const outbox = new AgentOutbox(this.messageRouter);
      const channel = new AgentChannel(identity.id, inbox, outbox);
      
      // Wire up the inbox to the message bus
      this.messageBus.subscribe(identity.id, (message) => {
        inbox.push(message);
      });
      
      if (identity.role === 'coordinator') {
        // Create a CoordinatorAgent with the registry
        const baseRuntime = runtimeFactory(identity, channel);
        
        return new CoordinatorAgent(
          eventBus,
          this.registry,
          baseRuntime.planner || undefined,
          baseRuntime.executor || undefined,
          baseRuntime.monitor,
          baseRuntime.improvementEngine,
          baseRuntime.suggestions,
          identity,
          channel
        );
      }
      
      return runtimeFactory(identity, channel);
    };

    this.lifecycleManager = new AgentLifecycleManager(this.registry, eventBus, communicationRuntimeFactory);
    this.stateManager = new AgentStateManager(this.registry);
  }

  // Lifecycle Operations
  public spawnAgent(name: string, role: AgentRole, capabilities: string[]): AgentRuntime {
    return this.lifecycleManager.spawnAgent(name, role, capabilities);
  }

  public destroyAgent(agentId: string): void {
    this.lifecycleManager.destroyAgent(agentId);
  }

  public pauseAgent(agentId: string): void {
    this.lifecycleManager.pauseAgent(agentId);
  }

  public resumeAgent(agentId: string): void {
    this.lifecycleManager.resumeAgent(agentId);
  }

  public restartAgent(agentId: string): void {
    this.lifecycleManager.restartAgent(agentId);
  }

  // Query Operations
  public listAgents(): AgentDefinition[] {
    return this.registry.listAgents();
  }

  public findAgent(agentId: string): AgentDefinition | undefined {
    return this.registry.getAgent(agentId);
  }

  public findAgentsByRole(role: AgentRole): AgentDefinition[] {
    return this.registry.findAgentsByRole(role);
  }

  // State Operations
  public getAgentState(agentId: string): AgentState | undefined {
    return this.stateManager.getAgentState(agentId);
  }

  public getAgentStatus(agentId: string): AgentStatus | undefined {
    return this.stateManager.getAgentStatus(agentId);
  }

  public getAllAgentStates(): Record<string, AgentState> {
    return this.stateManager.getAllAgentStates();
  }

  public getSystemMetrics(): Record<string, unknown> {
    return this.stateManager.getSystemMetrics();
  }

  public getMessageBusStats(): Record<string, unknown> {
    return (this.messageBus as any).stats || {};
  }
}
