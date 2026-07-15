import { EventBus } from './EventBus';
import { AgentEventType } from '../types/agent';
import { AgentRegistry } from './AgentRegistry';

/**
 * ContinuousLearning service processes reflections to evolve agent capabilities and skills.
 */
export class ContinuousLearning {
  private eventBus: EventBus;

  constructor(eventBus: EventBus, _registry: AgentRegistry) {
    this.eventBus = eventBus;
    this.setupListeners();
  }

  private setupListeners(): void {
    this.eventBus.subscribe('agent:events', (event) => {
      if (event.type === AgentEventType.REFLECTION) {
        this.processReflection(event.payload);
      }
    });
  }

  private processReflection(payload: any): void {
    const { workflowId, reflection } = payload;
    console.info(`[ContinuousLearning] Processing reflection for ${workflowId}...`);

    if (reflection.improvements.length > 0) {
      this.evolveSkills(reflection.improvements);
    }
    
    if (reflection.mistakes.length > 0) {
      this.updatePolicies(reflection.mistakes);
    }
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
