import { EventBus } from './EventBus';
import { ExecutiveBrain } from './ExecutiveBrain';
import { Heartbeat } from './Heartbeat';
import { AgentEventType } from '../types/agent';

/**
 * BackgroundRuntime orchestrates the continuous execution of the Agent OS.
 */
export class BackgroundRuntime {
  private eventBus: EventBus;
  private brain: ExecutiveBrain;
  private heartbeat: Heartbeat;
  private isRunning = false;

  constructor(eventBus: EventBus, brain: ExecutiveBrain) {
    this.eventBus = eventBus;
    this.brain = brain;
    this.heartbeat = new Heartbeat(eventBus);
    
    this.setupListeners();
  }

  private setupListeners(): void {
    this.eventBus.subscribe('system:heartbeat', () => {
      this.monitorHealth();
    });
  }

  public async start(): Promise<void> {
    if (this.isRunning) return;
    
    console.info('[BackgroundRuntime] Continuous runtime starting...');
    this.isRunning = true;
    this.heartbeat.start();
    
    // Initial mission scheduling (Recovery)
    await this.recoverMissions();
  }

  public stop(): void {
    this.isRunning = false;
    this.heartbeat.stop();
    console.info('[BackgroundRuntime] Continuous runtime stopped.');
  }

  private async recoverMissions(): Promise<void> {
    console.info('[BackgroundRuntime] Recovering missions from persistence...');
    const goalManager = this.brain.getGoalManager();
    const missions = goalManager.getAllMissions();
    
    // If we have running missions that were interrupted by a reload, 
    // we might want to put them back to idle or resume them.
    // For now, we trigger a schedule call.
    missions.forEach(m => {
      if (m.status === 'running') {
        console.warn(`[BackgroundRuntime] Mission "${m.title}" was running. Resuming...`);
      }
    });

    // Scheduler will pick them up
    await (this.brain as any).scheduler?.schedule();
  }

  private monitorHealth(): void {
    const goalManager = this.brain.getGoalManager();
    const active = goalManager.getActiveMissions();
    
    if (active.length > 0) {
      this.eventBus.publish('agent:events', {
        type: AgentEventType.AGENT_UPDATE,
        payload: { 
          status: 'monitoring', 
          message: `Active missions: ${active.length}`,
          activeMissionIds: active.map(m => m.id)
        },
        timestamp: Date.now()
      });
    }
  }
}
