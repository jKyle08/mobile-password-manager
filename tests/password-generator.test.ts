import { PasswordGenerator } from '../src/features/generator/password-generator';
import { PasswordStrengthService } from '../src/security/password-strength';

describe('PasswordGenerator & PasswordStrengthService', () => {
  it('generates passwords with specified length', () => {
    const pwd1 = PasswordGenerator.generate({ length: 12 });
    expect(pwd1.length).toBe(12);

    const pwd2 = PasswordGenerator.generate({ length: 32 });
    expect(pwd2.length).toBe(32);

    const pwd3 = PasswordGenerator.generate({ length: 64 });
    expect(pwd3.length).toBe(64);
  });

  it('contains character classes according to options', () => {
    const pwd = PasswordGenerator.generate({
      length: 24,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: true,
    });

    expect(/[A-Z]/.test(pwd)).toBe(true);
    expect(/[a-z]/.test(pwd)).toBe(true);
    expect(/[0-9]/.test(pwd)).toBe(true);
    expect(/[^a-zA-Z0-9]/.test(pwd)).toBe(true);
  });

  it('correctly evaluates entropy and strength levels', () => {
    const weak = PasswordStrengthService.evaluate('abc');
    expect(weak.score).toBeLessThanOrEqual(1);
    expect(weak.level).toBe('very_weak');

    const strong = PasswordStrengthService.evaluate('K9#mQ2$vL8!zW4@xP1');
    expect(strong.score).toBeGreaterThanOrEqual(3);
    expect(strong.entropyBits).toBeGreaterThan(70);
  });
});
