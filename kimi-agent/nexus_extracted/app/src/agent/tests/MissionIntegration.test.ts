import { describe, it, expect, beforeEach } from 'vitest';
import { createAgent } from '../bootstrap/createAgent';
import { useMissionStore } from '../../stores/missionStore';
import { MissionAdapter } from '../adapters/MissionAdapter';

describe('Mission Integration', () => {
  beforeEach(() => {
    useMissionStore.getState().reset();
  });

  it('should synchronize mission creation from ExecutiveBrain to missionStore', async () => {
    const { executiveBrain, eventBus } = createAgent();
    
    // Explicitly initialize MissionAdapter with the same eventBus
    new MissionAdapter(eventBus);

    const missionId = await executiveBrain.createMission('Test Integration Mission', {
      description: 'Verifying end-to-end sync',
      successCriteria: ['Store is updated'],
      priority: 'medium'
    });

    const missions = useMissionStore.getState().missions;
    expect(missions[missionId]).toBeDefined();
    expect(missions[missionId].title).toBe('Test Integration Mission');
    expect(useMissionStore.getState().activeMissionId).toBe(missionId);
  });

  it('should synchronize mission status updates', async () => {
    const { executiveBrain, eventBus } = createAgent();
    new MissionAdapter(eventBus);

    const missionId = await executiveBrain.createMission('Status Sync Mission', {
      description: 'Verifying status sync',
      successCriteria: ['Status is updated'],
      priority: 'low'
    });

    executiveBrain.getGoalManager().updateMissionStatus(missionId, 'running');

    const missions = useMissionStore.getState().missions;
    expect(missions[missionId].status).toBe('running');
  });
});
