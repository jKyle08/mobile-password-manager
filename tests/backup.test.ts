import { BackupService } from '../src/features/backup/backup.service';
import { CredentialRepository } from '../src/database/repositories/credential.repository';
import { DatabaseService } from '../src/database/database.service';
import { EncryptionService } from '../src/security/encryption.service';
import { MigrationService } from '../src/database/migrations';

describe('BackupService (Encrypted Export & Import)', () => {
  const masterPassword = 'MyVaultPassword-2026!';
  const salt = EncryptionService.generateSalt();
  const sessionKey = EncryptionService.deriveKey(masterPassword, salt, 1000);
  const backupPassword = 'StrongBackupSecret#2026!';

  beforeAll(async () => {
    DatabaseService.resetDatabaseInstance();
    await MigrationService.runMigrations();

    await CredentialRepository.create(
      {
        title: 'ExportTestAccount',
        username: 'backup_user@domain.com',
        password: 'BackupSecretPassword123!',
        website: 'https://backup-test.com',
        favorite: true,
      },
      sessionKey
    );
  });

  it('exports encrypted backup JSON without plaintext leak', async () => {
    const backupJson = await BackupService.exportEncryptedBackup(backupPassword, sessionKey);
    expect(backupJson).toBeDefined();

    // Verify format and metadata
    const parsed = JSON.parse(backupJson);
    expect(parsed.format).toBe('securevault_backup');
    expect(parsed.version).toBe(1);
    expect(parsed.encryption).toBe('AES-256-GCM');
    expect(parsed.salt).toBeDefined();
    expect(parsed.ciphertext).toBeDefined();

    // Critical security check: Plaintext password MUST NOT appear in the export JSON string
    expect(backupJson).not.toContain('BackupSecretPassword123!');
    expect(backupJson).not.toContain('backup_user@domain.com');
  });

  it('imports valid encrypted backup successfully', async () => {
    const backupJson = await BackupService.exportEncryptedBackup(backupPassword, sessionKey);

    // Reset database to simulate restoring on another device
    DatabaseService.resetDatabaseInstance();
    await MigrationService.runMigrations();

    const result = await BackupService.importEncryptedBackup(
      backupJson,
      backupPassword,
      sessionKey
    );

    expect(result.importedCredentials).toBeGreaterThanOrEqual(1);

    const credentials = await CredentialRepository.getAll(sessionKey);
    const found = credentials.find((c) => c.title === 'ExportTestAccount');
    expect(found).toBeDefined();
    expect(found!.password).toBe('BackupSecretPassword123!');
  });

  it('rejects import when given an incorrect backup password', async () => {
    const backupJson = await BackupService.exportEncryptedBackup(backupPassword, sessionKey);

    await expect(
      BackupService.importEncryptedBackup(backupJson, 'WrongBackupPassword!', sessionKey)
    ).rejects.toThrow('Unable to import backup');
  });
});
