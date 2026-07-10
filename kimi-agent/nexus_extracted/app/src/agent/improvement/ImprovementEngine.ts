import type { 
  IImprovementEngine, 
  SystemMetrics, 
  OptimizationRecommendation 
} from '../types/improvement';

export class ImprovementEngine implements IImprovementEngine {
  public generateRecommendations(metrics: SystemMetrics): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    // Tool optimizations
    Object.values(metrics.toolPerformance).forEach(tool => {
      if (tool.successRate < 0.8) {
        recommendations.push({
          component: 'tool',
          id: tool.toolName,
          type: 'reliability',
          description: `Tool ${tool.toolName} has a low success rate (${(tool.successRate * 100).toFixed(1)}%).`,
          suggestion: 'Review tool parameters and consider adding more robust error handling or retries.',
          priority: 'high'
        });
      }
      if (tool.avgLatency > 5000) {
        recommendations.push({
          component: 'tool',
          id: tool.toolName,
          type: 'latency',
          description: `Tool ${tool.toolName} is slow (avg ${(tool.avgLatency / 1000).toFixed(1)}s).`,
          suggestion: 'Optimize tool execution or consider caching results for frequent queries.',
          priority: 'medium'
        });
      }
    });

    // Planner optimizations
    if (metrics.plannerQuality.avgConfidence < 70) {
      recommendations.push({
        component: 'planner',
        id: 'llm-planner',
        type: 'quality',
        description: `Planner confidence is low (avg ${metrics.plannerQuality.avgConfidence.toFixed(1)}%).`,
        suggestion: 'Refine system prompts for the planner and provide more explicit tool definitions.',
        priority: 'high'
      });
    }

    // Memory optimizations
    if (metrics.memoryQuality.missRate > 0.3) {
      recommendations.push({
        component: 'memory',
        id: 'vector-memory',
        type: 'quality',
        description: `Memory retrieval has a high miss rate (${(metrics.memoryQuality.missRate * 100).toFixed(1)}%).`,
        suggestion: 'Improve indexing strategies or adjust retrieval thresholds.',
        priority: 'medium'
      });
    }

    // Workflow optimizations
    if (metrics.workflowSuccessRate < 0.9) {
      recommendations.push({
        component: 'workflow',
        id: 'engine',
        type: 'reliability',
        description: `Overall workflow success rate is below target (${(metrics.workflowSuccessRate * 100).toFixed(1)}%).`,
        suggestion: 'Implement better self-correction and recovery loops in the WorkflowEngine.',
        priority: 'high'
      });
    }

    return recommendations;
  }
}
