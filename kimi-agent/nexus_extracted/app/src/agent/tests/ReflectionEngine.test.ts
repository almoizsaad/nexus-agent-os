import { describe, it, expect, beforeEach } from 'vitest';
import { ExecutionAnalyzer } from '../reflection/ExecutionAnalyzer';
import { ReflectionEngine } from '../reflection/ReflectionEngine';
import { PlanImprover } from '../reflection/PlanImprover';
import { FailureAnalyzer, SuccessAnalyzer } from '../reflection/TaskAnalyzers';

describe('Reflection Engine', () => {
  let analyzer: ExecutionAnalyzer;
  let engine: ReflectionEngine;
  let improver: PlanImprover;
  let failureAnalyzer: FailureAnalyzer;
  let successAnalyzer: SuccessAnalyzer;

  beforeEach(() => {
    analyzer = new ExecutionAnalyzer();
    engine = new ReflectionEngine();
    improver = new PlanImprover();
    failureAnalyzer = new FailureAnalyzer();
    successAnalyzer = new SuccessAnalyzer();
  });

  it('should analyze successful execution events', async () => {
    const events = [
      { type: 'workflow_start', workflowId: 'wf-1', timestamp: 1000 },
      { taskId: 'task-1', status: 'completed', timestamp: 1500, result: { ok: true } },
      { taskId: 'task-2', status: 'completed', timestamp: 2000, result: { ok: true } },
      { type: 'workflow_end', workflowId: 'wf-1', timestamp: 2100 }
    ];

    const analysis = await analyzer.analyze('wf-1', events);
    expect(analysis.completedTasks).toBe(2);
    expect(analysis.failedTasks).toBe(0);
    expect(analysis.duration).toBe(1100);

    const reflection = await engine.reflect(analysis);
    expect(reflection.success).toBe(true);
    expect(reflection.confidenceScore).toBe(100);
    expect(reflection.lessonsLearned).toContain('Workflow completed successfully without terminal failures.');
  });

  it('should analyze failed execution events', async () => {
    const events = [
      { type: 'workflow_start', workflowId: 'wf-2', timestamp: 1000 },
      { taskId: 'task-1', status: 'completed', timestamp: 1500, result: { ok: true } },
      { taskId: 'task-2', status: 'failed', timestamp: 2000, result: { error: 'timeout' } },
      { type: 'workflow_end', workflowId: 'wf-2', timestamp: 2100 }
    ];

    const analysis = await analyzer.analyze('wf-2', events);
    expect(analysis.failedTasks).toBe(1);
    expect(analysis.errors).toContain('timeout');

    const reflection = await engine.reflect(analysis);
    expect(reflection.success).toBe(false);
    expect(reflection.confidenceScore).toBeLessThan(100);
    expect(reflection.mistakes.some((m: string) => m.includes('timeout'))).toBe(true);
  });

  it('should suggest improvements for failed workflows', async () => {
    const reflection = {
      workflowId: 'wf-3',
      timestamp: Date.now(),
      success: false,
      confidenceScore: 50,
      lessonsLearned: [],
      mistakes: ['Task failed due to timeout'],
      improvements: ['Analyze bottlenecks'],
      metadata: { totalTasks: 2, duration: 25000, retries: 0 }
    };

    const suggestions = await improver.suggestImprovements(reflection as any);
    expect(suggestions).toContain('Review task dependencies for potential race conditions.');
    expect(suggestions).toContain('Increase retry limits for non-deterministic tools.');
    expect(suggestions).toContain('Analyze bottlenecks in long-running tasks.');
  });

  it('should analyze task outcomes specifically', async () => {
    const failureMsg = await failureAnalyzer.analyzeFailure('task-99', 'timeout error');
    expect(failureMsg).toContain('Suggest increasing timeout');

    const complexResult: any = {};
    for (let i = 0; i < 15; i++) complexResult[`key${i}`] = i;

    const successMsg = await successAnalyzer.analyzeSuccess('task-100', complexResult);
    expect(successMsg).toContain('high data volume');
  });
});
