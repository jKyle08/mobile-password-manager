export type PasswordStrengthLevel = 'very_weak' | 'weak' | 'fair' | 'strong' | 'very_strong';

export interface PasswordStrengthResult {
  score: number; // 0 to 4
  level: PasswordStrengthLevel;
  label: string;
  entropyBits: number;
  percentage: number; // 0 to 100
  suggestions: string[];
  color: string;
}

export class PasswordStrengthService {
  public static evaluate(password: string): PasswordStrengthResult {
    if (!password) {
      return {
        score: 0,
        level: 'very_weak',
        label: 'Empty',
        entropyBits: 0,
        percentage: 0,
        suggestions: ['Enter a master password'],
        color: '#94A3B8',
      };
    }

    let poolSize = 0;
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasDigits = /[0-9]/.test(password);
    const hasSymbols = /[^a-zA-Z0-9]/.test(password);

    if (hasLower) poolSize += 26;
    if (hasUpper) poolSize += 26;
    if (hasDigits) poolSize += 10;
    if (hasSymbols) poolSize += 33;

    // Calculate information entropy: H = L * log2(R)
    const entropyBits = poolSize > 0 ? Math.round(password.length * Math.log2(poolSize)) : 0;
    const suggestions: string[] = [];

    if (password.length < 12) {
      suggestions.push('Make it at least 12 characters');
    }
    if (!hasUpper) {
      suggestions.push('Add uppercase letters');
    }
    if (!hasLower) {
      suggestions.push('Add lowercase letters');
    }
    if (!hasDigits) {
      suggestions.push('Add numbers');
    }
    if (!hasSymbols) {
      suggestions.push('Add symbols (!@#$%...)');
    }

    let score = 0;
    let level: PasswordStrengthLevel = 'very_weak';
    let label = 'Very Weak';
    let color = '#EF4444'; // Red
    let percentage = 20;

    if (entropyBits < 36 || password.length < 8) {
      score = 0;
      level = 'very_weak';
      label = 'Very Weak';
      color = '#EF4444';
      percentage = 20;
    } else if (entropyBits < 55 || password.length < 10) {
      score = 1;
      level = 'weak';
      label = 'Weak';
      color = '#F97316'; // Orange
      percentage = 40;
    } else if (entropyBits < 75 || password.length < 12) {
      score = 2;
      level = 'fair';
      label = 'Fair';
      color = '#FBBF24'; // Yellow
      percentage = 60;
    } else if (entropyBits < 95 || password.length < 16) {
      score = 3;
      level = 'strong';
      label = 'Strong';
      color = '#10B981'; // Emerald
      percentage = 80;
    } else {
      score = 4;
      level = 'very_strong';
      label = 'Very Strong';
      color = '#06B6D4'; // Cyan
      percentage = 100;
    }

    return {
      score,
      level,
      label,
      entropyBits,
      percentage,
      suggestions,
      color,
    };
  }
}
