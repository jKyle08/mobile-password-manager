import { DatabaseService } from '../database.service';
import { VaultMetadata } from '@/models/vault.model';

export class VaultRepository {
  public static async getMetadata(): Promise<VaultMetadata | null> {
    const db = await DatabaseService.getDatabase();
    const row = await db.getFirstAsync<any>(
      'SELECT id, salt, sentinel, kdf_iterations as kdfIterations, version, created_at as createdAt, updated_at as updatedAt FROM vault_metadata WHERE id = 1'
    );
    if (!row) return null;
    return {
      id: row.id,
      salt: row.salt,
      sentinel: row.sentinel,
      kdfIterations: Number(row.kdfIterations),
      version: Number(row.version),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  public static async isVaultInitialized(): Promise<boolean> {
    const meta = await this.getMetadata();
    return meta !== null;
  }

  public static async saveMetadata(
    salt: string,
    sentinel: string,
    kdfIterations: number,
    version = 1
  ): Promise<void> {
    const db = await DatabaseService.getDatabase();
    const now = new Date().toISOString();
    const existing = await this.getMetadata();

    if (existing) {
      await db.runAsync(
        'UPDATE vault_metadata SET salt = ?, sentinel = ?, kdf_iterations = ?, updated_at = ? WHERE id = 1',
        salt,
        sentinel,
        kdfIterations,
        now
      );
    } else {
      await db.runAsync(
        'INSERT INTO vault_metadata (id, salt, sentinel, kdf_iterations, version, created_at, updated_at) VALUES (1, ?, ?, ?, ?, ?, ?)',
        salt,
        sentinel,
        kdfIterations,
        version,
        now,
        now
      );
    }
  }

  public static async clearVaultDatabase(): Promise<void> {
    const db = await DatabaseService.getDatabase();
    await db.runAsync('DELETE FROM credentials');
    await db.runAsync('DELETE FROM vault_metadata');
  }
}
