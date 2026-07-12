import type { GraphNode, KnowledgeGraph } from '../knowledge/KnowledgeGraph';
import type { RelationType } from '../types/knowledge';

export interface ResearchFact {
  id: string;
  claim: string;
  source: string;
  url?: string;
  timestamp: number;
  confidence: number;
  provider: string;
  metadata?: Record<string, unknown>;
}

export interface VerificationResult {
  factId: string;
  status: 'verified' | 'contradicted' | 'uncertain';
  confidence: number;
  reasoning: string;
  supportingFactIds: string[];
  contradictingFactIds: string[];
}

/**
 * ResearchManager handles the lifecycle of research facts, including
 * storage in the Knowledge Graph and verification against multiple sources.
 */
export class ResearchManager {
  private graph: KnowledgeGraph;

  constructor(graph: KnowledgeGraph) {
    this.graph = graph;
  }

  /**
   * Records a new fact discovered during research.
   */
  public async recordFact(fact: Omit<ResearchFact, 'id'>): Promise<GraphNode> {
    const node = await this.graph.createNode({
      type: 'entity',
      label: fact.claim.substring(0, 50) + (fact.claim.length > 50 ? '...' : ''),
      properties: {
        ...fact,
        id: crypto.randomUUID(),
        claim: fact.claim,
        source: fact.source,
        url: fact.url,
        timestamp: fact.timestamp,
        confidence: fact.confidence,
        provider: fact.provider
      }
    });

    return node;
  }

  /**
   * Verifies a fact by comparing it against other facts in the knowledge graph.
   */
  public async verifyFact(factId: string): Promise<VerificationResult> {
    const node = await this.graph.getNode(factId);
    if (!node) throw new Error(`Fact node ${factId} not found`);

    if (!node.properties.claim) {
      return {
        factId,
        status: 'uncertain',
        confidence: 0,
        reasoning: 'Node does not contain a claim to verify.',
        supportingFactIds: [],
        contradictingFactIds: []
      };
    }

    const claim = (node.properties.claim as string).toLowerCase();
    
    // Search for related facts
    const relatedNodes = Array.from(this.graph.nodes.values());
    
    const supporting: string[] = [];
    const contradicting: string[] = [];
    let overallConfidence = (node.properties.confidence as number) || 0;

    for (const related of relatedNodes) {
      if (related.id === factId) continue;
      if (related.type !== 'entity' || !related.properties.claim) continue;

      const relatedClaim = (related.properties.claim as string).toLowerCase();
      
      const claimWords = claim.split(' ').filter(w => w.length > 3);
      const relatedWords = relatedClaim.split(' ').filter(w => w.length > 3);
      const commonWords = claimWords.filter(w => relatedWords.includes(w));
      
      // If they share more than 50% of the shorter claim's keywords
      if (commonWords.length >= Math.min(claimWords.length, relatedWords.length) * 0.5) {
        supporting.push(related.id);
        await this.graph.createRelation(factId, related.id, 'supports' as RelationType, 0.8);
      }
    }

    const status = contradicting.length > 0 ? 'contradicted' : (supporting.length > 0 ? 'verified' : 'uncertain');
    
    return {
      factId,
      status,
      confidence: overallConfidence,
      reasoning: `Found ${supporting.length} supporting sources and ${contradicting.length} contradicting sources.`,
      supportingFactIds: supporting,
      contradictingFactIds: contradicting
    };
  }
}
