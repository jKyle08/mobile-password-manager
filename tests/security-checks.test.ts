import { KeyManagerService } from '../src/security/key-manager.service';
import { VaultRepository } from '../src/database/repositories/vault.repository';
import { DatabaseService } from '../src/database/database.service';
import { MigrationService } from '../src/database/migrations';

describe('Security Checks & Master Key Management', () => {
  const masterPassword = 'MySuperSecretMasterPassword123!';

  beforeEach(async () => {
    DatabaseService.resetDatabaseInstance();
    await MigrationService.runMigrations();
  });

  it('initializes vault and verifies sentinel without storing master password in database', async () => {
    const key = await KeyManagerService.initializeVault(masterPassword);
    expect(key).toBeDefined();
    expect(key.length).toBe(32);

    const metadata = await VaultRepository.getMetadata();
    expect(metadata).not.toBeNull();
    expect(metadata!.salt).toBeDefined();
    expect(metadata!.sentinel).toBeDefined();

    // Plaintext master password MUST NOT be stored in metadata
    expect(metadata!.salt).not.toContain(masterPassword);
    expect(metadata!.sentinel).not.toContain(masterPassword);

    // Raw database verification
    const db = await DatabaseService.getDatabase();
    const rows = await db.getAllAsync<any>('SELECT * FROM vault_metadata');
    const rawString = JSON.stringify(rows);
    expect(rawString).not.toContain(masterPassword);
  });

  it('authenticates valid master password and unlocks derived key', async () => {
    await KeyManagerService.initializeVault(masterPassword);

    const unlockedKey = await KeyManagerService.unlockVault(masterPassword);
    expect(unlockedKey).toBeDefined();
    expect(unlockedKey.length).toBe(32);
  });

  it('rejects invalid master password with generic error message', async () => {
    await KeyManagerService.initializeVault(masterPassword);

    await expect(
      KeyManagerService.unlockVault('WrongPassword123!@#')
    ).rejects.toThrow('Unable to unlock your vault. Please check your master password.');
  });
});
