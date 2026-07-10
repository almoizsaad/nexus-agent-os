import type { IKnowledgeDatabase, KnowledgeEntry, SearchOptions, VectorSearchResult, IVectorSearch } from '../types/knowledge';
import type { LLMProvider } from '../providers/LLMProvider';

export class KnowledgeDatabase implements IKnowledgeDatabase {
  private prefix = 'nexus_knowledge_';
  private vectorSearch: IVectorSearch;
  private llmProvider: LLMProvider;

  constructor(vectorSearch: IVectorSearch, llmProvider: LLMProvider) {
    this.vectorSearch = vectorSearch;
    this.llmProvider = llmProvider;
  }

  public async add(entry: KnowledgeEntry): Promise<void> {
    try {
      localStorage.setItem(`${this.prefix}${entry.id}`, JSON.stringify(entry));
    } catch (e) {
      console.error('[KnowledgeDatabase] Failed to save entry:', e);
    }
  }

  public async get(id: string): Promise<KnowledgeEntry | null> {
    try {
      const item = localStorage.getItem(`${this.prefix}${id}`);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      console.error('[KnowledgeDatabase] Failed to load entry:', e);
      return null;
    }
  }

  public async update(id: string, entry: Partial<KnowledgeEntry>): Promise<void> {
    const existing = await this.get(id);
    if (!existing) return;

    const updated = {
      ...existing,
      ...entry,
      metadata: {
        ...existing.metadata,
        ...(entry.metadata || {}),
        updatedAt: Date.now()
      }
    };

    await this.add(updated);
  }

  public async delete(id: string): Promise<void> {
    localStorage.removeItem(`${this.prefix}${id}`);
  }

  public async search(query: string, options: SearchOptions = {}): Promise<VectorSearchResult[]> {
    const queryEmbedding = await this.llmProvider.embed(query);
    const vectorResults = await this.vectorSearch.search(queryEmbedding, options.limit || 10);
    
    const allEntries = await this.listAll();
    const filteredEntries = this.filterEntries(allEntries, options);

    if (options.threshold === undefined) options.threshold = 0.5;
    
    const results: VectorSearchResult[] = [];
    
    for (const vr of vectorResults) {
      const entry = filteredEntries.find(e => e.id === vr.id);
      if (entry && vr.score >= (options.threshold || 0)) {
        results.push({
          id: vr.id,
          score: vr.score,
          entry
        });
      }
    }

    return results;
  }

  private async listAll(): Promise<KnowledgeEntry[]> {
    const entries: KnowledgeEntry[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.prefix)) {
        try {
          const entry = JSON.parse(localStorage.getItem(key)!) as KnowledgeEntry;
          entries.push(entry);
        } catch {
          // Skip malformed entries
        }
      }
    }
    return entries;
  }

  private filterEntries(entries: KnowledgeEntry[], options: SearchOptions): KnowledgeEntry[] {
    const { filters } = options;
    if (!filters) return entries;

    return entries.filter(entry => {
      if (filters.tags && !filters.tags.every(tag => entry.metadata.tags.includes(tag))) return false;
      if (filters.sourceType && !filters.sourceType.includes(entry.metadata.sourceType)) return false;
      if (filters.startTime && entry.metadata.createdAt < filters.startTime) return false;
      if (filters.endTime && entry.metadata.createdAt > filters.endTime) return false;
      if (filters.minImportance && entry.metadata.importance < filters.minImportance) return false;
      return true;
    });
  }
}
