import type { Planner, AgentState, Plan } from '../types/agent';
import type { LLMProvider } from '../providers/LLMProvider';
import { PlanSchema } from './schemas';
import type { StructuredPlan } from './schemas';
import { ToolRegistry } from '../tools/ToolRegistry';
import { StructuredPlanner } from './StructuredPlanner';

/**
 * PlannerEngine coordinates the LLM-based planning process.
 */
export class PlannerEngine implements Planner {
  private provider: LLMProvider;
  private toolRegistry: ToolRegistry;
  private structuredPlanner: StructuredPlanner;

  constructor(provider: LLMProvider, toolRegistry: ToolRegistry) {
    this.provider = provider;
    this.toolRegistry = toolRegistry;
    this.structuredPlanner = new StructuredPlanner();
  }

  public async generatePlan(goal: string, state: AgentState): Promise<Plan> {
    const toolsDescription = this.toolRegistry.describeTools();
    const prompt = this.structuredPlanner.buildPrompt(goal, state, toolsDescription);

    try {
      const structuredPlan = await this.provider.generateStructuredOutput<StructuredPlan>(
        prompt,
        PlanSchema
      );

      const refinedPlan = this.structuredPlanner.refinePlan(structuredPlan);

      return {
        ...refinedPlan,
        createdAt: refinedPlan.createdAt || Date.now(),
        tasks: refinedPlan.tasks.map((t) => ({
          ...t,
          status: 'pending' as const
        }))
      };
    } catch (error) {
      console.error('[PlannerEngine] Failed to generate plan:', error);
      throw error;
    }
  }
}
