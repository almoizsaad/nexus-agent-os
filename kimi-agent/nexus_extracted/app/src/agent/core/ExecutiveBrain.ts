import { GoalManager } from './GoalManager';
import { PriorityManager } from './PriorityManager';
import { MissionScheduler } from './MissionScheduler';
import { DecisionSupervisor } from './DecisionSupervisor';
import { CoordinatorAgent } from './CoordinatorAgent';
import { EventBus } from './EventBus';
import { Mission, MissionGoal } from '../types/mission';
import { AgentEventType } from '../types/agent';

export class ExecutiveBrain {
  private goalManager: GoalManager;
  private priorityManager: PriorityManager;
  private scheduler: MissionScheduler;
  private supervisor: DecisionSupervisor;
  private coordinator: CoordinatorAgent;
  private eventBus: EventBus;

  constructor(
    eventBus: EventBus,
    coordinator: CoordinatorAgent,
    goalManager?: GoalManager,
    priorityManager?: PriorityManager,
    scheduler?: MissionScheduler,
    supervisor?: DecisionSupervisor
  ) {
    this.eventBus = eventBus;
    this.coordinator = coordinator;
    this.goalManager = goalManager || new GoalManager();
    this.priorityManager = priorityManager || new PriorityManager();
    this.scheduler = scheduler || new MissionScheduler(this.goalManager, this.priorityManager, this.eventBus);
    this.supervisor = supervisor || new DecisionSupervisor(this.eventBus);

    this.scheduler.setCallbacks({
      onStart: async (mission) => {
        await this.coordinator.startMission(mission);
      },
      onPause: async (missionId) => {
        await this.coordinator.pauseMission(missionId);
      },
      onResume: async (missionId) => {
        await this.coordinator.resumeMission(missionId);
      }
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.eventBus.subscribe('agent:events', (event) => {
      // Listen for mission completions or failures to trigger rescheduling
      if (event.type === AgentEventType.AGENT_UPDATE) {
        const payload = event.payload as Record<string, unknown>;
        if (payload.status === 'PLAN_COMPLETED' || payload.status === 'PLAN_FAILED') {
          this.handlePlanResult(payload);
        }
      }
    });
  }

  public async createMission(title: string, goal: MissionGoal, context: Record<string, unknown> = {}): Promise<string> {
    const mission = this.goalManager.createMission(title, goal, context);
    await this.scheduler.schedule();
    return mission.id;
  }

  public async cancelMission(missionId: string): Promise<void> {
    await this.scheduler.cancelMission(missionId);
    await this.scheduler.schedule();
  }

  private async handlePlanResult(payload: Record<string, unknown>): Promise<void> {
    const missionId = payload.missionId as string;
    if (!missionId) return;

    const mission = this.goalManager.getMission(missionId);
    if (!mission) return;

    if (payload.status === 'PLAN_COMPLETED') {
      this.goalManager.updateMissionStatus(missionId, 'completed');
      console.info(`[ExecutiveBrain] Mission completed: ${mission.title}`);
    } else if (payload.status === 'PLAN_FAILED') {
      const retries = (mission.context.retries as number || 0);
      if (retries < 2) {
        console.warn(`[ExecutiveBrain] Mission failed: ${mission.title}. Retrying (attempt ${retries + 1})...`);
        mission.context.retries = retries + 1;
        this.goalManager.updateMissionStatus(missionId, 'idle'); // Put back to idle for rescheduling
      } else {
        console.error(`[ExecutiveBrain] Mission failed after retries: ${mission.title}`);
        this.goalManager.updateMissionStatus(missionId, 'failed');
      }
    }

    await this.scheduler.schedule();
  }

  public getGoalManager(): GoalManager {
    return this.goalManager;
  }

  public getCoordinator(): CoordinatorAgent {
    return this.coordinator;
  }
}
