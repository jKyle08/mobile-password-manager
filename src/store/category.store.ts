import { create } from 'zustand';
import { Category } from '@/models/category.model';
import { CategoryRepository } from '@/database/repositories/category.repository';

interface CategoryState {
  categories: Category[];
  isLoading: boolean;

  loadCategories: () => Promise<void>;
  addCategory: (name: string, icon?: string) => Promise<Category>;
  deleteCategory: (id: string) => Promise<void>;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  isLoading: false,

  loadCategories: async () => {
    set({ isLoading: true });
    try {
      const list = await CategoryRepository.getAll();
      set({ categories: list, isLoading: false });
    } catch (e) {
      set({ categories: [], isLoading: false });
    }
  },

  addCategory: async (name: string, icon = 'folder') => {
    const created = await CategoryRepository.create(name, icon);
    set((state) => ({
      categories: [...state.categories, created],
    }));
    return created;
  },

  deleteCategory: async (id: string) => {
    await CategoryRepository.delete(id);
    set((state) => ({
      categories: state.categories.filter((c) => c.id !== id),
    }));
  },
}));
