import type { 
  MemoryEntry, 
  MemoryType, 
  MemoryQuery, 
  MemoryConfig,
  IMemoryStorage,
  IMemoryIndex,
  MemoryRetrievalPipeline
} from '../types/memory';
import { MemoryStorage } from './MemoryStorage';
import { MemoryIndex } from './MemoryIndex';
import { MemoryScorer } from './MemoryScorer';
import { MemoryRetriever } from './MemoryRetriever';
import { MemoryCompressor } from './MemoryCompressor';
import { MemorySummarizer } from './MemorySummarizer';

/**
 * MemoryManager is the central orchestrator for the Autonomous Memory Layer.
 * It manages Working, Session, and Long-Term memory with automatic indexing and retrieval.
 */
export class MemoryManager {
  private storage: IMemoryStorage;
  private index: IMemoryIndex;
  private retriever: MemoryRetrievalPipeline;
  private compressor: MemoryCompressor;
  private summarizer: MemorySummarizer;

  private config: MemoryConfig = {
    limits: {
      working: 10,
      session: 100,
      persistent: 1000,
    },
    expiration: {
      maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
      minImportanceToKeep: 0.1,
    }
  };

  constructor() {
    this.storage = new MemoryStorage();
    this.index = new MemoryIndex();
    const scorer = new MemoryScorer();
    this.retriever = new MemoryRetriever(this.index, this.storage, scorer);
    this.compressor = new MemoryCompressor();
    this.summarizer = new MemorySummarizer();
  }

  /**
   * Stores a new memory entry.
   */
  public async store(
    type: MemoryType, 
    content: any, 
    tags: string[] = [], 
    importance: number = 0.5,
    metadata: Record<string, any> = {}
  ): Promise<string> {
    // Phase 4.1: Basic limit check
    const currentCount = (await this.storage.list({ types: [type] })).length;
    const limit = (this.config.limits as any)[type] || this.config.limits.persistent;
    
    if (currentCount >= limit) {
      console.warn(`[MemoryManager] Limit reached for ${type} memory. Compressing...`);
      const entries = await this.storage.list({ types: [type] });
      await this.compressor.compress(entries);
      // In a real system, we would prune the storage here.
    }

    const entry: MemoryEntry = {
      id: crypto.randomUUID(),
      type,
      content,
      timestamp: Date.now(),
      tags,
      metadata: {
        importance,
        lastAccessed: Date.now(),
        ...metadata
      }
    };

    await this.storage.save(entry);
    await this.index.index(entry);

    return entry.id;
  }

  /**
   * Recalls relevant memories based on a query.
   * Implementation of the retrieval pipeline: Query -> Similarity -> Ranking -> Context.
   */
  public async recallMemories(queryText: string, limit: number = 5): Promise<MemoryEntry[]> {
    const query: MemoryQuery = {
      text: queryText,
      limit
    };

    return this.retriever.retrieve(query);
  }

  /**
   * For backward compatibility.
   */
  public async recall(key: string): Promise<any> {
    return this.retrieve(key);
  }

  /**
   * Specifically for session-based event logging (Episodic).
   */
  public async addSessionEvent(event: any): Promise<void> {
    await this.store('session', event, ['episodic', event.type], 0.3);
  }

  /**
   * Automatic consolidation: after a workflow finishes, summarize session events into semantic memory.
   */
  public async consolidateSession(goalId: string): Promise<void> {
    const sessionMemories = await this.storage.list({ 
      types: ['session'],
      limit: 100 
    });

    if (sessionMemories.length === 0) return;

    const summary = await this.summarizer.summarize(sessionMemories);
    
    await this.store('semantic', {
      summary,
      goalId,
      originalCount: sessionMemories.length
    }, ['summary', 'consolidation'], 0.8, { goalId });

    // Optional: compress/cleanup session memories
    await this.compressor.compress(sessionMemories);
    // In a real system, we might delete the ones NOT in compressed.
  }

  /**
   * Automatic consolidation with Reflection Engine.
   */
  public async consolidateWithReflection(workflowId: string, reflection: any): Promise<void> {
    await this.store('semantic', {
      type: 'reflection',
      workflowId,
      reflection
    }, ['reflection', 'learning'], 0.9, { workflowId });

    console.log(`[MemoryManager] Persisted reflection for workflow: ${workflowId}`);
  }

  public async clear(): Promise<void> {
    await this.storage.clear();
    (this.index as MemoryIndex).clear();
  }

  // Backward compatibility methods
  public async remember(key: string, value: any): Promise<void> {
    await this.store('semantic', { key, value }, ['legacy', key], 0.5);
  }

  public async retrieve(key: string): Promise<any> {
    const results = await this.recallMemories(key, 1);
    if (results.length > 0 && results[0].tags.includes('legacy')) {
      return (results[0].content as any).value;
    }
    return results.length > 0 ? results[0].content : null;
  }

  /**
   * Old recall method returned the value directly.
   */
  public async recallOld(key: string): Promise<any> {
    return this.retrieve(key);
  }

  /**
   * Old search method returned values.
   */
  public async search(queryText: string): Promise<any[]> {
    const entries = await this.recallMemories(queryText, 10);
    return entries.map(e => {
      if (e.tags.includes('legacy')) return (e.content as any).value;
      return e.content;
    });
  }

  public setGoal(goal: string): void {
    this.store('working', { currentGoal: goal }, ['goal'], 1.0);
  }

  public getGoal(): string | null {
    // Session caching could be added for sync access
    return null; 
  }

  public async recallGoal(): Promise<string | null> {
    const memories = await this.storage.list({ types: ['working'], tags: ['goal'], limit: 1 });
    return memories.length > 0 ? (memories[0].content as any).currentGoal : null;
  }
}
