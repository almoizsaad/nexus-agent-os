import type { Mission, MissionGoal, MissionStatus } from '../types/mission';
import { EventBus } from './EventBus';
import { AgentEventType } from '../types/agent';
import { PersistentMemory } from '../memory/PersistentMemory';

export class GoalManager {
  private missions: Map<string, Mission> = new Map();
  private eventBus: EventBus;
  private memory: PersistentMemory;
  private readonly STORAGE_KEY = 'missions';

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.memory = new PersistentMemory();
    this.loadMissions();
  }

  private loadMissions(): void {
    const savedMissions = this.memory.recall(this.STORAGE_KEY) as Mission[];
    if (savedMissions && Array.isArray(savedMissions)) {
      savedMissions.forEach(m => this.missions.set(m.id, m));
      console.info(`[GoalManager] Loaded ${savedMissions.length} missions from persistence.`);
    }
  }

  private saveMissions(): void {
    const missionsArray = Array.from(this.missions.values());
    this.memory.store(this.STORAGE_KEY, missionsArray);
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
    this.saveMissions();

    this.eventBus.publish('agent:events', {
      type: AgentEventType.MISSION_CREATED as any,
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
      this.saveMissions();

      this.eventBus.publish('agent:events', {
        type: AgentEventType.MISSION_STATUS_UPDATED as any,
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
    const deleted = this.missions.delete(id);
    if (deleted) this.saveMissions();
    return deleted;
  }
}
