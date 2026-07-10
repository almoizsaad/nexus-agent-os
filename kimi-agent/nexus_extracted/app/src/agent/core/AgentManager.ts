import type { AgentIdentity, AgentRole, AgentState, AgentStatus } from '../types/agent';
import type { AgentDefinition } from './AgentRegistry';
import { AgentRegistry } from './AgentRegistry';
import { AgentLifecycleManager } from './AgentLifecycleManager';
import { AgentStateManager } from './AgentStateManager';
import { AgentRuntime } from './AgentRuntime';
import { EventBus } from './EventBus';

export class AgentManager {
  private registry: AgentRegistry;
  private lifecycleManager: AgentLifecycleManager;
  private stateManager: AgentStateManager;

  constructor(
    eventBus: EventBus,
    runtimeFactory: (identity: AgentIdentity) => AgentRuntime
  ) {
    this.registry = new AgentRegistry();
    this.lifecycleManager = new AgentLifecycleManager(this.registry, eventBus, runtimeFactory);
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
}
