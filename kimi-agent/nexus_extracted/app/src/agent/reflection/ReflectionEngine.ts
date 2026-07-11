import type { ISelfReflectionEngine, ReflectionResult, ExecutionAnalysis } from '../types/reflection';
import type { IKnowledgeGraph } from '../types/knowledge';
import { KnowledgeLinker } from '../knowledge/KnowledgeLinker';

export class ReflectionEngine implements ISelfReflectionEngine {
  private graph?: IKnowledgeGraph;
  private linker?: KnowledgeLinker;

  constructor(graph?: IKnowledgeGraph) {
    this.graph = graph;
    if (graph) {
      this.linker = new KnowledgeLinker(graph);
    }
  }

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

    const result: ReflectionResult = {
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

    if (this.graph && this.linker) {
      await this.recordReflectionInGraph(result);
    }

    return result;
  }

  private async recordReflectionInGraph(reflection: ReflectionResult): Promise<void> {
    if (!this.graph || !this.linker) return;

    // Create reflection node
    const reflectionNode = await this.graph.createNode({
      type: 'concept',
      label: `Reflection: ${reflection.workflowId}`,
      properties: {
        workflowId: reflection.workflowId,
        success: reflection.success,
        confidenceScore: reflection.confidenceScore,
        timestamp: reflection.timestamp
      }
    });

    // Create mistake nodes and link them
    for (const mistake of reflection.mistakes) {
      const mistakeNode = await this.graph.createNode({
        type: 'concept',
        label: `Mistake: ${mistake.substring(0, 50)}...`,
        properties: { mistake, workflowId: reflection.workflowId }
      });
      await this.linker.linkNodes(reflectionNode.id, mistakeNode.id, 'contradicts', 0.8);
    }

    // Create improvement nodes and link them
    for (const improvement of reflection.improvements) {
      const improvementNode = await this.graph.createNode({
        type: 'concept',
        label: `Improvement: ${improvement.substring(0, 50)}...`,
        properties: { improvement, workflowId: reflection.workflowId }
      });
      await this.linker.linkNodes(reflectionNode.id, improvementNode.id, 'improves', 0.9);
    }
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
