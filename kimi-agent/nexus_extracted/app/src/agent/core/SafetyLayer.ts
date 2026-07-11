import type { 
  ISafetyGuard, 
  IRiskAnalyzer, 
  ICostAnalyzer, 
  IPolicyValidator,
  SafetyReport,
  RiskLevel
} from '../types/safety';
import type { Plan } from '../types/agent';

export class RiskAnalyzer implements IRiskAnalyzer {
  public async analyzeRisk(plan: Plan): Promise<{ riskScore: number; factors: string[] }> {
    const factors: string[] = [];
    let score = 0;

    // Check for high-risk tools or patterns
    for (const task of plan.tasks) {
      if (task.description.toLowerCase().includes('delete') || task.description.toLowerCase().includes('remove')) {
        score += 30;
        factors.push(`Destructive action detected in task: ${task.id}`);
      }
      if (task.description.toLowerCase().includes('exec') || task.description.toLowerCase().includes('shell')) {
        score += 50;
        factors.push(`System command execution detected in task: ${task.id}`);
      }
      if (task.metadata?.privileged) {
        score += 40;
        factors.push(`Privileged operation requested in task: ${task.id}`);
      }
    }

    if (plan.tasks.length > 10) {
      score += 20;
      factors.push('High complexity plan (too many tasks)');
    }

    return { 
      riskScore: Math.min(100, score), 
      factors 
    };
  }
}

export class CostAnalyzer implements ICostAnalyzer {
  private tokenLimit = 100000;
  private dollarLimit = 5.00;

  public async analyzeCost(plan: Plan): Promise<{ costScore: number; tokens: number; dollars: number }> {
    // Simulated cost estimation
    const tokens = plan.tasks.length * 2000; // Estimated 2k tokens per task
    const dollars = (tokens / 1000) * 0.02; // $0.02 per 1k tokens

    const costScore = (tokens / this.tokenLimit) * 50 + (dollars / this.dollarLimit) * 50;
    
    return {
      costScore: Math.min(100, costScore),
      tokens,
      dollars
    };
  }
}

export class PolicyValidator implements IPolicyValidator {
  private forbiddenKeywords = ['credential', 'password', 'secret', 'key'];

  public async validatePolicies(plan: Plan): Promise<{ violations: string[] }> {
    const violations: string[] = [];

    for (const task of plan.tasks) {
      for (const keyword of this.forbiddenKeywords) {
        if (task.description.toLowerCase().includes(keyword)) {
          violations.push(`Policy Violation: Sensitive information access attempted in task ${task.id} (Keyword: ${keyword})`);
        }
      }
    }

    return { violations };
  }
}

export class SafetyGuard implements ISafetyGuard {
  private riskAnalyzer = new RiskAnalyzer();
  private costAnalyzer = new CostAnalyzer();
  private policyValidator = new PolicyValidator();

  private thresholds = {
    maxRisk: 70,
    maxCost: 80,
    minSafety: 40
  };

  public async evaluatePlan(plan: Plan): Promise<SafetyReport> {
    const riskResult = await this.riskAnalyzer.analyzeRisk(plan);
    const costResult = await this.costAnalyzer.analyzeCost(plan);
    const policyResult = await this.policyValidator.validatePolicies(plan);

    const riskScore = riskResult.riskScore;
    const costScore = costResult.costScore;
    const policyViolationCount = policyResult.violations.length;

    // Safety Score: 100 - (weighted average of risk, cost, and violations)
    const safetyScore = Math.max(0, 100 - (riskScore * 0.4 + costScore * 0.2 + policyViolationCount * 20));

    const warnings: string[] = [];
    const errors: string[] = [];

    if (riskScore > 50) warnings.push(`High execution risk (${riskScore})`);
    if (costScore > 50) warnings.push(`High execution cost (${costScore})`);
    
    if (riskScore >= this.thresholds.maxRisk) errors.push(`Risk threshold exceeded (${riskScore} > ${this.thresholds.maxRisk})`);
    if (costScore >= this.thresholds.maxCost) errors.push(`Cost threshold exceeded (${costScore} > ${this.thresholds.maxCost})`);
    if (safetyScore < this.thresholds.minSafety) errors.push(`Safety score too low (${safetyScore} < ${this.thresholds.minSafety})`);
    if (policyViolationCount > 0) errors.push(`${policyViolationCount} policy violations detected`);

    return {
      planId: plan.id,
      timestamp: Date.now(),
      score: {
        riskScore,
        costScore,
        safetyScore,
        confidence: plan.reasoning ? 90 : 70 // Placeholder for confidence estimation
      },
      passed: errors.length === 0,
      warnings,
      errors,
      riskAnalysis: {
        level: this.getRiskLevel(riskScore),
        factors: riskResult.factors
      },
      costAnalysis: {
        estimatedTokens: costResult.tokens,
        estimatedDollars: costResult.dollars,
        limitExceeded: costScore >= this.thresholds.maxCost
      },
      policyViolations: policyResult.violations
    };
  }

  private getRiskLevel(score: number): RiskLevel {
    if (score < 20) return 'low';
    if (score < 50) return 'medium';
    if (score < 80) return 'high';
    return 'critical';
  }
}
