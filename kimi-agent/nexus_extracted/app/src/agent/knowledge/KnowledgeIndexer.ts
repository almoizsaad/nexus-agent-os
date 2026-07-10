import type { 
  IKnowledgeDatabase, 
  KnowledgeEntry, 
  ChunkingOptions, 
  IEmbeddingStore,
  KnowledgeSourceType,
  DocumentFormat,
  KnowledgeMetadata
} from '../types/knowledge';
import type { LLMProvider } from '../providers/LLMProvider';
import { Chunker } from './Chunker';
import { DocumentLoader } from './DocumentLoader';

export class KnowledgeIndexer {
  private chunker = new Chunker();
  private loader = new DocumentLoader();
  private database: IKnowledgeDatabase;
  private embeddingStore: IEmbeddingStore;
  private llmProvider: LLMProvider;
  private chunkingOptions: ChunkingOptions;

  constructor(
    database: IKnowledgeDatabase,
    embeddingStore: IEmbeddingStore,
    llmProvider: LLMProvider,
    chunkingOptions: ChunkingOptions = { maxChunkSize: 1000, overlap: 100 }
  ) {
    this.database = database;
    this.embeddingStore = embeddingStore;
    this.llmProvider = llmProvider;
    this.chunkingOptions = chunkingOptions;
  }

  public async indexDocument(
    source: string,
    type: KnowledgeSourceType,
    format: DocumentFormat,
    content?: string
  ): Promise<string[]> {
    const doc = await this.loader.load(source, type, format, content);
    const chunks = this.chunker.chunk(doc.content, this.chunkingOptions);
    
    const indexedIds: string[] = [];
    const originalId = crypto.randomUUID();

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const id = `${originalId}_${i}`;
      
      const embedding = await this.llmProvider.embed(chunk);
      
      const entry: KnowledgeEntry = {
        id,
        content: chunk,
        embedding,
        metadata: {
          ...doc.metadata as KnowledgeMetadata,
          chunkIndex: i,
          totalChunks: chunks.length,
          originalId,
          updatedAt: Date.now()
        }
      };

      await this.database.add(entry);
      await this.embeddingStore.save(id, embedding);
      indexedIds.push(id);
    }

    return indexedIds;
  }

  public async indexConversation(conversationId: string, messages: { role: string; content: string }[]): Promise<string> {
    const content = messages.map(m => `${m.role}: ${m.content}`).join('\n');
    const ids = await this.indexDocument(conversationId, 'conversation', 'txt', content);
    return ids[0].split('_')[0]; // Return the base UUID
  }
}
