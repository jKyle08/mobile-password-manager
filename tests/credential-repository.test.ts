import { CredentialRepository } from '../src/database/repositories/credential.repository';
import { DatabaseService } from '../src/database/database.service';
import { EncryptionService } from '../src/security/encryption.service';
import { MigrationService } from '../src/database/migrations';

describe('CredentialRepository (Encrypted Persistence)', () => {
  const masterPassword = 'MasterPasswordForTesting-2026!';
  const salt = EncryptionService.generateSalt();
  const sessionKey = EncryptionService.deriveKey(masterPassword, salt, 1000);

  beforeAll(async () => {
    DatabaseService.resetDatabaseInstance();
    await MigrationService.runMigrations();
  });

  it('creates and securely persists credentials in encrypted format', async () => {
    const rawSecret = 'BankSecretPassword#999!';
    const rawUsername = 'security_officer@vault.io';
    const rawNotes = 'Super sensitive recovery phrases';

    const created = await CredentialRepository.create(
      {
        title: 'Swiss Bank Account',
        username: rawUsername,
        password: rawSecret,
        website: 'https://swissbank.ch',
        notes: rawNotes,
        favorite: true,
      },
      sessionKey
    );

    expect(created.id).toBeDefined();
    expect(created.title).toBe('Swiss Bank Account');

    // Inspect RAW database record to verify plaintext secrets are NOT in SQLite
    const db = await DatabaseService.getDatabase();
    const rawRows = await db.getAllAsync<any>('SELECT * FROM credentials WHERE id = ?', created.id);
    expect(rawRows.length).toBe(1);

    const rawRow = rawRows[0];
    // Plaintext secrets MUST NOT appear in the raw SQLite row
    expect(rawRow.encrypted_payload).not.toContain(rawSecret);
    expect(rawRow.encrypted_payload).not.toContain(rawUsername);
    expect(rawRow.encrypted_payload).not.toContain(rawNotes);
    expect(rawRow.password).toBeUndefined(); // column does not exist

    // Fetch through repository and verify proper decryption
    const fetched = await CredentialRepository.getById(created.id, sessionKey);
    expect(fetched).not.toBeNull();
    expect(fetched!.password).toBe(rawSecret);
    expect(fetched!.username).toBe(rawUsername);
    expect(fetched!.notes).toBe(rawNotes);
  });

  it('updates a credential with re-encryption', async () => {
    const created = await CredentialRepository.create(
      {
        title: 'Email Account',
        username: 'user@mail.com',
        password: 'InitialPassword123!',
        favorite: false,
      },
      sessionKey
    );

    await CredentialRepository.update(
      created.id,
      {
        password: 'UpdatedNewPassword999!',
        notes: 'Updated note field',
      },
      sessionKey
    );

    const updated = await CredentialRepository.getById(created.id, sessionKey);
    expect(updated!.password).toBe('UpdatedNewPassword999!');
    expect(updated!.notes).toBe('Updated note field');
  });

  it('re-encrypts all credentials during master key rotation', async () => {
    const newMasterPassword = 'BrandNewMasterKey-2026!';
    const newSalt = EncryptionService.generateSalt();
    const newSessionKey = EncryptionService.deriveKey(newMasterPassword, newSalt, 1000);

    // Re-encrypt all items
    await CredentialRepository.reencryptAll(sessionKey, newSessionKey);

    // Fetching with OLD key should fail / return empty
    const itemsOldKey = await CredentialRepository.getAll(sessionKey);
    expect(itemsOldKey.length).toBe(0);

    // Fetching with NEW key should succeed
    const itemsNewKey = await CredentialRepository.getAll(newSessionKey);
    expect(itemsNewKey.length).toBeGreaterThan(0);
    expect(itemsNewKey.some((c) => c.title === 'Swiss Bank Account')).toBe(true);
  });
});
