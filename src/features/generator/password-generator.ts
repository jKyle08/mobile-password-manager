import { EncryptionService } from '@/security/encryption.service';

export interface PasswordGeneratorOptions {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
}

export const DEFAULT_GENERATOR_OPTIONS: PasswordGeneratorOptions = {
  length: 20,
  includeUppercase: true,
  includeLowercase: true,
  includeNumbers: true,
  includeSymbols: true,
};

const UPPERCASE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE_CHARS = 'abcdefghijklmnopqrstuvwxyz';
const NUMBER_CHARS = '0123456789';
const SYMBOL_CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

export class PasswordGenerator {
  /**
   * Generates a cryptographically secure random password based on the provided options.
   * Utilizes CSPRNG random bytes with rejection sampling to eliminate bias.
   */
  public static generate(options: Partial<PasswordGeneratorOptions> = {}): string {
    const config: PasswordGeneratorOptions = {
      ...DEFAULT_GENERATOR_OPTIONS,
      ...options,
    };

    const targetLength = Math.max(8, Math.min(64, config.length));
    const charSets: string[] = [];

    if (config.includeUppercase) charSets.push(UPPERCASE_CHARS);
    if (config.includeLowercase) charSets.push(LOWERCASE_CHARS);
    if (config.includeNumbers) charSets.push(NUMBER_CHARS);
    if (config.includeSymbols) charSets.push(SYMBOL_CHARS);

    if (charSets.length === 0) {
      // Default to lowercase and numbers if everything is disabled
      charSets.push(LOWERCASE_CHARS);
      charSets.push(NUMBER_CHARS);
    }

    const fullCharPool = charSets.join('');
    const poolLength = fullCharPool.length;

    // Ensure at least one character from each active character set
    const resultChars: string[] = [];
    for (const set of charSets) {
      resultChars.push(this.getRandomCharFromSet(set));
    }

    // Fill the remaining length with random characters from the combined pool
    while (resultChars.length < targetLength) {
      resultChars.push(this.getRandomCharFromSet(fullCharPool));
    }

    // Cryptographically secure Fisher-Yates shuffle of resultChars
    this.shuffleArray(resultChars);

    return resultChars.join('');
  }

  /**
   * Unbiased random character selector from a given character string using CSPRNG
   */
  private static getRandomCharFromSet(charSet: string): string {
    const setLen = charSet.length;
    // To eliminate modulo bias, calculate largest multiple of setLen <= 256
    const limit = 256 - (256 % setLen);

    while (true) {
      const randomByte = EncryptionService.generateRandomBytes(1)[0];
      if (randomByte < limit) {
        return charSet[randomByte % setLen];
      }
    }
  }

  /**
   * Cryptographically secure array shuffle
   */
  private static shuffleArray(array: string[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const range = i + 1;
      const limit = 256 - (256 % range);
      let j = 0;
      while (true) {
        const randomByte = EncryptionService.generateRandomBytes(1)[0];
        if (randomByte < limit) {
          j = randomByte % range;
          break;
        }
      }
      const temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
  }
}
