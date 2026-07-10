import type { 
  IImprovementEngine, 
  SystemMetrics, 
  OptimizationRecommendation 
} from '../types/improvement';
import { ToolEvaluator } from './ToolEvaluator';
import { PlannerEvaluator } from './PlannerEvaluator';

export class ImprovementEngine implements IImprovementEngine {
  private toolEvaluator = new ToolEvaluator();
  private plannerEvaluator = new PlannerEvaluator();

  public generateRecommendations(metrics: SystemMetrics): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [
      ...this.toolEvaluator.evaluate(metrics.toolPerformance),
      ...this.plannerEvaluator.evaluate(metrics.plannerQuality)
    ];

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
