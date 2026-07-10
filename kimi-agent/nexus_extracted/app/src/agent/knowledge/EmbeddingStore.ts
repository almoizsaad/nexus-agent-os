import type { IEmbeddingStore } from '../types/knowledge';

export class EmbeddingStore implements IEmbeddingStore {
  private prefix = 'nexus_embedding_';

  public async save(id: string, embedding: number[]): Promise<void> {
    try {
      localStorage.setItem(`${this.prefix}${id}`, JSON.stringify(embedding));
    } catch (e) {
      console.error('[EmbeddingStore] Failed to save embedding:', e);
    }
  }

  public async get(id: string): Promise<number[] | null> {
    try {
      const item = localStorage.getItem(`${this.prefix}${id}`);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      console.error('[EmbeddingStore] Failed to load embedding:', e);
      return null;
    }
  }

  public async delete(id: string): Promise<void> {
    localStorage.removeItem(`${this.prefix}${id}`);
  }

  public async list(): Promise<{ id: string; embedding: number[] }[]> {
    const results: { id: string; embedding: number[] }[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.prefix)) {
        try {
          const id = key.replace(this.prefix, '');
          const embedding = JSON.parse(localStorage.getItem(key)!) as number[];
          results.push({ id, embedding });
        } catch {
          // Skip malformed entries
        }
      }
    }
    return results;
  }

  public async clear(): Promise<void> {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.prefix)) {
        keys.push(key);
      }
    }
    keys.forEach(k => localStorage.removeItem(k));
  }
}
