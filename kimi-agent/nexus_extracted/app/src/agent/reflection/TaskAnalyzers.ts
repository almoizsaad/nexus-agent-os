import type { IFailureAnalyzer, ISuccessAnalyzer } from '../types/reflection';

export class FailureAnalyzer implements IFailureAnalyzer {
  public async analyzeFailure(taskId: string, error: string): Promise<string> {
    if (error.includes('timeout')) {
      return `Task ${taskId} failed due to timeout. Suggest increasing timeout or checking connection.`;
    }
    if (error.includes('rate limit')) {
      return `Task ${taskId} hit rate limits. Suggest adding delay or backoff.`;
    }
    if (error.includes('invalid') || error.includes('format')) {
      return `Task ${taskId} failed due to invalid data format. Suggest validating input/output schemas.`;
    }
    return `Task ${taskId} failed with error: ${error}. Need further investigation.`;
  }
}

export class SuccessAnalyzer implements ISuccessAnalyzer {
  public async analyzeSuccess(taskId: string, result: any): Promise<string> {
    const complexity = result && typeof result === 'object' ? Object.keys(result).length : 0;
    if (complexity > 10) {
      return `Task ${taskId} succeeded with high data volume. Performance was optimal.`;
    }
    return `Task ${taskId} succeeded smoothly.`;
  }
}
