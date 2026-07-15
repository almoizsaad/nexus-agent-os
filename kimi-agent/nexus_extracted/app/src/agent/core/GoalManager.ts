import type { Mission, MissionGoal, MissionStatus } from '../types/mission';
import { EventBus } from './EventBus';
import { AgentEventType } from '../types/agent';

export class GoalManager {
  private missions: Map<string, Mission> = new Map();
  private eventBus: EventBus;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  public createMission(title: string, goal: MissionGoal, context: Record<string, unknown> = {}): Mission {
    const mission: Mission = {
      id: crypto.randomUUID(),
      title,
      goal,
      context,
      constraints: [],
      status: 'idle',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      plans: [],
      runningAgents: [],
      timeline: [],
      thoughts: [],
      reflections: [],
      memoryUpdates: [],
      knowledgeUpdates: []
    };
    
    this.missions.set(mission.id, mission);

    this.eventBus.publish('agent:events', {
      type: AgentEventType.MISSION_CREATED,
      payload: { mission },
      timestamp: Date.now()
    });

    return mission;
  }

  public getMission(id: string): Mission | undefined {
    return this.missions.get(id);
  }

  public updateMissionStatus(id: string, status: MissionStatus): void {
    const mission = this.missions.get(id);
    if (mission) {
      mission.status = status;
      mission.updatedAt = Date.now();

      this.eventBus.publish('agent:events', {
        type: AgentEventType.MISSION_STATUS_UPDATED,
        payload: { missionId: id, status, mission },
        timestamp: Date.now()
      });
    }
  }

  public getAllMissions(): Mission[] {
    return Array.from(this.missions.values());
  }

  public getActiveMissions(): Mission[] {
    return this.getAllMissions().filter(m => m.status === 'running');
  }

  public deleteMission(id: string): boolean {
    return this.missions.delete(id);
  }
}
