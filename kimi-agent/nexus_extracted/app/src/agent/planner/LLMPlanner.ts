import type { Planner, AgentState, Plan } from '../types/agent';
import type { LLMProvider } from '../providers/LLMProvider';
import type { ToolRegistry } from '../tools/ToolRegistry';
import { PlanSchema } from './schemas';
import type { StructuredPlan } from './schemas';
import { PlannerParser } from './PlannerParser';
import { PlanValidator } from './PlanValidator';

/**
 * LLMPlanner uses a Large Language Model to generate autonomous plans.
 * It includes robust parsing, validation, and fallback mechanisms.
 */
export class LLMPlanner implements Planner {
  private provider: LLMProvider;
  private toolRegistry: ToolRegistry;
  private parser: PlannerParser;
  private validator: PlanValidator;
  private fallbackPlanner?: Planner;

  constructor(
    provider: LLMProvider, 
    toolRegistry: ToolRegistry,
    fallbackPlanner?: Planner
  ) {
    this.provider = provider;
    this.toolRegistry = toolRegistry;
    this.parser = new PlannerParser();
    this.validator = new PlanValidator(toolRegistry);
    this.fallbackPlanner = fallbackPlanner;
  }

  /**
   * Generates a structured plan using the LLM.
   */
  public async generatePlan(goal: string, state: AgentState): Promise<Plan> {
    const toolsDescription = this.toolRegistry.describeTools();
    const prompt = this.buildPrompt(goal, state, toolsDescription);

    try {
      // 1. Generate output from LLM
      const response = await this.provider.generateStructuredOutput<string>(
        prompt,
        PlanSchema
      );

      // 2. Parse the response
      // If the provider already returned an object, we use it, otherwise parse string
      const structuredPlan = typeof response === 'string' 
        ? this.parser.parsePlan<StructuredPlan>(response)
        : response as unknown as StructuredPlan;

      // 3. Validate the plan
      const validation = this.validator.validate(structuredPlan);
      if (!validation.valid) {
        console.warn('[LLMPlanner] Plan validation failed:', validation.errors);
        throw new Error(`Invalid plan generated: ${validation.errors.join(', ')}`);
      }

      // 4. Return as standard Plan
      return {
        id: structuredPlan.id || crypto.randomUUID(),
        goal: structuredPlan.goal || goal,
        reasoning: structuredPlan.reasoning,
        tasks: structuredPlan.tasks.map(t => ({
          ...t,
          status: 'pending' as const,
          metadata: t.metadata || {}
        })),
        createdAt: Date.now()
      };

    } catch (error) {
      console.error('[LLMPlanner] LLM Planning failed:', error);
      
      if (this.fallbackPlanner) {
        console.info('[LLMPlanner] Attempting fallback planning...');
        return this.fallbackPlanner.generatePlan(goal, state);
      }
      
      throw error;
    }
  }

  private buildPrompt(goal: string, state: AgentState, toolsDescription: string): string {
    return `
      You are an autonomous Agent OS Planner. 
      Your mission is to decompose the user's goal into a logical sequence of tasks.
      
      GOAL: "${goal}"
      
      AVAILABLE TOOLS:
      ${toolsDescription}

      AGENT HISTORY:
      ${JSON.stringify(state.history.slice(-5))}
      
      REQUIREMENTS:
      1. Every task MUST use one of the available tools.
      2. Define clear dependencies (e.g., task B depends on task A).
      3. Provide a brief reasoning for your plan.
      4. Return ONLY a valid JSON object matching the schema.
    `;
  }
}
