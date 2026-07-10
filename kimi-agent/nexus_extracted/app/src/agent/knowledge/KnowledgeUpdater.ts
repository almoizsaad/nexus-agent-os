import type { IKnowledgeDatabase, IEmbeddingStore } from '../types/knowledge';
import type { LLMProvider } from '../providers/LLMProvider';

export class KnowledgeUpdater {
  private database: IKnowledgeDatabase;
  private embeddingStore: IEmbeddingStore;
  private llmProvider: LLMProvider;

  constructor(
    database: IKnowledgeDatabase,
    embeddingStore: IEmbeddingStore,
    llmProvider: LLMProvider
  ) {
    this.database = database;
    this.embeddingStore = embeddingStore;
    this.llmProvider = llmProvider;
  }

  public async updateEntry(id: string, content: string, metadata?: any): Promise<void> {
    const existing = await this.database.get(id);
    if (!existing) {
      throw new Error(`Entry with id ${id} not found.`);
    }

    const embedding = await this.llmProvider.embed(content);
    
    await this.database.update(id, {
      content,
      embedding,
      metadata: {
        ...existing.metadata,
        ...metadata,
        updatedAt: Date.now()
      }
    });

    await this.embeddingStore.save(id, embedding);
  }

  public async deleteEntry(id: string): Promise<void> {
    await this.database.delete(id);
    await this.embeddingStore.delete(id);
  }

  public async deduplicate(): Promise<number> {
    // Basic deduplication based on content hash/exact match
    return 0;
  }
}
