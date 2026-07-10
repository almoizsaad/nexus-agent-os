export type KnowledgeSourceType = 'file' | 'web' | 'workspace' | 'conversation';
export type DocumentFormat = 'markdown' | 'json' | 'txt' | 'pdf';

export interface KnowledgeMetadata {
  source: string;
  sourceType: KnowledgeSourceType;
  format: DocumentFormat;
  title?: string;
  author?: string;
  createdAt: number;
  updatedAt: number;
  tags: string[];
  importance: number; // 0-1
  chunkIndex?: number;
  totalChunks?: number;
  originalId?: string; // Reference to the original document if this is a chunk
}

export interface KnowledgeEntry {
  id: string;
  content: string;
  metadata: KnowledgeMetadata;
  embedding?: number[];
}

export interface VectorSearchResult {
  id: string;
  score: number;
  entry: KnowledgeEntry;
}

export interface SearchOptions {
  limit?: number;
  threshold?: number;
  filters?: {
    tags?: string[];
    sourceType?: KnowledgeSourceType[];
    startTime?: number;
    endTime?: number;
    minImportance?: number;
  };
}

export interface ChunkingOptions {
  maxChunkSize: number;
  overlap: number;
}

export interface IEmbeddingStore {
  save(id: string, embedding: number[]): Promise<void>;
  get(id: string): Promise<number[] | null>;
  delete(id: string): Promise<void>;
  list(): Promise<{ id: string; embedding: number[] }[]>;
  clear(): Promise<void>;
}

export interface IVectorSearch {
  search(queryEmbedding: number[], topK?: number): Promise<{ id: string; score: number }[]>;
}

export interface IKnowledgeDatabase {
  add(entry: KnowledgeEntry): Promise<void>;
  get(id: string): Promise<KnowledgeEntry | null>;
  update(id: string, entry: Partial<KnowledgeEntry>): Promise<void>;
  delete(id: string): Promise<void>;
  search(query: string, options?: SearchOptions): Promise<VectorSearchResult[]>;
}
