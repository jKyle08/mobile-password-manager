import { DatabaseService } from './database.service';
import { DEFAULT_CATEGORIES } from '@/models/category.model';

export class MigrationService {
  public static async runMigrations(): Promise<void> {
    const db = await DatabaseService.getDatabase();

    // 1. Vault Metadata Table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS vault_metadata (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        salt TEXT NOT NULL,
        sentinel TEXT NOT NULL,
        kdf_iterations INTEGER NOT NULL,
        version INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    // 2. Categories Table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        icon TEXT,
        is_default INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );
    `);

    // 3. Credentials Table (Strictly stores encrypted payloads for sensitive fields)
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS credentials (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        category_id TEXT,
        favorite INTEGER NOT NULL DEFAULT 0,
        encrypted_payload TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE SET NULL
      );
    `);

    // 4. App Settings Table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);

    // Seed default categories if they don't exist
    const existingCategories = await db.getAllAsync('SELECT id FROM categories LIMIT 1');
    if (existingCategories.length === 0) {
      const now = new Date().toISOString();
      for (const cat of DEFAULT_CATEGORIES) {
        await db.runAsync(
          'INSERT OR IGNORE INTO categories (id, name, icon, is_default, created_at) VALUES (?, ?, ?, ?, ?)',
          cat.id,
          cat.name,
          cat.icon || 'folder',
          1,
          now
        );
      }
    }
  }
}
