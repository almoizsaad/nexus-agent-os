import { describe, it, expect, beforeEach } from 'vitest';
import { KnowledgeGraph } from '../knowledge/KnowledgeGraph';
import { ResearchManager } from '../research/ResearchManager';

describe('Research Agent Capabilities', () => {
  let graph: KnowledgeGraph;
  let research: ResearchManager;

  beforeEach(() => {
    graph = new KnowledgeGraph();
    research = new ResearchManager(graph);
  });

  it('should record research facts with full provenance', async () => {
    const fact = {
      claim: 'Nexus Agent OS is a multi-agent framework.',
      source: 'Internal Documentation',
      url: 'https://nexus.os/docs',
      timestamp: Date.now(),
      confidence: 0.95,
      provider: 'local_docs'
    };

    const node = await research.recordFact(fact);
    expect(node.properties.claim).toBe(fact.claim);
    expect(node.properties.source).toBe(fact.source);
    expect(node.properties.provider).toBe(fact.provider);
    expect(node.properties.confidence).toBe(fact.confidence);
  });

  it('should verify facts and find support in knowledge graph', async () => {
    // Discovery 1
    await research.recordFact({
      claim: 'Vite is a build tool.',
      source: 'Vite Guide',
      url: 'https://vitejs.dev',
      timestamp: Date.now(),
      confidence: 0.9,
      provider: 'web'
    });

    // Discovery 2 (Related)
    const node2 = await research.recordFact({
      claim: 'Vite is a fast build tool for modern web apps.',
      source: 'Blog Post',
      url: 'https://blog.dev/vite',
      timestamp: Date.now(),
      confidence: 0.85,
      provider: 'web'
    });

    const result = await research.verifyFact(node2.id);
    expect(result.status).toBe('verified');
    expect(result.supportingFactIds.length).toBeGreaterThan(0);
  });
});
