import { EncryptionService } from './encryption.service';
import { VaultRepository } from '@/database/repositories/vault.repository';
import { CredentialRepository } from '@/database/repositories/credential.repository';
import { BiometricsService } from './biometrics.service';

const VAULT_SENTINEL_MAGIC = 'SECURE_VAULT_V1_VERIFIED';

export class KeyManagerService {
  /**
   * Initialize a brand new vault with master password
   */
  public static async initializeVault(masterPassword: string): Promise<Uint8Array> {
    if (!masterPassword || masterPassword.length < 12) {
      throw new Error('Master password must be at least 12 characters long.');
    }

    const salt = EncryptionService.generateSalt();
    const derivedKey = EncryptionService.deriveKey(
      masterPassword,
      salt,
      EncryptionService.DEFAULT_KDF_ITERATIONS
    );

    const sentinelPayload = JSON.stringify({
      magic: VAULT_SENTINEL_MAGIC,
      created: Date.now(),
    });

    const encryptedSentinel = EncryptionService.encrypt(sentinelPayload, derivedKey);
    const saltBase64 = EncryptionService.uint8ArrayToBase64(salt);

    await VaultRepository.saveMetadata(
      saltBase64,
      encryptedSentinel,
      EncryptionService.DEFAULT_KDF_ITERATIONS,
      1
    );

    return derivedKey;
  }

  /**
   * Attempt to unlock vault using master password
   */
  public static async unlockVault(masterPassword: string): Promise<Uint8Array> {
    const metadata = await VaultRepository.getMetadata();
    if (!metadata) {
      throw new Error('Vault is not initialized.');
    }

    const salt = EncryptionService.base64ToUint8Array(metadata.salt);
    const derivedKey = EncryptionService.deriveKey(
      masterPassword,
      salt,
      metadata.kdfIterations || EncryptionService.DEFAULT_KDF_ITERATIONS
    );

    try {
      const decryptedSentinelJson = EncryptionService.decrypt(metadata.sentinel, derivedKey);
      const parsed = JSON.parse(decryptedSentinelJson);

      if (parsed.magic !== VAULT_SENTINEL_MAGIC) {
        throw new Error('Invalid master password');
      }

      return derivedKey;
    } catch (e) {
      // Intentionally uniform error message to avoid timing / info leaks
      throw new Error('Unable to unlock your vault. Please check your master password.');
    }
  }

  /**
   * Unlock vault using hardware-protected biometric key
   */
  public static async unlockWithBiometrics(): Promise<Uint8Array> {
    const isSuccess = await BiometricsService.authenticate('Unlock your SecureVault');
    if (!isSuccess) {
      throw new Error('Biometric authentication cancelled or failed.');
    }

    const keyBase64 = await BiometricsService.getBiometricKey();
    if (!keyBase64) {
      throw new Error('Biometric unlock is not configured. Please use your master password.');
    }

    const derivedKey = EncryptionService.base64ToUint8Array(keyBase64);
    const metadata = await VaultRepository.getMetadata();
    if (!metadata) {
      throw new Error('Vault is not initialized.');
    }

    try {
      const decryptedSentinelJson = EncryptionService.decrypt(metadata.sentinel, derivedKey);
      const parsed = JSON.parse(decryptedSentinelJson);

      if (parsed.magic !== VAULT_SENTINEL_MAGIC) {
        throw new Error('Biometric key is out of sync. Please unlock with master password.');
      }

      return derivedKey;
    } catch (e) {
      throw new Error('Unable to unlock with biometrics. Please use your master password.');
    }
  }

  /**
   * Change Master Password:
   * Re-encrypts all credentials and updates metadata with a fresh salt and new sentinel.
   */
  public static async changeMasterPassword(
    currentKey: Uint8Array,
    newMasterPassword: string,
    biometricEnabled: boolean
  ): Promise<Uint8Array> {
    if (!newMasterPassword || newMasterPassword.length < 12) {
      throw new Error('New master password must be at least 12 characters long.');
    }

    // 1. Generate new random salt and derive new key
    const newSalt = EncryptionService.generateSalt();
    const newKey = EncryptionService.deriveKey(
      newMasterPassword,
      newSalt,
      EncryptionService.DEFAULT_KDF_ITERATIONS
    );

    // 2. Re-encrypt all credentials in the database
    await CredentialRepository.reencryptAll(currentKey, newKey);

    // 3. Encrypt new sentinel
    const sentinelPayload = JSON.stringify({
      magic: VAULT_SENTINEL_MAGIC,
      created: Date.now(),
    });
    const encryptedSentinel = EncryptionService.encrypt(sentinelPayload, newKey);
    const saltBase64 = EncryptionService.uint8ArrayToBase64(newSalt);

    // 4. Update vault metadata
    await VaultRepository.saveMetadata(
      saltBase64,
      encryptedSentinel,
      EncryptionService.DEFAULT_KDF_ITERATIONS,
      1
    );

    // 5. Update biometric key if enabled
    if (biometricEnabled) {
      const newKeyBase64 = EncryptionService.uint8ArrayToBase64(newKey);
      await BiometricsService.saveBiometricKey(newKeyBase64);
    } else {
      await BiometricsService.clearBiometricKey();
    }

    return newKey;
  }
}
