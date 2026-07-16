import { EventBus } from './EventBus';

export interface APIMetric {
  provider: string;
  operation: string;
  status: 'success' | 'failure';
  latency: number;
  tokens?: number;
  cost?: number;
  timestamp: number;
}

export interface ProviderStats {
  totalCalls: number;
  successRate: number;
  avgLatency: number;
  totalTokens: number;
  totalCost: number;
  lastUsed: number;
  healthStatus: 'optimal' | 'degraded' | 'critical';
}

/**
 * APIMetricsManager tracks usage, costs, and health of all external APIs.
 */
export class APIMetricsManager {
  private static instance: APIMetricsManager;
  private eventBus: EventBus;
  private metrics: APIMetric[] = [];
  private providerStats: Map<string, ProviderStats> = new Map();

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  public static getInstance(eventBus: EventBus): APIMetricsManager {
    if (!APIMetricsManager.instance) {
      APIMetricsManager.instance = new APIMetricsManager(eventBus);
    }
    return APIMetricsManager.instance;
  }

  public recordMetric(metric: Omit<APIMetric, 'timestamp'>): void {
    const fullMetric: APIMetric = { ...metric, timestamp: Date.now() };
    this.metrics.push(fullMetric);
    this.updateStats(fullMetric);
    
    // Broadcast for UI/Monitoring
    this.eventBus.publish('system:telemetry', {
      type: 'API_METRIC',
      payload: fullMetric
    } as any);

    // Keep memory clean
    if (this.metrics.length > 1000) this.metrics.shift();
  }

  private updateStats(metric: APIMetric): void {
    const stats = this.providerStats.get(metric.provider) || {
      totalCalls: 0,
      successRate: 1,
      avgLatency: 0,
      totalTokens: 0,
      totalCost: 0,
      lastUsed: 0,
      healthStatus: 'optimal'
    };

    stats.totalCalls++;
    stats.lastUsed = metric.timestamp;
    stats.totalTokens += metric.tokens || 0;
    stats.totalCost += metric.cost || 0;
    
    // Rolling average for latency
    stats.avgLatency = (stats.avgLatency * (stats.totalCalls - 1) + metric.latency) / stats.totalCalls;

    // Recalculate health and success rate based on recent metrics
    const recentMetrics = this.metrics
      .filter(m => m.provider === metric.provider)
      .slice(-50);
    
    const successCount = recentMetrics.filter(m => m.status === 'success').length;
    stats.successRate = successCount / recentMetrics.length;

    const failureCount = recentMetrics.filter(m => m.status === 'failure').length;
    const failureRate = failureCount / recentMetrics.length;

    if (failureRate > 0.3) stats.healthStatus = 'critical';
    else if (failureRate > 0.1) stats.healthStatus = 'degraded';
    else stats.healthStatus = 'optimal';

    this.providerStats.set(metric.provider, stats);
    
    // Periodically sync stats to store if needed
  }

  public getStats(provider: string): ProviderStats | undefined {
    return this.providerStats.get(provider);
  }

  public getAllStats(): Record<string, ProviderStats> {
    const result: Record<string, ProviderStats> = {};
    this.providerStats.forEach((stats, provider) => {
      result[provider] = stats;
    });
    return result;
  }
}
