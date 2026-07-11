import { describe, it, expect } from 'vitest';
import { TaskPlanner } from '../planner/TaskPlanner';

describe('TaskPlanner', () => {
  it('should decompose "Plan a trip to Dubai" into expected tasks', async () => {
    const planner = new TaskPlanner();
    const plan = await planner.generatePlan('Plan a trip to Dubai');
    
    const taskTools = (plan.tasks as any[]).map(t => t.tool);
    expect(taskTools).toContain('search_flights');
    expect(taskTools).toContain('find_hotels');
    expect(taskTools).toContain('get_current_weather');
  });
});
