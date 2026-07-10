import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAgent } from '../bootstrap/createAgent';
import { DependencyResolver } from '../planner/DependencyResolver';
import { TaskDistributor } from '../planner/TaskDistributor';
import { CoordinatorAgent } from '../core/CoordinatorAgent';
import { CooperativePlan } from '../types/planning';
import { EventBus } from '../core/EventBus';

describe('Cooperative Planning', () => {
  let eventBus: EventBus;
  let registry: any;

  beforeEach(() => {
    const agent = createAgent();
    eventBus = agent.eventBus;
    registry = (agent.manager as any).registry;
  });

  it('should resolve execution order for dependent tasks', () => {
    const resolver = new DependencyResolver();
    const plan: CooperativePlan = {
      id: 'p1',
      goal: 'Complex Goal',
      coordinatorId: 'c1',
      createdAt: Date.now(),
      tasks: [
        { id: 't1', description: 'Task 1', status: 'pending', metadata: { dependencies: [] } },
        { id: 't2', description: 'Task 2', status: 'pending', metadata: { dependencies: ['t1'] } },
        { id: 't3', description: 'Task 3', status: 'pending', metadata: { dependencies: ['t2'] } },
      ]
    };

    const order = resolver.resolveExecutionOrder(plan);
    expect(order.map(t => t.id)).toEqual(['t1', 't2', 't3']);
  });

  it('should identify ready and blocked tasks', () => {
    const resolver = new DependencyResolver();
    const plan: CooperativePlan = {
      id: 'p1',
      goal: 'Complex Goal',
      coordinatorId: 'c1',
      createdAt: Date.now(),
      tasks: [
        { id: 't1', description: 'Task 1', status: 'pending', metadata: { dependencies: [] } },
        { id: 't2', description: 'Task 2', status: 'pending', metadata: { dependencies: ['t1'] } },
      ]
    };

    let ready = resolver.getReadyTasks(plan, new Set(), new Set());
    expect(ready).toHaveLength(1);
    expect(ready[0].id).toBe('t1');

    let blocked = resolver.getBlockedTasks(plan, new Set());
    expect(blocked).toHaveLength(1);
    expect(blocked[0].id).toBe('t2');

    ready = resolver.getReadyTasks(plan, new Set(['t1']), new Set());
    expect(ready).toHaveLength(1);
    expect(ready[0].id).toBe('t2');
  });

  it('should distribute tasks to capable agents', () => {
    const { manager } = createAgent();
    const distributor = new TaskDistributor((manager as any).registry);
    
    manager.spawnAgent('Specialist', 'specialist', ['coding']);
    
    const tasks = [
      { id: 't1', description: 'Code something', status: 'pending' as const, metadata: { requiredCapability: 'coding' } }
    ];

    const distributed = distributor.distributeTasks(tasks as any);
    expect(distributed[0].assigneeId).toBeDefined();
    
    const assignee = manager.findAgent(distributed[0].assigneeId!)?.identity;
    expect(assignee?.capabilities).toContain('coding');
  });

  it('should reach consensus on proposed plans', async () => {
    const { PlannerConsensus } = await import('../planner/PlannerConsensus');
    const consensus = new PlannerConsensus();
    const planId = 'p1';

    consensus.proposePlan(planId);
    consensus.approvePlan(planId, 'agent1');
    
    expect(consensus.resolveConsensus(planId, 2)).toBe('pending');
    
    consensus.approvePlan(planId, 'agent2');
    expect(consensus.resolveConsensus(planId, 2)).toBe('agreed');
  });

  it('should handle task failures and retries in CoordinatorAgent', async () => {
    const coordinator = new CoordinatorAgent(eventBus, registry);
    const plan: CooperativePlan = {
      id: 'p1',
      goal: 'Complex Goal',
      coordinatorId: 'coord1',
      createdAt: Date.now(),
      tasks: [
        { id: 't1', description: 'Task 1', status: 'pending', metadata: { dependencies: [] } }
      ]
    };

    // Spy on delegateTask
    const delegateSpy = vi.spyOn((coordinator as any).coordinator, 'delegateTask');
    
    await coordinator.startCooperativePlan(plan);
    expect(delegateSpy).toHaveBeenCalled();

    // Simulate failure
    const failMessage = {
      type: 'TASK_FAILED',
      sender: 'agent1',
      payload: { planId: 'p1', taskId: 't1', error: 'Some error' }
    };
    
    // Trigger message handler directly for test
    await (coordinator as any).handleTaskResult(failMessage, false);
    
    expect(plan.tasks[0].metadata?.retries).toBe(1);
    expect(plan.tasks[0].status).toBe('pending');
    expect(delegateSpy).toHaveBeenCalledTimes(2);
  });

  it('should trigger replanning after max retries', async () => {
    const coordinator = new CoordinatorAgent(eventBus, registry);
    const mockPlanner = {
      generatePlan: vi.fn().mockResolvedValue({
        id: 'p1',
        goal: 'Recover...',
        tasks: [],
        createdAt: Date.now()
      })
    };
    (coordinator as any).planner = mockPlanner;

    const plan: CooperativePlan = {
      id: 'p1',
      goal: 'Complex Goal',
      coordinatorId: 'coord1',
      createdAt: Date.now(),
      tasks: [
        { id: 't1', description: 'Task 1', status: 'pending', metadata: { dependencies: [], retries: 3 } }
      ]
    };

    const failMessage = {
      type: 'TASK_FAILED',
      sender: 'agent1',
      payload: { planId: 'p1', taskId: 't1', error: 'Final error' }
    };
    
    await (coordinator as any).handleTaskResult(failMessage, false);
    
    expect(mockPlanner.generatePlan).toHaveBeenCalled();
    expect(plan.tasks[0].status).toBe('failed');
  });
});
