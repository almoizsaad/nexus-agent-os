import type { Planner, AgentState, Plan } from '../types/agent';
import type { LLMProvider } from '../providers/LLMProvider';
import type { ToolRegistry } from '../tools/ToolRegistry';
import { PlanSchema } from './schemas';
import type { StructuredPlan } from './schemas';
import { PlannerParser } from './PlannerParser';
import { PlanValidator } from './PlanValidator';
import type { IPerformanceMonitor } from '../types/improvement';
import type { IKnowledgeGraph } from '../types/knowledge';
import { KnowledgeLinker } from '../knowledge/KnowledgeLinker';

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
  private monitor?: IPerformanceMonitor;
  private graph?: IKnowledgeGraph;
  private linker?: KnowledgeLinker;

  constructor(
    provider: LLMProvider, 
    toolRegistry: ToolRegistry,
    fallbackPlanner?: Planner,
    monitor?: IPerformanceMonitor,
    graph?: IKnowledgeGraph
  ) {
    this.provider = provider;
    this.toolRegistry = toolRegistry;
    this.parser = new PlannerParser();
    this.validator = new PlanValidator(toolRegistry);
    this.fallbackPlanner = fallbackPlanner;
    this.monitor = monitor;
    this.graph = graph;
    if (graph) {
      this.linker = new KnowledgeLinker(graph);
    }
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
        this.monitor?.trackPlanner(0, structuredPlan.tasks?.length || 0);
        throw new Error(`Invalid plan generated: ${validation.errors.join(', ')}`);
      }

      const confidence = structuredPlan.confidence || 85;
      this.monitor?.trackPlanner(confidence, structuredPlan.tasks.length);

      // 4. Return as standard Plan
      const plan: Plan = {
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

      if (this.graph && this.linker) {
        await this.recordPlanInGraph(plan);
      }

      return plan;

    } catch (error) {
      console.error('[LLMPlanner] LLM Planning failed:', error);
      
      if (this.fallbackPlanner) {
        console.info('[LLMPlanner] Attempting fallback planning...');
        return this.fallbackPlanner.generatePlan(goal, state);
      }
      
      throw error;
    }
  }

  private async recordPlanInGraph(plan: Plan): Promise<void> {
    if (!this.graph || !this.linker) return;

    // Create plan node
    const planNode = await this.graph.createNode({
      type: 'plan',
      label: `Plan: ${plan.goal}`,
      properties: { 
        planId: plan.id,
        goal: plan.goal,
        createdAt: plan.createdAt
      }
    });

    // Create task nodes and link them
    for (const task of plan.tasks) {
      const taskNode = await this.graph.createNode({
        type: 'plan',
        label: `Task: ${task.description}`,
        properties: { taskId: task.id, description: task.description }
      });
      await this.linker.linkNodes(planNode.id, taskNode.id, 'depends_on', 1.0);
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
      4. Estimate your confidence in this plan (0-100).
      5. Return ONLY a valid JSON object matching the schema.
    `;
  }
}
