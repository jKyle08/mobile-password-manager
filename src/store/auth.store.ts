import { create } from 'zustand';
import { KeyManagerService } from '@/security/key-manager.service';
import { VaultRepository } from '@/database/repositories/vault.repository';
import { BiometricsService } from '@/security/biometrics.service';
import { EncryptionService } from '@/security/encryption.service';
import { MigrationService } from '@/database/migrations';

interface AuthState {
  isInitialized: boolean;
  isUnlocked: boolean;
  isLoading: boolean;
  sessionKey: Uint8Array | null;
  lastActiveTimestamp: number;
  biometricAvailable: boolean;

  // Actions
  checkVaultStatus: () => Promise<void>;
  initializeVault: (masterPassword: string) => Promise<void>;
  unlockWithPassword: (masterPassword: string) => Promise<void>;
  unlockWithBiometrics: () => Promise<void>;
  lockVault: () => void;
  changeMasterPassword: (newMasterPassword: string, biometricEnabled: boolean) => Promise<void>;
  recordActivity: () => void;
  resetVault: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isInitialized: false,
  isUnlocked: false,
  isLoading: true,
  sessionKey: null,
  lastActiveTimestamp: Date.now(),
  biometricAvailable: false,

  checkVaultStatus: async () => {
    try {
      set({ isLoading: true });
      await MigrationService.runMigrations();
      const initialized = await VaultRepository.isVaultInitialized();
      const bioStatus = await BiometricsService.checkBiometricAvailability();

      set({
        isInitialized: initialized,
        biometricAvailable: bioStatus.isAvailable,
        isLoading: false,
      });
    } catch (e) {
      set({ isInitialized: false, isLoading: false });
    }
  },

  initializeVault: async (masterPassword: string) => {
    set({ isLoading: true });
    try {
      const derivedKey = await KeyManagerService.initializeVault(masterPassword);
      set({
        isInitialized: true,
        isUnlocked: true,
        sessionKey: derivedKey,
        lastActiveTimestamp: Date.now(),
        isLoading: false,
      });
    } catch (e) {
      set({ isLoading: false });
      throw e;
    }
  },

  unlockWithPassword: async (masterPassword: string) => {
    set({ isLoading: true });
    try {
      const derivedKey = await KeyManagerService.unlockVault(masterPassword);
      set({
        isUnlocked: true,
        sessionKey: derivedKey,
        lastActiveTimestamp: Date.now(),
        isLoading: false,
      });
    } catch (e) {
      set({ isLoading: false });
      throw e;
    }
  },

  unlockWithBiometrics: async () => {
    set({ isLoading: true });
    try {
      const derivedKey = await KeyManagerService.unlockWithBiometrics();
      set({
        isUnlocked: true,
        sessionKey: derivedKey,
        lastActiveTimestamp: Date.now(),
        isLoading: false,
      });
    } catch (e) {
      set({ isLoading: false });
      throw e;
    }
  },

  lockVault: () => {
    // Zero-out sensitive derived key from memory
    const currentKey = get().sessionKey;
    if (currentKey) {
      currentKey.fill(0);
    }

    set({
      isUnlocked: false,
      sessionKey: null,
    });
  },

  changeMasterPassword: async (newMasterPassword: string, biometricEnabled: boolean) => {
    const { sessionKey } = get();
    if (!sessionKey) {
      throw new Error('Vault must be unlocked to change master password');
    }

    set({ isLoading: true });
    try {
      const newKey = await KeyManagerService.changeMasterPassword(
        sessionKey,
        newMasterPassword,
        biometricEnabled
      );

      set({
        sessionKey: newKey,
        lastActiveTimestamp: Date.now(),
        isLoading: false,
      });
    } catch (e) {
      set({ isLoading: false });
      throw e;
    }
  },

  recordActivity: () => {
    set({ lastActiveTimestamp: Date.now() });
  },

  resetVault: async () => {
    await VaultRepository.clearVaultDatabase();
    await BiometricsService.clearBiometricKey();
    set({
      isInitialized: false,
      isUnlocked: false,
      sessionKey: null,
    });
  },
}));
