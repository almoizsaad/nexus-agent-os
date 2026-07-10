import type { ISelfReflectionEngine, ReflectionResult, ExecutionAnalysis } from '../types/reflection';

export class ReflectionEngine implements ISelfReflectionEngine {
  public async reflect(analysis: ExecutionAnalysis): Promise<ReflectionResult> {
    const success = analysis.failedTasks === 0;
    const confidenceScore = this.calculateConfidence(analysis);
    
    const lessonsLearned: string[] = [];
    const mistakes: string[] = [];
    const improvements: string[] = [];

    if (success) {
      lessonsLearned.push('Workflow completed successfully without terminal failures.');
      if (analysis.retries > 0) {
        lessonsLearned.push(`Recovered from ${analysis.retries} transient failures.`);
        improvements.push('Investigate transient failures to improve stability.');
      }
    } else {
      mistakes.push(`Workflow failed with ${analysis.failedTasks} permanent task failures.`);
      analysis.errors.forEach(err => mistakes.push(`Error: ${err}`));
      improvements.push('Analyze permanent failures and update task handlers or tool configurations.');
    }

    if (analysis.duration > 10000) {
      improvements.push('Workflow duration exceeded 10s. Consider parallelizing more tasks or optimizing tool performance.');
    }

    return {
      workflowId: analysis.workflowId,
      timestamp: Date.now(),
      success,
      confidenceScore,
      lessonsLearned,
      mistakes,
      improvements,
      metadata: {
        totalTasks: analysis.totalTasks,
        duration: analysis.duration,
        retries: analysis.retries
      }
    };
  }

  private calculateConfidence(analysis: ExecutionAnalysis): number {
    if (analysis.totalTasks === 0) return 0;
    
    let score = (analysis.completedTasks / analysis.totalTasks) * 100;
    
    // Penalty for retries
    score -= analysis.retries * 5;
    
    // Penalty for duration (simplified)
    if (analysis.duration > 30000) score -= 10;

    return Math.max(0, Math.min(100, score));
  }
}
