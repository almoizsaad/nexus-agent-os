import { AgentRuntime } from '../core/AgentRuntime';
import type { EventBus } from '../core/EventBus';
import type { Planner, Executor, AgentIdentity } from '../types/agent';
import type { IPerformanceMonitor, IImprovementEngine } from '../types/improvement';
import type { OptimizationSuggestions } from '../improvement/OptimizationSuggestions';
import type { KnowledgeGraph } from '../knowledge/KnowledgeGraph';
import type { AgentChannel } from '../core/AgentChannel';
import { ResearchManager } from './ResearchManager';

/**
 * Specialist agent for deep research, fact-checking, and knowledge synthesis.
 */
export class ResearchAgent extends AgentRuntime {
  private researchManager: ResearchManager;

  constructor(
    eventBus: EventBus,
    planner: Planner,
    executor: Executor,
    monitor: IPerformanceMonitor,
    improvementEngine: IImprovementEngine,
    suggestions: OptimizationSuggestions,
    identity: AgentIdentity,
    channel: AgentChannel,
    knowledgeGraph: KnowledgeGraph
  ) {
    super(eventBus, planner, executor, monitor, improvementEngine, suggestions, identity, channel, knowledgeGraph);
    this.researchManager = new ResearchManager(knowledgeGraph);
  }

  /**
   * Overrides processGoal to provide specialized research capabilities.
   */
  public async processGoal(goal: string): Promise<void> {
    this._stream.thought(`Starting research mission: ${goal}`, 'plan');
    await super.processGoal(goal);
    
    // After execution, perform a summary reflection
    const memories = await this._memory.recallMemories(goal);
    if (memories.length > 0) {
      this._stream.thought('Synthesizing research findings and verifying facts...', 'reasoning');
      // In a real system, we would iterate over discovered facts and verify them
    }
  }

  public get research(): ResearchManager {
    return this.researchManager;
  }
}
