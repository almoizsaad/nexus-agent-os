import type { Planner, AgentState, Plan } from '../types/agent';
import type { LLMProvider } from '../providers/LLMProvider';
import { PlanSchema } from './schemas';
import type { StructuredPlan } from './schemas';
import { ToolRegistry } from '../tools/ToolRegistry';
import { StructuredPlanner } from './StructuredPlanner';
import type { IKnowledgeGraph } from '../types/knowledge';
import { KnowledgeLinker } from '../knowledge/KnowledgeLinker';
import type { ISafetyGuard } from '../types/safety';
import { SafetyGuard } from '../core/SafetyLayer';

/**
 * PlannerEngine coordinates the LLM-based planning process.
 */
export class PlannerEngine implements Planner {
  private provider: LLMProvider;
  private toolRegistry: ToolRegistry;
  private structuredPlanner: StructuredPlanner;
  private graph?: IKnowledgeGraph;
  private linker?: KnowledgeLinker;
  private safetyGuard: ISafetyGuard;

  constructor(provider: LLMProvider, toolRegistry: ToolRegistry, graph?: IKnowledgeGraph, safetyGuard?: ISafetyGuard) {
    this.provider = provider;
    this.toolRegistry = toolRegistry;
    this.structuredPlanner = new StructuredPlanner();
    this.graph = graph;
    if (graph) {
      this.linker = new KnowledgeLinker(graph);
    }
    this.safetyGuard = safetyGuard || new SafetyGuard();
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

      const plan: Plan = {
        ...refinedPlan,
        createdAt: refinedPlan.createdAt || Date.now(),
        tasks: refinedPlan.tasks.map((t) => ({
          ...t,
          status: 'pending' as const
        }))
      };

      // Phase 6.3: Safety Evaluation
      const safetyReport = await this.safetyGuard.evaluatePlan(plan);
      if (!safetyReport.passed) {
        console.error('[PlannerEngine] Plan rejected by Safety Layer:', safetyReport.errors);
        throw new Error(`Safety Violation: ${safetyReport.errors.join('; ')}`);
      }

      if (this.graph && this.linker) {
        await this.recordPlanInGraph(plan);
      }

      return plan;
    } catch (error) {
      console.error('[PlannerEngine] Failed to generate plan:', error);
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
}
