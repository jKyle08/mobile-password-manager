import { gcm } from '@noble/ciphers/aes';
import { pbkdf2 } from '@noble/hashes/pbkdf2';
import { sha256 } from '@noble/hashes/sha256';

export interface EncryptedDataPackage {
  iv: string; // Base64
  ciphertext: string; // Base64 (includes auth tag in noble-ciphers)
  tag?: string;
}

export class EncryptionService {
  private static readonly KEY_LENGTH_BYTES = 32; // 256 bits
  private static readonly NONCE_LENGTH_BYTES = 12; // 96 bits for GCM
  public static readonly DEFAULT_KDF_ITERATIONS = 100000;
  public static readonly SALT_LENGTH_BYTES = 16; // 128 bits

  /**
   * Cryptographically Secure Random Byte Generator
   */
  public static generateRandomBytes(length: number): Uint8Array {
    const bytes = new Uint8Array(length);
    if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.getRandomValues) {
      globalThis.crypto.getRandomValues(bytes);
    } else {
      try {
        const nodeCrypto = require('crypto');
        const buffer = nodeCrypto.randomBytes(length);
        bytes.set(buffer);
      } catch (e) {
        throw new Error('No cryptographically secure random number generator available.');
      }
    }
    return bytes;
  }

  /**
   * Generate a fresh random salt for key derivation
   */
  public static generateSalt(length = EncryptionService.SALT_LENGTH_BYTES): Uint8Array {
    return this.generateRandomBytes(length);
  }

  /**
   * Derive a 256-bit encryption key from a master password and salt using PBKDF2-HMAC-SHA256
   */
  public static deriveKey(
    password: string,
    salt: Uint8Array,
    iterations = EncryptionService.DEFAULT_KDF_ITERATIONS
  ): Uint8Array {
    if (!password || password.length === 0) {
      throw new Error('Master password cannot be empty for key derivation');
    }
    if (!salt || salt.length < 8) {
      throw new Error('Invalid salt length for key derivation');
    }

    const passwordBytes = new TextEncoder().encode(password);
    return pbkdf2(sha256, passwordBytes, salt, {
      c: iterations,
      dkLen: EncryptionService.KEY_LENGTH_BYTES,
    });
  }

  /**
   * Authenticated Encryption using AES-256-GCM
   * Returns a compact serialized string format: "iv:ciphertext_with_tag"
   */
  public static encrypt(plainText: string, key: Uint8Array): string {
    if (key.length !== EncryptionService.KEY_LENGTH_BYTES) {
      throw new Error('Invalid key length for AES-256 (must be 32 bytes)');
    }

    const nonce = this.generateRandomBytes(EncryptionService.NONCE_LENGTH_BYTES);
    const cipher = gcm(key, nonce);
    const plainBytes = new TextEncoder().encode(plainText);
    const encryptedBytes = cipher.encrypt(plainBytes); // Contains ciphertext + 16-byte auth tag

    const nonceBase64 = this.uint8ArrayToBase64(nonce);
    const ciphertextBase64 = this.uint8ArrayToBase64(encryptedBytes);

    return `${nonceBase64}:${ciphertextBase64}`;
  }

  /**
   * Authenticated Decryption using AES-256-GCM
   * Throws an error if the key is incorrect or if the ciphertext/tag was tampered with.
   */
  public static decrypt(encryptedPackage: string, key: Uint8Array): string {
    if (key.length !== EncryptionService.KEY_LENGTH_BYTES) {
      throw new Error('Invalid key length for AES-256 (must be 32 bytes)');
    }

    const parts = encryptedPackage.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted payload structure');
    }

    const [nonceBase64, ciphertextBase64] = parts;
    const nonce = this.base64ToUint8Array(nonceBase64);
    const encryptedBytes = this.base64ToUint8Array(ciphertextBase64);

    if (nonce.length !== EncryptionService.NONCE_LENGTH_BYTES) {
      throw new Error('Invalid nonce length');
    }

    try {
      const cipher = gcm(key, nonce);
      const decryptedBytes = cipher.decrypt(encryptedBytes);
      return new TextDecoder().decode(decryptedBytes);
    } catch (error) {
      // Intentionally do NOT leak crypto internals
      throw new Error('Decryption failed: Invalid key or corrupted/tampered data');
    }
  }

  /**
   * Helper: Convert Uint8Array to Base64
   */
  public static uint8ArrayToBase64(bytes: Uint8Array): string {
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(bytes).toString('base64');
    }
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Helper: Convert Base64 to Uint8Array
   */
  public static base64ToUint8Array(base64: string): Uint8Array {
    if (typeof Buffer !== 'undefined') {
      const buf = Buffer.from(base64, 'base64');
      return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
    }
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
}
