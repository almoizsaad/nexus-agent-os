import type { IThoughtPersistence, Thought, ThoughtChain, ThoughtQuery } from '../types/thought';
import { PersistentMemory } from '../memory/PersistentMemory';

/**
 * ThoughtPersistence handles long-term storage of agent reasoning steps.
 */
export class ThoughtPersistence implements IThoughtPersistence {
  private memory: PersistentMemory;
  private readonly THOUGHTS_KEY = 'thoughts';
  private readonly CHAINS_KEY = 'chains';
  private saveLock: Promise<void> = Promise.resolve();

  constructor(memory: PersistentMemory) {
    this.memory = memory;
  }

  public async saveThought(thought: Thought): Promise<void> {
    this.saveLock = this.saveLock.then(async () => {
      const thoughts = this.getAllThoughts();
      thoughts.push(thought);
      
      if (thoughts.length > 1000) {
        thoughts.shift();
      }
      
      this.memory.store(this.THOUGHTS_KEY, thoughts);
    });
    return this.saveLock;
  }

  public async saveChain(chain: ThoughtChain): Promise<void> {
    this.saveLock = this.saveLock.then(async () => {
      const chains = this.getAllChains();
      const index = chains.findIndex(c => c.id === chain.id);
      if (index >= 0) {
        chains[index] = { ...chain }; // Store a copy
      } else {
        chains.push({ ...chain });
        
        if (chains.length > 100) {
          chains.shift();
        }
      }
      this.memory.store(this.CHAINS_KEY, chains);
    });
    return this.saveLock;
  }

  public async getThought(id: string): Promise<Thought | null> {
    return this.getAllThoughts().find(t => t.id === id) || null;
  }

  public async getChain(id: string): Promise<ThoughtChain | null> {
    return this.getAllChains().find(c => c.id === id) || null;
  }

  public async findThoughts(query: ThoughtQuery): Promise<Thought[]> {
    let thoughts = this.getAllThoughts();

    if (query.agentId) thoughts = thoughts.filter(t => t.agentId === query.agentId);
    if (query.workflowId) thoughts = thoughts.filter(t => t.workflowId === query.workflowId);
    if (query.taskId) thoughts = thoughts.filter(t => t.taskId === query.taskId);
    if (query.type) thoughts = thoughts.filter(t => t.type === query.type);
    if (query.startTime) thoughts = thoughts.filter(t => t.timestamp >= query.startTime!);
    if (query.endTime) thoughts = thoughts.filter(t => t.timestamp <= query.endTime!);

    // Newest first
    thoughts.sort((a, b) => b.timestamp - a.timestamp);

    if (query.limit) thoughts = thoughts.slice(0, query.limit);

    return thoughts;
  }

  public async findChains(query: { agentId?: string; workflowId?: string }): Promise<ThoughtChain[]> {
    let chains = this.getAllChains();

    if (query.agentId) chains = chains.filter(c => c.agentId === query.agentId);
    if (query.workflowId) chains = chains.filter(c => c.workflowId === query.workflowId);

    // Newest first
    chains.sort((a, b) => b.startTime - a.startTime);

    return chains;
  }

  private getAllThoughts(): Thought[] {
    const stored = this.memory.recall(this.THOUGHTS_KEY);
    return Array.isArray(stored) ? (stored as Thought[]) : [];
  }

  private getAllChains(): ThoughtChain[] {
    const stored = this.memory.recall(this.CHAINS_KEY);
    return Array.isArray(stored) ? (stored as ThoughtChain[]) : [];
  }
}
