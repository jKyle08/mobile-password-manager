import { create } from 'zustand';
import { Credential } from '@/models/credential.model';
import { CredentialRepository } from '@/database/repositories/credential.repository';

interface VaultState {
  credentials: Credential[];
  searchQuery: string;
  selectedCategoryId: string | null; // null = 'all'
  isLoading: boolean;

  // Actions
  loadCredentials: (sessionKey: Uint8Array) => Promise<void>;
  addCredential: (
    data: Omit<Credential, 'id' | 'createdAt' | 'updatedAt'>,
    sessionKey: Uint8Array
  ) => Promise<Credential>;
  updateCredential: (
    id: string,
    data: Partial<Omit<Credential, 'id' | 'createdAt' | 'updatedAt'>>,
    sessionKey: Uint8Array
  ) => Promise<void>;
  deleteCredential: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setSelectedCategoryId: (categoryId: string | null) => void;
  clearVault: () => void;
}

export const useVaultStore = create<VaultState>((set, get) => ({
  credentials: [],
  searchQuery: '',
  selectedCategoryId: null,
  isLoading: false,

  loadCredentials: async (sessionKey: Uint8Array) => {
    set({ isLoading: true });
    try {
      const items = await CredentialRepository.getAll(sessionKey);
      set({ credentials: items, isLoading: false });
    } catch (e) {
      set({ credentials: [], isLoading: false });
    }
  },

  addCredential: async (data, sessionKey) => {
    const created = await CredentialRepository.create(data, sessionKey);
    set((state) => ({
      credentials: [created, ...state.credentials],
    }));
    return created;
  },

  updateCredential: async (id, data, sessionKey) => {
    await CredentialRepository.update(id, data, sessionKey);
    set((state) => ({
      credentials: state.credentials.map((c) =>
        c.id === id ? { ...c, ...data, updatedAt: new Date().toISOString() } : c
      ),
    }));
  },

  deleteCredential: async (id: string) => {
    await CredentialRepository.delete(id);
    set((state) => ({
      credentials: state.credentials.filter((c) => c.id !== id),
    }));
  },

  toggleFavorite: async (id: string) => {
    const item = get().credentials.find((c) => c.id === id);
    if (!item) return;

    const newFav = !item.favorite;
    await CredentialRepository.toggleFavorite(id, newFav);
    set((state) => ({
      credentials: state.credentials.map((c) =>
        c.id === id ? { ...c, favorite: newFav } : c
      ),
    }));
  },

  setSearchQuery: (searchQuery: string) => {
    set({ searchQuery });
  },

  setSelectedCategoryId: (selectedCategoryId: string | null) => {
    set({ selectedCategoryId });
  },

  clearVault: () => {
    // Purge decrypted items from in-memory state on vault lock
    set({
      credentials: [],
      searchQuery: '',
      selectedCategoryId: null,
    });
  },
}));
