import { GoalManager } from './GoalManager';
import { PriorityManager } from './PriorityManager';
import type { Mission } from '../types/mission';
import { EventBus } from './EventBus';
import { AgentEventType } from '../types/agent';

export class MissionScheduler {
  private readonly maxConcurrentMissions = 3;
  private onStart?: (mission: Mission) => Promise<void>;
  private onPause?: (missionId: string) => Promise<void>;
  private onResume?: (missionId: string) => Promise<void>;

  private readonly goalManager: GoalManager;
  private readonly priorityManager: PriorityManager;
  private readonly eventBus: EventBus;

  constructor(
    goalManager: GoalManager,
    priorityManager: PriorityManager,
    eventBus: EventBus
  ) {
    this.goalManager = goalManager;
    this.priorityManager = priorityManager;
    this.eventBus = eventBus;
  }

  public setCallbacks(callbacks: {
    onStart: (mission: Mission) => Promise<void>;
    onPause: (missionId: string) => Promise<void>;
    onResume: (missionId: string) => Promise<void>;
  }): void {
    this.onStart = callbacks.onStart;
    this.onPause = callbacks.onPause;
    this.onResume = callbacks.onResume;
  }

  public async schedule(): Promise<void> {
    const allMissions = this.goalManager.getAllMissions();
    const runningMissions = allMissions.filter(m => m.status === 'running');
    const pendingMissions = allMissions.filter(m => m.status === 'idle' || m.status === 'paused');

    const sortedPending = this.priorityManager.sortMissionsByPriority(pendingMissions);

    for (const mission of sortedPending) {
      if (runningMissions.length < this.maxConcurrentMissions) {
        if (mission.status === 'paused') {
          await this.resumeMission(mission);
        } else {
          await this.startMission(mission);
        }
        runningMissions.push(mission);
      } else {
        // Check if we should interrupt a running mission
        const sortedRunning = this.priorityManager.sortMissionsByPriority(runningMissions);
        const lowestPriorityRunning = sortedRunning[sortedRunning.length - 1];

        if (this.priorityManager.shouldInterrupt(lowestPriorityRunning, mission)) {
          await this.pauseMission(lowestPriorityRunning);
          await this.startMission(mission);
          
          // Update running list
          const index = runningMissions.indexOf(lowestPriorityRunning);
          if (index > -1) runningMissions.splice(index, 1);
          runningMissions.push(mission);
        }
      }
    }
  }

  private async startMission(mission: Mission): Promise<void> {
    console.info(`[MissionScheduler] Starting mission: ${mission.title} (${mission.id})`);
    this.goalManager.updateMissionStatus(mission.id, 'running');
    
    if (this.onStart) {
      await this.onStart(mission);
    }

    this.eventBus.publish('agent:events', {
      type: AgentEventType.AGENT_UPDATE,
      payload: { missionId: mission.id, status: 'running' },
      timestamp: Date.now()
    });
  }

  private async pauseMission(mission: Mission): Promise<void> {
    console.info(`[MissionScheduler] Pausing mission: ${mission.title} (${mission.id})`);
    this.goalManager.updateMissionStatus(mission.id, 'paused');

    if (this.onPause) {
      await this.onPause(mission.id);
    }

    this.eventBus.publish('agent:events', {
      type: AgentEventType.AGENT_UPDATE,
      payload: { missionId: mission.id, status: 'paused' },
      timestamp: Date.now()
    });
  }

  private async resumeMission(mission: Mission): Promise<void> {
    console.info(`[MissionScheduler] Resuming mission: ${mission.title} (${mission.id})`);
    this.goalManager.updateMissionStatus(mission.id, 'running');

    if (this.onResume) {
      await this.onResume(mission.id);
    }

    this.eventBus.publish('agent:events', {
      type: AgentEventType.AGENT_UPDATE,
      payload: { missionId: mission.id, status: 'running' },
      timestamp: Date.now()
    });
  }

  public async cancelMission(missionId: string): Promise<void> {
    const mission = this.goalManager.getMission(missionId);
    if (mission) {
      console.info(`[MissionScheduler] Cancelling mission: ${mission.title} (${mission.id})`);
      this.goalManager.updateMissionStatus(missionId, 'cancelled');
      this.eventBus.publish('agent:events', {
        type: AgentEventType.AGENT_UPDATE,
        payload: { missionId, status: 'cancelled' },
        timestamp: Date.now()
      });
    }
  }
}
