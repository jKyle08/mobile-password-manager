import { Credential } from '@/models/credential.model';
import { PasswordStrengthService, PasswordStrengthResult } from './password-strength';

export interface ReusedIssue {
  password: string;
  accounts: Credential[];
  count: number;
}

export interface WeakIssue {
  account: Credential;
  strengthResult: PasswordStrengthResult;
  reasons: string[];
}

export interface OldIssue {
  account: Credential;
  daysOld: number;
  lastUpdatedDate: string;
}

export interface AccountSecurityAudit {
  credentialId: string;
  isReused: boolean;
  isWeak: boolean;
  isOld: boolean;
  isSafe: boolean;
  reusedWithCount: number;
  strengthResult: PasswordStrengthResult;
  daysOld: number;
  issues: string[];
}

export type HealthGrade = 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';

export interface VaultHealthReport {
  score: number; // 0 to 100
  grade: HealthGrade;
  statusLabel: string;
  totalAccounts: number;
  reusedIssues: ReusedIssue[];
  reusedAccountsCount: number;
  weakIssues: WeakIssue[];
  oldIssues: OldIssue[];
  safeAccountsCount: number;
  totalVulnerabilitiesCount: number;
  auditMap: Record<string, AccountSecurityAudit>;
}

export class VaultHealthService {
  public static readonly STAGNANT_DAYS_THRESHOLD = 90;

  /**
   * Evaluates all credentials in the vault and generates a comprehensive security audit report.
   */
  public static analyze(credentials: Credential[]): VaultHealthReport {
    if (!credentials || credentials.length === 0) {
      return {
        score: 100,
        grade: 'A+',
        statusLabel: 'Empty Vault',
        totalAccounts: 0,
        reusedIssues: [],
        reusedAccountsCount: 0,
        weakIssues: [],
        oldIssues: [],
        safeAccountsCount: 0,
        totalVulnerabilitiesCount: 0,
        auditMap: {},
      };
    }

    const now = Date.now();
    const passwordGroups = new Map<string, Credential[]>();

    // 1. Group passwords to identify reuse
    credentials.forEach((item) => {
      const pwd = item.password || '';
      if (pwd.trim().length > 0) {
        const group = passwordGroups.get(pwd) || [];
        group.push(item);
        passwordGroups.set(pwd, group);
      }
    });

    const reusedIssues: ReusedIssue[] = [];
    const reusedAccountIds = new Set<string>();

    passwordGroups.forEach((accounts, pwd) => {
      if (accounts.length > 1) {
        reusedIssues.push({
          password: pwd,
          accounts,
          count: accounts.length,
        });
        accounts.forEach((acc) => reusedAccountIds.add(acc.id));
      }
    });

    // 2. Scan weak & stagnant passwords and build individual account audits
    const weakIssues: WeakIssue[] = [];
    const oldIssues: OldIssue[] = [];
    const auditMap: Record<string, AccountSecurityAudit> = {};

    let safeAccountsCount = 0;

    credentials.forEach((item) => {
      const pwd = item.password || '';
      const strength = PasswordStrengthService.evaluate(pwd);
      const isReused = reusedAccountIds.has(item.id);
      const reusedGroup = passwordGroups.get(pwd);
      const reusedWithCount = (reusedGroup && reusedGroup.length > 1) ? reusedGroup.length : 0;

      // Weak if score is lower than strong (score < 3) or length < 12 characters or entropy < 65 bits
      const isWeak = strength.score < 3 || pwd.length < 12 || strength.entropyBits < 65;

      const reasons: string[] = [];
      if (pwd.length === 0) {
        reasons.push('Password is blank');
      } else {
        if (pwd.length < 12) reasons.push(`Length is only ${pwd.length} characters (12+ recommended)`);
        if (strength.entropyBits < 65) reasons.push(`Low entropy (${strength.entropyBits} bits)`);
        if (strength.suggestions && strength.suggestions.length > 0) {
          strength.suggestions.forEach((s) => {
            if (!reasons.includes(s)) reasons.push(s);
          });
        }
      }

      if (isWeak) {
        weakIssues.push({
          account: item,
          strengthResult: strength,
          reasons,
        });
      }

      // Check age: updatedAt or createdAt
      const dateStr = item.updatedAt || item.createdAt;
      let daysOld = 0;
      if (dateStr) {
        const parsedTime = new Date(dateStr).getTime();
        if (!isNaN(parsedTime)) {
          daysOld = Math.max(0, Math.floor((now - parsedTime) / (1000 * 60 * 60 * 24)));
        }
      }

      const isOld = daysOld >= VaultHealthService.STAGNANT_DAYS_THRESHOLD;
      if (isOld) {
        oldIssues.push({
          account: item,
          daysOld,
          lastUpdatedDate: dateStr,
        });
      }

      const issuesList: string[] = [];
      if (isReused) issuesList.push(`Reused across ${reusedWithCount} accounts`);
      if (isWeak) issuesList.push(reasons[0] || 'Weak password');
      if (isOld) issuesList.push(`Not updated in ${daysOld} days`);

      const isSafe = !isReused && !isWeak && !isOld;
      if (isSafe) {
        safeAccountsCount++;
      }

      auditMap[item.id] = {
        credentialId: item.id,
        isReused,
        isWeak,
        isOld,
        isSafe,
        reusedWithCount,
        strengthResult: strength,
        daysOld,
        issues: issuesList,
      };
    });

    // 3. Calculate Overall Health Score
    // Formula:
    // Base score = 100.
    // Each vulnerable account incurs penalties based on severity:
    // Reused password penalty: 45 pts weight per affected account ratio
    // Weak password penalty: 35 pts weight per affected account ratio
    // Old password penalty: 20 pts weight per affected account ratio
    const total = credentials.length;
    const reusedRatio = reusedAccountIds.size / total;
    const weakRatio = weakIssues.length / total;
    const oldRatio = oldIssues.length / total;

    const penalty = (reusedRatio * 45) + (weakRatio * 35) + (oldRatio * 20);
    const score = Math.max(0, Math.min(100, Math.round(100 - penalty)));

    let grade: HealthGrade = 'A+';
    let statusLabel = 'Vault Pristine';

    if (score >= 95) {
      grade = 'A+';
      statusLabel = 'Vault Pristine';
    } else if (score >= 85) {
      grade = 'A';
      statusLabel = 'Strong & Secure';
    } else if (score >= 70) {
      grade = 'B';
      statusLabel = 'Good Standing';
    } else if (score >= 50) {
      grade = 'C';
      statusLabel = 'Needs Attention';
    } else if (score >= 30) {
      grade = 'D';
      statusLabel = 'Vulnerable';
    } else {
      grade = 'F';
      statusLabel = 'Critical Risk';
    }

    const totalVulnerabilitiesCount = reusedAccountIds.size + weakIssues.length + oldIssues.length;

    return {
      score,
      grade,
      statusLabel,
      totalAccounts: total,
      reusedIssues,
      reusedAccountsCount: reusedAccountIds.size,
      weakIssues,
      oldIssues,
      safeAccountsCount,
      totalVulnerabilitiesCount,
      auditMap,
    };
  }
}
