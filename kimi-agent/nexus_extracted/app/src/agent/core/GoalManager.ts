import { Mission, MissionGoal, MissionStatus } from '../types/mission';

export class GoalManager {
  private missions: Map<string, Mission> = new Map();

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
