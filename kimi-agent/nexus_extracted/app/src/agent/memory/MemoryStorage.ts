import type { IMemoryStorage, MemoryEntry, MemoryQuery } from '../types/memory';

export class MemoryStorage implements IMemoryStorage {
  private prefix = 'nexus_memory_';

  public async save(entry: MemoryEntry): Promise<void> {
    try {
      localStorage.setItem(`${this.prefix}${entry.id}`, JSON.stringify(entry));
    } catch (e) {
      console.error('[MemoryStorage] Failed to save entry:', e);
    }
  }

  public async load(id: string): Promise<MemoryEntry | null> {
    try {
      const item = localStorage.getItem(`${this.prefix}${id}`);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      console.error('[MemoryStorage] Failed to load entry:', e);
      return null;
    }
  }

  public async delete(id: string): Promise<void> {
    localStorage.removeItem(`${this.prefix}${id}`);
  }

  public async list(query: MemoryQuery): Promise<MemoryEntry[]> {
    const entries: MemoryEntry[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.prefix)) {
        try {
          const entry = JSON.parse(localStorage.getItem(key)!) as MemoryEntry;
          if (this.matchesQuery(entry, query)) {
            entries.push(entry);
          }
        } catch {
          // Skip malformed entries
        }
      }
    }

    // Sort by timestamp desc
    entries.sort((a, b) => b.timestamp - a.timestamp);

    return query.limit ? entries.slice(0, query.limit) : entries;
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

  private matchesQuery(entry: MemoryEntry, query: MemoryQuery): boolean {
    if (query.types && !query.types.includes(entry.type)) return false;
    if (query.startTime && entry.timestamp < query.startTime) return false;
    if (query.endTime && entry.timestamp > query.endTime) return false;
    if (query.minImportance && entry.metadata.importance < query.minImportance) return false;
    
    if (query.tags && query.tags.length > 0) {
      if (!query.tags.some(tag => entry.tags.includes(tag))) return false;
    }

    if (query.text) {
      const contentStr = JSON.stringify(entry.content).toLowerCase();
      if (!contentStr.includes(query.text.toLowerCase())) return false;
    }

    return true;
  }
}
