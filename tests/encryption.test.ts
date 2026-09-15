import { EncryptionService } from '../src/security/encryption.service';

describe('EncryptionService (AES-256-GCM & PBKDF2)', () => {
  const testPassword = 'Correct-Horse-Battery-Staple-2026!';
  const testPlaintext = 'SuperSecretCredentialPassword!123';

  it('generates cryptographically random 16-byte salts', () => {
    const salt1 = EncryptionService.generateSalt();
    const salt2 = EncryptionService.generateSalt();
    expect(salt1.length).toBe(16);
    expect(salt2.length).toBe(16);
    expect(salt1).not.toEqual(salt2);
  });

  it('derives a consistent 32-byte (256-bit) key from password + salt', () => {
    const salt = EncryptionService.generateSalt();
    const key1 = EncryptionService.deriveKey(testPassword, salt, 1000);
    const key2 = EncryptionService.deriveKey(testPassword, salt, 1000);

    expect(key1.length).toBe(32);
    expect(key1).toEqual(key2);

    const differentPasswordKey = EncryptionService.deriveKey('DifferentPassword123!', salt, 1000);
    expect(key1).not.toEqual(differentPasswordKey);
  });

  it('encrypts and decrypts plaintext correctly with AES-256-GCM', () => {
    const salt = EncryptionService.generateSalt();
    const key = EncryptionService.deriveKey(testPassword, salt, 1000);

    const encryptedPackage = EncryptionService.encrypt(testPlaintext, key);
    expect(encryptedPackage).toContain(':');

    const decrypted = EncryptionService.decrypt(encryptedPackage, key);
    expect(decrypted).toBe(testPlaintext);
  });

  it('produces unique ciphertexts for identical plaintexts (due to random IV/nonce)', () => {
    const salt = EncryptionService.generateSalt();
    const key = EncryptionService.deriveKey(testPassword, salt, 1000);

    const enc1 = EncryptionService.encrypt(testPlaintext, key);
    const enc2 = EncryptionService.encrypt(testPlaintext, key);

    expect(enc1).not.toEqual(enc2);
    expect(EncryptionService.decrypt(enc1, key)).toBe(testPlaintext);
    expect(EncryptionService.decrypt(enc2, key)).toBe(testPlaintext);
  });

  it('rejects decryption when given an incorrect key (Authentication Failure)', () => {
    const salt = EncryptionService.generateSalt();
    const correctKey = EncryptionService.deriveKey(testPassword, salt, 1000);
    const wrongKey = EncryptionService.deriveKey('WrongMasterPassword123!', salt, 1000);

    const encryptedPackage = EncryptionService.encrypt(testPlaintext, correctKey);

    expect(() => {
      EncryptionService.decrypt(encryptedPackage, wrongKey);
    }).toThrow('Decryption failed');
  });

  it('detects tampering and rejects tampered ciphertext or auth tag', () => {
    const salt = EncryptionService.generateSalt();
    const key = EncryptionService.deriveKey(testPassword, salt, 1000);

    const encryptedPackage = EncryptionService.encrypt(testPlaintext, key);
    const [iv, ciphertext] = encryptedPackage.split(':');

    // Tamper with the last character of the ciphertext base64
    const tamperedCiphertext = ciphertext.slice(0, -2) + 'AA';
    const tamperedPackage = `${iv}:${tamperedCiphertext}`;

    expect(() => {
      EncryptionService.decrypt(tamperedPackage, key);
    }).toThrow('Decryption failed');
  });
});
