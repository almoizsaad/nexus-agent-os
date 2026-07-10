import { describe, it, expect, beforeEach } from 'vitest';
import { PerformanceMonitor } from '../improvement/PerformanceMonitor';
import { ImprovementEngine } from '../improvement/ImprovementEngine';

describe('Self Improvement Layer', () => {
  let monitor: PerformanceMonitor;
  let engine: ImprovementEngine;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
    engine = new ImprovementEngine();
  });

  it('should track tool performance accurately', () => {
    monitor.trackToolUse('weather', 500, true);
    monitor.trackToolUse('weather', 1500, false);
    
    const metrics = monitor.getMetrics();
    const weather = metrics.toolPerformance['weather'];
    
    expect(weather.callCount).toBe(2);
    expect(weather.avgLatency).toBe(1000);
    expect(weather.successRate).toBe(0.5);
  });

  it('should track planner and memory quality', () => {
    monitor.trackPlanner(80, 5);
    monitor.trackPlanner(60, 3);
    
    monitor.trackMemory(0.9, 5);
    monitor.trackMemory(0.5, 0); // Miss
    
    const metrics = monitor.getMetrics();
    expect(metrics.plannerQuality.avgConfidence).toBe(70);
    expect(metrics.plannerQuality.avgTaskCount).toBe(4);
    expect(metrics.memoryQuality.missRate).toBe(0.5);
  });

  it('should generate high priority recommendations for failing tools', () => {
    monitor.trackToolUse('search', 100, false); // 0% success
    
    const metrics = monitor.getMetrics();
    const recommendations = engine.generateRecommendations(metrics);
    
    const searchRec = recommendations.find(r => r.id === 'search');
    expect(searchRec).toBeDefined();
    expect(searchRec?.priority).toBe('high');
    expect(searchRec?.type).toBe('reliability');
  });

  it('should suggest improvements for slow workflows', () => {
    monitor.trackWorkflow(20000, true);
    monitor.trackToolUse('heavy_task', 10000, true);
    
    const metrics = monitor.getMetrics();
    const recommendations = engine.generateRecommendations(metrics);
    
    expect(recommendations.some(r => r.type === 'latency')).toBe(true);
  });
});
