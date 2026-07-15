import type { GraphNode, GraphEdge } from '../types/knowledge';
import { PersistentMemory } from '../memory/PersistentMemory';

export interface SerializedGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/**
 * KnowledgePersistence handles saving and loading the KnowledgeGraph.
 */
export class KnowledgePersistence {
  private memory: PersistentMemory;
  private storageKey = 'knowledge_graph';

  constructor(memory: PersistentMemory) {
    this.memory = memory;
  }

  public async save(nodes: GraphNode[], edges: GraphEdge[]): Promise<void> {
    const data: SerializedGraph = { nodes, edges };
    this.memory.store(this.storageKey, data);
  }

  public async load(): Promise<SerializedGraph | null> {
    const data = this.memory.recall(this.storageKey) as SerializedGraph | null;
    return data;
  }

  public async clear(): Promise<void> {
    this.memory.remove(this.storageKey);
  }
}
