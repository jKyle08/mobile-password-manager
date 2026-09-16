import { DatabaseService } from '../database.service';
import { Credential, EncryptedCredentialPayload, EncryptedCredentialRow } from '@/models/credential.model';
import { EncryptionService } from '@/security/encryption.service';

export class CredentialRepository {
  /**
   * Fetch and decrypt all credentials in the vault
   */
  public static async getAll(sessionKey: Uint8Array): Promise<Credential[]> {
    const db = await DatabaseService.getDatabase();
    const rows = await db.getAllAsync<EncryptedCredentialRow>(
      'SELECT id, title, category_id, favorite, encrypted_payload, created_at, updated_at FROM credentials ORDER BY favorite DESC, title ASC'
    );

    const results: Credential[] = [];
    for (const row of rows) {
      try {
        const decryptedJson = EncryptionService.decrypt(row.encrypted_payload, sessionKey);
        const payload: EncryptedCredentialPayload = JSON.parse(decryptedJson);
        const catIds = row.category_id
          ? row.category_id.split(',').map((s) => s.trim()).filter(Boolean)
          : [];

        results.push({
          id: row.id,
          title: row.title,
          username: payload.username,
          password: payload.password,
          website: payload.website,
          uris: payload.uris,
          notes: payload.notes,
          tags: payload.tags,
          customFields: payload.customFields,
          categoryId: catIds[0] || undefined,
          categoryIds: catIds,
          favorite: Boolean(row.favorite),
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        });
      } catch (err) {
        console.warn(`Failed to decrypt credential ${row.id}: corrupted or invalid key.`);
      }
    }

    return results;
  }

  /**
   * Fetch and decrypt a single credential by ID
   */
  public static async getById(id: string, sessionKey: Uint8Array): Promise<Credential | null> {
    const db = await DatabaseService.getDatabase();
    const row = await db.getFirstAsync<EncryptedCredentialRow>(
      'SELECT id, title, category_id, favorite, encrypted_payload, created_at, updated_at FROM credentials WHERE id = ?',
      id
    );

    if (!row) return null;

    const decryptedJson = EncryptionService.decrypt(row.encrypted_payload, sessionKey);
    const payload: EncryptedCredentialPayload = JSON.parse(decryptedJson);
    const catIds = row.category_id
      ? row.category_id.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    return {
      id: row.id,
      title: row.title,
      username: payload.username,
      password: payload.password,
      website: payload.website,
      uris: payload.uris,
      notes: payload.notes,
      tags: payload.tags,
      customFields: payload.customFields,
      categoryId: catIds[0] || undefined,
      categoryIds: catIds,
      favorite: Boolean(row.favorite),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Create and securely encrypt a new credential
   */
  public static async create(
    credential: Omit<Credential, 'id' | 'createdAt' | 'updatedAt'>,
    sessionKey: Uint8Array
  ): Promise<Credential> {
    const db = await DatabaseService.getDatabase();
    const id = 'cred_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
    const now = new Date().toISOString();

    const payload: EncryptedCredentialPayload = {
      username: credential.username,
      password: credential.password,
      website: credential.website,
      uris: credential.uris,
      notes: credential.notes,
      tags: credential.tags,
      customFields: credential.customFields,
    };

    const encryptedPayload = EncryptionService.encrypt(JSON.stringify(payload), sessionKey);
    const categoryIds = credential.categoryIds && credential.categoryIds.length > 0
      ? credential.categoryIds
      : (credential.categoryId ? [credential.categoryId] : []);
    const categoryDbValue = categoryIds.length > 0 ? categoryIds.join(',') : null;

    await db.runAsync(
      'INSERT INTO credentials (id, title, category_id, favorite, encrypted_payload, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      id,
      credential.title.trim(),
      categoryDbValue,
      credential.favorite ? 1 : 0,
      encryptedPayload,
      now,
      now
    );

    return {
      ...credential,
      id,
      categoryId: categoryIds[0] || undefined,
      categoryIds,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Update an existing credential with authenticated encryption
   */
  public static async update(
    id: string,
    updates: Partial<Omit<Credential, 'id' | 'createdAt' | 'updatedAt'>>,
    sessionKey: Uint8Array
  ): Promise<void> {
    const db = await DatabaseService.getDatabase();
    const existing = await this.getById(id, sessionKey);
    if (!existing) {
      throw new Error('Credential not found');
    }

    const merged = { ...existing, ...updates };
    const now = new Date().toISOString();

    const payload: EncryptedCredentialPayload = {
      username: merged.username,
      password: merged.password,
      website: merged.website,
      uris: merged.uris,
      notes: merged.notes,
      tags: merged.tags,
      customFields: merged.customFields,
    };

    const encryptedPayload = EncryptionService.encrypt(JSON.stringify(payload), sessionKey);
    const categoryIds = merged.categoryIds && merged.categoryIds.length > 0
      ? merged.categoryIds
      : (merged.categoryId ? [merged.categoryId] : []);
    const categoryDbValue = categoryIds.length > 0 ? categoryIds.join(',') : null;

    await db.runAsync(
      'UPDATE credentials SET title = ?, category_id = ?, favorite = ?, encrypted_payload = ?, updated_at = ? WHERE id = ?',
      merged.title.trim(),
      categoryDbValue,
      merged.favorite ? 1 : 0,
      encryptedPayload,
      now,
      id
    );
  }

  /**
   * Delete a credential by ID
   */
  public static async delete(id: string): Promise<void> {
    const db = await DatabaseService.getDatabase();
    await db.runAsync('DELETE FROM credentials WHERE id = ?', id);
  }

  /**
   * Toggle favorite status
   */
  public static async toggleFavorite(id: string, favorite: boolean): Promise<void> {
    const db = await DatabaseService.getDatabase();
    const now = new Date().toISOString();
    await db.runAsync('UPDATE credentials SET favorite = ?, updated_at = ? WHERE id = ?', favorite ? 1 : 0, now, id);
  }

  /**
   * Re-encrypts all credentials with a new master key during password change
   */
  public static async reencryptAll(oldKey: Uint8Array, newKey: Uint8Array): Promise<void> {
    const db = await DatabaseService.getDatabase();
    const rows = await db.getAllAsync<EncryptedCredentialRow>('SELECT * FROM credentials');

    await db.withTransactionAsync(async () => {
      for (const row of rows) {
        const decryptedJson = EncryptionService.decrypt(row.encrypted_payload, oldKey);
        const reencryptedPayload = EncryptionService.encrypt(decryptedJson, newKey);
        const now = new Date().toISOString();

        await db.runAsync(
          'UPDATE credentials SET encrypted_payload = ?, updated_at = ? WHERE id = ?',
          reencryptedPayload,
          now,
          row.id
        );
      }
    });
  }

  /**
   * Get total credential count without decrypting
   */
  public static async getCount(): Promise<number> {
    const db = await DatabaseService.getDatabase();
    const rows = await db.getAllAsync('SELECT id FROM credentials');
    return rows.length;
  }
}
