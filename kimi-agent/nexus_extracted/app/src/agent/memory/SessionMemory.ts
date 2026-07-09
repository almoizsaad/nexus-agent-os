/**
 * SessionMemory handles short-term context for the current conversation.
 */
export class SessionMemory {
  private events: any[] = [];
  private context: Record<string, any> = {};
  private currentGoal: string | null = null;
  private activePlan: any | null = null;
  private executionState: any | null = null;

  public setGoal(goal: string): void {
    this.currentGoal = goal;
  }

  public getGoal(): string | null {
    return this.currentGoal;
  }

  public setPlan(plan: any): void {
    this.activePlan = plan;
  }

  public getPlan(): any | null {
    return this.activePlan;
  }

  public setExecutionState(state: any): void {
    this.executionState = state;
  }

  public getExecutionState(): any | null {
    return this.executionState;
  }

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
