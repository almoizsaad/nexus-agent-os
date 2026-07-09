import { SessionMemory } from './SessionMemory';
import { PersistentMemory } from './PersistentMemory';
import { Memory } from '../types/agent';

/**
 * MemoryManager coordinates both session and persistent memory layers.
 */
export class MemoryManager implements Memory {
  private session: SessionMemory;
  private persistent: PersistentMemory;

  constructor() {
    this.session = new SessionMemory();
    this.persistent = new PersistentMemory();
  }

  public async store(key: string, value: unknown): Promise<void> {
    this.session.setContext(key, value);
    this.persistent.store(key, value);
  }

  public async retrieve(key: string): Promise<unknown> {
    const sessionVal = this.session.getContext(key);
    if (sessionVal !== undefined) return sessionVal;
    return this.persistent.recall(key);
  }

  public async search(query: string): Promise<unknown[]> {
    const keys = this.persistent.search(query);
    const results = await Promise.all(keys.map(k => this.retrieve(k)));
    return results.filter(r => r !== null);
  }

  public async remember(key: string, value: unknown): Promise<void> {
    await this.store(key, value);
  }

  public async recall(key: string): Promise<unknown> {
    return this.retrieve(key);
  }

  public async clear(): Promise<void> {
    this.session.clear();
    this.persistent.clear();
  }

  public addSessionEvent(event: any): void {
    this.session.addEvent(event);
  }

  public getSessionEvents(): any[] {
    return this.session.getAllEvents();
  }
}
