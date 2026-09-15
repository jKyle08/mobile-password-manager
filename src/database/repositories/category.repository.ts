import { DatabaseService } from '../database.service';
import { Category } from '@/models/category.model';

export class CategoryRepository {
  public static async getAll(): Promise<Category[]> {
    const db = await DatabaseService.getDatabase();
    const rows = await db.getAllAsync<any>(
      'SELECT id, name, icon, is_default, created_at FROM categories ORDER BY is_default DESC, name ASC'
    );
    return rows.map(r => ({
      id: r.id,
      name: r.name,
      icon: r.icon,
      isDefault: Boolean(r.is_default),
      createdAt: r.created_at,
    }));
  }

  public static async create(name: string, icon = 'folder'): Promise<Category> {
    const db = await DatabaseService.getDatabase();
    const id = 'cat-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const now = new Date().toISOString();

    await db.runAsync(
      'INSERT INTO categories (id, name, icon, is_default, created_at) VALUES (?, ?, ?, ?, ?)',
      id,
      name.trim(),
      icon,
      0,
      now
    );

    return {
      id,
      name: name.trim(),
      icon,
      isDefault: false,
      createdAt: now,
    };
  }

  public static async delete(id: string): Promise<void> {
    const db = await DatabaseService.getDatabase();
    await db.runAsync('DELETE FROM categories WHERE id = ? AND is_default = 0', id);
  }
}
