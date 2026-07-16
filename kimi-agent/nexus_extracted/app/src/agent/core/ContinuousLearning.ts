import { EventBus } from './EventBus';
import { AgentEventType } from '../types/agent';
import { AgentRegistry } from './AgentRegistry';
import { KnowledgeGraph } from '../knowledge/KnowledgeGraph';
import { KnowledgeDatabase } from '../knowledge/KnowledgeDatabase';

/**
 * ContinuousLearning service processes reflections to evolve agent capabilities and skills.
 */
export class ContinuousLearning {
  private eventBus: EventBus;
  private graph?: KnowledgeGraph;
  private db?: KnowledgeDatabase;

  constructor(eventBus: EventBus, _registry: AgentRegistry, graph?: KnowledgeGraph, db?: KnowledgeDatabase) {
    this.eventBus = eventBus;
    this.graph = graph;
    this.db = db;
    this.setupListeners();
  }

  private setupListeners(): void {
    this.eventBus.subscribe('agent:events', (event) => {
      if (event.type === AgentEventType.REFLECTION) {
        this.processReflection(event.payload);
      }
    });
  }

  private async processReflection(payload: any): Promise<void> {
    const { workflowId, reflection } = payload;
    console.info(`[ContinuousLearning] Processing reflection for ${workflowId}...`);

    if (reflection.success) {
      await this.learnFromSuccess(workflowId, reflection);
    } else {
      await this.learnFromFailure(workflowId, reflection);
    }

    if (reflection.improvements.length > 0) {
      this.evolveSkills(reflection.improvements);
    }

    if (reflection.mistakes.length > 0) {
      this.updatePolicies(reflection.mistakes);
    }
  }

  private async learnFromSuccess(workflowId: string, reflection: any): Promise<void> {
    if (!this.graph) return;

    // Boost confidence in the plan and involved nodes
    const relatedNodes = await this.graph.searchNodes(workflowId);
    for (const node of relatedNodes) {
      await this.graph.evolveNode(node.id, 'Validated by successful execution', reflection.confidenceScore || 0.9);
    }

    console.info(`[ContinuousLearning] Reinforced knowledge for ${workflowId} (Success).`);
  }

  private async learnFromFailure(workflowId: string, reflection: any): Promise<void> {
    if (!this.graph) return;

    // Decrease confidence and record mistakes
    const relatedNodes = await this.graph.searchNodes(workflowId);
    for (const node of relatedNodes) {
      await this.graph.evolveNode(node.id, `Failure: ${reflection.mistakes[0] || 'Unknown'}`, 0.3);
    }

    console.warn(`[ContinuousLearning] Flagged knowledge issues for ${workflowId} (Failure).`);
  }

  private evolveSkills(improvements: string[]): void {
    improvements.forEach(improvement => {
      console.info(`[ContinuousLearning] Evolving skill based on improvement: ${improvement}`);
      // In a real system, this might update the LLM prompt with new "skills" or "tips"
      this.eventBus.publish('system:skill_evolution', { improvement, timestamp: Date.now() } as any);
    });
  }

  private updatePolicies(mistakes: string[]): void {
    mistakes.forEach(mistake => {
      console.info(`[ContinuousLearning] Updating policy based on mistake: ${mistake}`);
      // In a real system, this might add a new constraint to the agent's system prompt
      this.eventBus.publish('system:policy_update', { mistake, timestamp: Date.now() } as any);
    });
  }
}
