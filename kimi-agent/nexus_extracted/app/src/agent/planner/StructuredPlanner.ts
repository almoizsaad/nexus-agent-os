import type { AgentState } from '../types/agent';
import type { StructuredPlan } from './schemas';

/**
 * StructuredPlanner handles the logic of constructing prompts and parsing 
 * LLM responses into structured plans.
 */
export class StructuredPlanner {
  /**
   * Constructs the planning prompt.
   */
  public buildPrompt(goal: string, state: AgentState, toolsDescription: string): string {
    return `
      You are an Agent Planner. Your goal is: "${goal}"
      
      Available Tools:
      ${toolsDescription}

      Current Agent Status: ${state.status}
      
      Decompose this goal into a list of tasks with dependencies. 
      Respond with a valid JSON plan following the specified schema.
    `;
  }

  /**
   * Logic for parsing or refining the structured output can be added here.
   */
  public refinePlan(plan: StructuredPlan): StructuredPlan {
    // Ensure all tasks have IDs and dependencies
    return plan;
  }
}
