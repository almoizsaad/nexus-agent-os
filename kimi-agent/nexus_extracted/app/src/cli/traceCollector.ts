import { EventBus } from '../agent/core/EventBus';
import { AgentEventType } from '../agent/types/agent';

export interface TraceEntry {
  timestamp: string;
  type: string;
  source: string;
  payload: Record<string, unknown>;
}

export class TraceCollector {
  private entries: TraceEntry[] = [];
  private eventBus: EventBus;
  private unsubscribers: (() => void)[] = [];

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  public start() {
    this.entries = [];
    
    // Subscribe to all topics we care about
    this.unsubscribers.push(
      this.eventBus.subscribe('agent:events', (event) => this.record('EVENT', 'AgentEventBus', event as Record<string, unknown>)),
      this.eventBus.subscribe('agent:thoughts', (event) => this.record('THOUGHT', 'ThoughtBus', event as Record<string, unknown>)),
      this.eventBus.subscribe('agent:actions', (action) => this.record('ACTION', 'ActionBus', action as Record<string, unknown>)),
      this.eventBus.subscribe('agent:communication', (msg) => this.record('COMMUNICATION', 'CommBus', msg as Record<string, unknown>)),
      this.eventBus.subscribe('agent:lifecycle', (event) => this.record('EVENT', 'LifecycleBus', event as Record<string, unknown>))
    );
  }

  public stop() {
    this.unsubscribers.forEach(unsub => unsub());
    this.unsubscribers = [];
  }

  public record(type: string, source: string, payload: Record<string, unknown>) {
    this.entries.push({
      timestamp: new Date().toISOString(),
      type,
      source,
      payload
    });
  }

  public getTrace() {
    return this.entries;
  }

  public exportMarkdown(title: string): string {
    let md = `# MISSION EXECUTION TRACE: ${title}\n\n`;
    md += `Generated at: ${new Date().toISOString()}\n\n`;
    md += `| Timestamp | Type | Source | Description |\n`;
    md += `| :--- | :--- | :--- | :--- |\n`;

    for (const entry of this.entries) {
      let desc = '';
      const p = entry.payload;
      
      if (entry.type === 'EVENT') {
        desc = `**${p.type}**: `;
        if (p.type === AgentEventType.TOOL_RESULT) desc += `Tool ${p.payload.toolName} ${p.payload.success ? 'succeeded' : 'failed'}`;
        else if (p.type === AgentEventType.AGENT_UPDATE) desc += `Status -> ${p.payload.status}`;
        else if (p.type === AgentEventType.AGENT_LIFECYCLE) desc += `Agent ${p.payload.identity?.name || p.payload.agentId} ${p.payload.action}`;
        else desc += JSON.stringify(p.payload).substring(0, 100);
      } else if (entry.type === 'THOUGHT') {
        const t = p.payload.thought as any;
        desc = `[${t.type}] ${t.content}`;
      } else if (entry.type === 'ACTION') {
        desc = `**${p.type}**: ${p.payload.message || p.payload.status || ''}`;
      } else if (entry.type === 'COMMUNICATION') {
        desc = `MSG: ${p.type} from ${p.sender}`;
      } else if (entry.type === 'DECISION') {
        desc = `**DECISION**: ${p.action} - ${p.title || p.missionId || ''}`;
      }

      md += `| ${entry.timestamp} | ${entry.type} | ${entry.source} | ${desc.replace(/\|/g, '\\|')} |\n`;
    }

    return md;
  }
}
