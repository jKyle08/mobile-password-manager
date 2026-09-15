import { Platform } from 'react-native';

export interface IDatabase {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, ...params: any[]): Promise<{ lastInsertRowId: number; changes: number }>;
  getAllAsync<T = any>(sql: string, ...params: any[]): Promise<T[]>;
  getFirstAsync<T = any>(sql: string, ...params: any[]): Promise<T | null>;
  withTransactionAsync<T>(task: () => Promise<T>): Promise<T>;
}

/**
 * Web/Test in-memory fallback adapter for cross-platform SQLite compatibility
 */
class InMemoryDatabaseAdapter implements IDatabase {
  private tables: Record<string, any[]> = {
    vault_metadata: [],
    credentials: [],
    categories: [],
    app_settings: [],
  };

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem('__securevault_db__');
        if (saved) {
          this.tables = JSON.parse(saved);
        }
      } catch (e) {
        // Ignore
      }
    }
  }

  private saveToStorage() {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('__securevault_db__', JSON.stringify(this.tables));
      } catch (e) {
        // Ignore
      }
    }
  }

  async execAsync(sql: string): Promise<void> {
    this.saveToStorage();
  }

  async runAsync(sql: string, ...params: any[]): Promise<{ lastInsertRowId: number; changes: number }> {
    const trimmed = sql.trim();
    if (trimmed.startsWith('INSERT INTO vault_metadata')) {
      this.tables.vault_metadata = [{
        id: 1,
        salt: params[0],
        sentinel: params[1],
        kdf_iterations: params[2],
        version: params[3],
        created_at: params[4] || new Date().toISOString(),
        updated_at: params[5] || new Date().toISOString(),
      }];
      this.saveToStorage();
      return { lastInsertRowId: 1, changes: 1 };
    }

    if (trimmed.startsWith('UPDATE vault_metadata')) {
      if (this.tables.vault_metadata.length > 0) {
        this.tables.vault_metadata[0].salt = params[0];
        this.tables.vault_metadata[0].sentinel = params[1];
        this.tables.vault_metadata[0].kdf_iterations = params[2];
        this.tables.vault_metadata[0].updated_at = params[3] || new Date().toISOString();
      }
      this.saveToStorage();
      return { lastInsertRowId: 1, changes: 1 };
    }

    if (trimmed.startsWith('INSERT INTO credentials')) {
      const row = {
        id: params[0],
        title: params[1],
        category_id: params[2],
        favorite: params[3],
        encrypted_payload: params[4],
        created_at: params[5],
        updated_at: params[6],
      };
      const idx = this.tables.credentials.findIndex(c => c.id === row.id);
      if (idx >= 0) {
        this.tables.credentials[idx] = row;
      } else {
        this.tables.credentials.push(row);
      }
      this.saveToStorage();
      return { lastInsertRowId: this.tables.credentials.length, changes: 1 };
    }

    if (trimmed.startsWith('UPDATE credentials')) {
      if (params.length === 6) {
        const [title, catId, fav, payload, updatedAt, id] = params;
        const item = this.tables.credentials.find(c => c.id === id);
        if (item) {
          item.title = title;
          item.category_id = catId;
          item.favorite = fav;
          item.encrypted_payload = payload;
          item.updated_at = updatedAt;
        }
        this.saveToStorage();
        return { lastInsertRowId: 0, changes: item ? 1 : 0 };
      } else if (params.length === 3) {
        // Re-encryption: SET encrypted_payload = ?, updated_at = ? WHERE id = ?
        const [payload, updatedAt, id] = params;
        const item = this.tables.credentials.find(c => c.id === id);
        if (item) {
          item.encrypted_payload = payload;
          item.updated_at = updatedAt;
        }
        this.saveToStorage();
        return { lastInsertRowId: 0, changes: item ? 1 : 0 };
      } else if (params.length === 2 && trimmed.includes('favorite = ?')) {
        // Toggle favorite: SET favorite = ?, updated_at = ? WHERE id = ?
        const [fav, now, id] = params;
        const item = this.tables.credentials.find(c => c.id === id);
        if (item) {
          item.favorite = fav;
          item.updated_at = now;
        }
        this.saveToStorage();
        return { lastInsertRowId: 0, changes: item ? 1 : 0 };
      }
    }

    if (trimmed.startsWith('DELETE FROM credentials WHERE id =')) {
      const id = params[0];
      const prevLen = this.tables.credentials.length;
      this.tables.credentials = this.tables.credentials.filter(c => c.id !== id);
      this.saveToStorage();
      return { lastInsertRowId: 0, changes: prevLen - this.tables.credentials.length };
    }

    if (trimmed.startsWith('DELETE FROM credentials')) {
      this.tables.credentials = [];
      this.saveToStorage();
      return { lastInsertRowId: 0, changes: 1 };
    }

    if (trimmed.startsWith('DELETE FROM vault_metadata')) {
      this.tables.vault_metadata = [];
      this.saveToStorage();
      return { lastInsertRowId: 0, changes: 1 };
    }

    if (trimmed.startsWith('INSERT INTO categories') || trimmed.startsWith('INSERT OR IGNORE INTO categories')) {
      const row = {
        id: params[0],
        name: params[1],
        icon: params[2],
        is_default: params[3],
        created_at: params[4],
      };
      if (!this.tables.categories.some(c => c.id === row.id)) {
        this.tables.categories.push(row);
      }
      this.saveToStorage();
      return { lastInsertRowId: this.tables.categories.length, changes: 1 };
    }

    if (trimmed.startsWith('DELETE FROM categories WHERE id =')) {
      const id = params[0];
      this.tables.categories = this.tables.categories.filter(c => c.id !== id);
      this.saveToStorage();
      return { lastInsertRowId: 0, changes: 1 };
    }

    if (trimmed.startsWith('INSERT OR REPLACE INTO app_settings')) {
      const key = params[0];
      const val = params[1];
      const existing = this.tables.app_settings.find(s => s.key === key);
      if (existing) {
        existing.value = val;
      } else {
        this.tables.app_settings.push({ key, value: val });
      }
      this.saveToStorage();
      return { lastInsertRowId: 0, changes: 1 };
    }

    return { lastInsertRowId: 0, changes: 0 };
  }

  async getAllAsync<T = any>(sql: string, ...params: any[]): Promise<T[]> {
    const trimmed = sql.trim();
    if (trimmed.includes('FROM credentials')) {
      let results = [...this.tables.credentials];
      if (trimmed.includes('WHERE id = ?')) {
        results = results.filter(c => c.id === params[0]);
      } else if (trimmed.includes('WHERE category_id =')) {
        results = results.filter(c => c.category_id === params[0]);
      } else if (trimmed.includes('WHERE favorite = 1')) {
        results = results.filter(c => c.favorite === 1);
      }
      return results as unknown as T[];
    }

    if (trimmed.includes('FROM categories')) {
      return [...this.tables.categories] as unknown as T[];
    }

    if (trimmed.includes('FROM vault_metadata')) {
      return [...this.tables.vault_metadata] as unknown as T[];
    }

    if (trimmed.includes('FROM app_settings')) {
      return [...this.tables.app_settings] as unknown as T[];
    }

    return [];
  }

  async getFirstAsync<T = any>(sql: string, ...params: any[]): Promise<T | null> {
    const list = await this.getAllAsync<T>(sql, ...params);
    return list.length > 0 ? list[0] : null;
  }

  async withTransactionAsync<T>(task: () => Promise<T>): Promise<T> {
    return await task();
  }
}

let dbInstance: IDatabase | null = null;

export class DatabaseService {
  private static readonly DB_NAME = 'securevault.db';

  public static async getDatabase(): Promise<IDatabase> {
    if (dbInstance) {
      return dbInstance;
    }

    if (Platform.OS === 'web' || typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
      dbInstance = new InMemoryDatabaseAdapter();
      return dbInstance;
    }

    try {
      const SQLite = require('expo-sqlite');
      if (SQLite.openDatabaseAsync) {
        const sqliteDb = await SQLite.openDatabaseAsync(DatabaseService.DB_NAME);
        dbInstance = sqliteDb;
      } else {
        dbInstance = new InMemoryDatabaseAdapter();
      }
    } catch (e) {
      console.warn('Falling back to SQLite in-memory adapter:', e);
      dbInstance = new InMemoryDatabaseAdapter();
    }

    return dbInstance!;
  }

  public static setCustomDatabase(customDb: IDatabase) {
    dbInstance = customDb;
  }

  public static resetDatabaseInstance() {
    dbInstance = null;
  }
}
