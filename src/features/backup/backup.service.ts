import { EncryptionService } from '@/security/encryption.service';
import { CredentialRepository } from '@/database/repositories/credential.repository';
import { CategoryRepository } from '@/database/repositories/category.repository';
import { EncryptedBackupPayload, VaultExportData } from '@/models/vault.model';

export class BackupService {
  /**
   * Generates an encrypted backup file string
   */
  public static async exportEncryptedBackup(
    backupPassword: string,
    sessionKey: Uint8Array
  ): Promise<string> {
    if (!backupPassword || backupPassword.length < 8) {
      throw new Error('Backup password must be at least 8 characters long.');
    }

    const credentials = await CredentialRepository.getAll(sessionKey);
    const categories = await CategoryRepository.getAll();

    const exportData: VaultExportData = {
      exportedAt: new Date().toISOString(),
      version: 1,
      categories,
      credentials,
    };

    const plaintext = JSON.stringify(exportData);
    const backupSalt = EncryptionService.generateSalt();
    const backupKey = EncryptionService.deriveKey(
      backupPassword,
      backupSalt,
      EncryptionService.DEFAULT_KDF_ITERATIONS
    );

    const encryptedPackage = EncryptionService.encrypt(plaintext, backupKey);
    const [nonceBase64, ciphertextBase64] = encryptedPackage.split(':');

    const backupPayload: EncryptedBackupPayload = {
      format: 'securevault_backup',
      version: 1,
      kdf: 'PBKDF2-SHA256',
      iterations: EncryptionService.DEFAULT_KDF_ITERATIONS,
      encryption: 'AES-256-GCM',
      salt: EncryptionService.uint8ArrayToBase64(backupSalt),
      nonce: nonceBase64,
      tag: '', // Tag is embedded in ciphertext in noble-ciphers
      ciphertext: ciphertextBase64,
      exportedAt: new Date().toISOString(),
    };

    return JSON.stringify(backupPayload, null, 2);
  }

  /**
   * Imports an encrypted backup into the current vault
   */
  public static async importEncryptedBackup(
    backupJsonString: string,
    backupPassword: string,
    sessionKey: Uint8Array
  ): Promise<{ importedCredentials: number; importedCategories: number }> {
    let payload: EncryptedBackupPayload;
    try {
      payload = JSON.parse(backupJsonString);
    } catch (e) {
      throw new Error('Unable to import backup. The backup file format is invalid.');
    }

    if (payload.format !== 'securevault_backup' || !payload.salt || !payload.ciphertext || !payload.nonce) {
      throw new Error('Unable to import backup. The file may be corrupted or not a valid SecureVault backup.');
    }

    const salt = EncryptionService.base64ToUint8Array(payload.salt);
    const backupKey = EncryptionService.deriveKey(
      backupPassword,
      salt,
      payload.iterations || EncryptionService.DEFAULT_KDF_ITERATIONS
    );

    let decryptedJson: string;
    try {
      const encryptedPackage = `${payload.nonce}:${payload.ciphertext}`;
      decryptedJson = EncryptionService.decrypt(encryptedPackage, backupKey);
    } catch (e) {
      throw new Error('Unable to import backup. The file may be corrupted, invalid, or protected by a different password.');
    }

    let exportData: VaultExportData;
    try {
      exportData = JSON.parse(decryptedJson);
    } catch (e) {
      throw new Error('Corrupted vault backup data payload.');
    }

    // Merge categories
    let importedCategories = 0;
    if (exportData.categories && Array.isArray(exportData.categories)) {
      const currentCategories = await CategoryRepository.getAll();
      const currentNames = new Set(currentCategories.map(c => c.name.toLowerCase()));

      for (const cat of exportData.categories) {
        if (!currentNames.has(cat.name.toLowerCase())) {
          await CategoryRepository.create(cat.name, cat.icon || 'folder');
          importedCategories++;
        }
      }
    }

    // Merge credentials
    let importedCredentials = 0;
    if (exportData.credentials && Array.isArray(exportData.credentials)) {
      for (const cred of exportData.credentials) {
        await CredentialRepository.create(
          {
            title: cred.title,
            username: cred.username,
            password: cred.password,
            website: cred.website,
            notes: cred.notes,
            categoryId: cred.categoryId,
            categoryIds: cred.categoryIds,
            favorite: cred.favorite || false,
            tags: cred.tags,
          },
          sessionKey
        );
        importedCredentials++;
      }
    }

    return { importedCredentials, importedCategories };
  }
}
