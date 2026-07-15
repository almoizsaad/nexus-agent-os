import { EventBus } from '../core/EventBus';
import { AgentEventType, SystemTelemetryType } from '../types/agent';
import type { AgentProtocolEvent, AgentLifecycleEvent } from '../types/agent';
import { useMissionStore } from '../../stores/missionStore';
import type { Mission } from '../types/mission';

/**
 * MissionAdapter synchronizes runtime mission events with the Zustand missionStore.
 */
export class MissionAdapter {
  private eventBus: EventBus;
  private unsubscribers: Array<() => void> = [];

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.setupSubscriptions();
  }

  private setupSubscriptions() {
    const missionStore = useMissionStore.getState();

    // 1. Mission Lifecycle Events
    const unsubMissions = this.eventBus.subscribe<AgentProtocolEvent>('agent:events', (event) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload = event.payload as any;
      switch (event.type) {
        case AgentEventType.MISSION_CREATED:
          missionStore.addMission(payload.mission as Mission);
          missionStore.setActiveMission(payload.mission.id);
          break;

        case AgentEventType.MISSION_STATUS_UPDATED:
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          missionStore.updateMissionStatus(payload.missionId as string, payload.status as any);
          break;

        case AgentEventType.AGENT_UPDATE: {
          if (payload.missionId) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            missionStore.updateMissionStatus(payload.missionId as string, payload.status as any);
            
            // Add timeline entry for status change
            missionStore.addTimelineEntry(payload.missionId as string, {
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              type: 'event',
              title: 'Status Update',
              description: `Mission status changed to ${payload.status}`,
            });
          }
          break;
        }

        case AgentEventType.REFLECTION: {
          // Find mission by workflowId if mapped
          // For now, let's assume missionId is workflowId for root missions
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          missionStore.addReflection(payload.workflowId as string, payload.reflection as any);
          break;
        }

        case AgentEventType.THOUGHT_GENERATED: {
          // thoughts usually have a missionId or taskId in metadata
          const missionId = (payload.thought.metadata?.missionId as string) || missionStore.activeMissionId;
          if (missionId) {
            missionStore.addThought(missionId, payload.thought);
            missionStore.addTimelineEntry(missionId, {
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              type: 'thought',
              title: 'Agent Thought',
              description: payload.thought.content.slice(0, 100) + '...',
              data: payload.thought
            });
          }
          break;
        }
      }
    });
    this.unsubscribers.push(unsubMissions);

    // 2. System Telemetry (Tasks)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const unsubTelemetry = this.eventBus.subscribe<any>('system:telemetry', (event) => {
      if (event.type === SystemTelemetryType.TASK_ASSIGNED) {
        const { planId, taskId, agentId } = event.payload;
        if (planId) {
          missionStore.addTimelineEntry(planId, {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            type: 'action',
            title: 'Task Assigned',
            description: `Task ${taskId} assigned to agent ${agentId}`,
            data: { taskId, agentId }
          });
        }
      } else if (event.type === SystemTelemetryType.TASK_COMPLETED) {
        const { planId, taskId, agentId } = event.payload;
        if (planId) {
          missionStore.addTimelineEntry(planId, {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            type: 'event',
            title: 'Task Completed',
            description: `Task ${taskId} successfully completed by agent ${agentId}`,
            data: { taskId, agentId }
          });
        }
      }
    });
    this.unsubscribers.push(unsubTelemetry);

    // 3. Agent Lifecycle (Running Agents)
    const unsubLifecycle = this.eventBus.subscribe<AgentLifecycleEvent>('agent:lifecycle', (event) => {
      const { agentId, action, identity } = event.payload;
      const activeMissionId = missionStore.activeMissionId;
      if (!activeMissionId) return;

      if (action === 'spawned') {
        missionStore.addRunningAgent(activeMissionId, identity);
      } else if (action === 'destroyed') {
        missionStore.removeRunningAgent(activeMissionId, agentId);
      }
    });
    this.unsubscribers.push(unsubLifecycle);
  }

  public destroy() {
    this.unsubscribers.forEach(unsub => unsub());
    this.unsubscribers = [];
  }
}
