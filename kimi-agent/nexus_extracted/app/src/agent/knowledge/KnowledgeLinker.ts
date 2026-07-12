import type { 
  IKnowledgeGraph, 
  RelationType
} from '../types/knowledge';

export class KnowledgeLinker {
  private graph: IKnowledgeGraph;

  constructor(graph: IKnowledgeGraph) {
    this.graph = graph;
  }

  public async linkNodes(
    sourceId: string, 
    targetId: string, 
    type: RelationType, 
    weight: number = 0.5,
    properties: Record<string, unknown> = {}
  ): Promise<void> {
    await this.graph.createRelation(sourceId, targetId, type, weight, properties);
  }

  public async inferRelations(nodeId: string): Promise<void> {
    const node = await this.graph.getNode(nodeId);
    if (!node) return;

    // TODO: Use LLM to find semantic relations
  }

  public async linkDocumentToConcepts(docNodeId: string, conceptNodeIds: string[]): Promise<void> {
    for (const conceptId of conceptNodeIds) {
      await this.linkNodes(docNodeId, conceptId, 'references', 0.8);
    }
  }

  public async linkPlanToTools(planNodeId: string, toolNodeIds: string[]): Promise<void> {
    for (const toolId of toolNodeIds) {
      await this.linkNodes(planNodeId, toolId, 'depends_on', 1.0);
    }
  }

  public async linkAgentToPlans(agentNodeId: string, planNodeIds: string[]): Promise<void> {
    for (const planId of planNodeIds) {
      await this.linkNodes(agentNodeId, planId, 'causes', 0.9);
    }
  }
}
