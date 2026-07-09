/**
 * SessionMemory handles short-term context for the current conversation.
 */
export class SessionMemory {
  private events: any[] = [];
  private context: Record<string, any> = {};

  public addEvent(event: any): void {
    this.events.push({
      ...event,
      timestamp: Date.now()
    });
    // Keep only last 100 events in session
    if (this.events.length > 100) {
      this.events.shift();
    }
  }

  public setContext(key: string, value: any): void {
    this.context[key] = value;
  }

  public getContext(key: string): any {
    return this.context[key];
  }

  public getAllEvents(): any[] {
    return [...this.events];
  }

  public clear(): void {
    this.events = [];
    this.context = {};
  }
}
