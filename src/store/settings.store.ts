import { create } from 'zustand';
import { AppSettings, DEFAULT_SETTINGS, ThemeMode, AutoLockTimeout } from '@/models/settings.model';
import { DatabaseService } from '@/database/database.service';
import { BiometricsService } from '@/security/biometrics.service';
import { EncryptionService } from '@/security/encryption.service';

interface SettingsState {
  settings: AppSettings;
  isLoading: boolean;

  loadSettings: () => Promise<void>;
  updateTheme: (theme: ThemeMode) => Promise<void>;
  updateAutoLock: (timeout: AutoLockTimeout) => Promise<void>;
  toggleBiometrics: (enabled: boolean, sessionKey?: Uint8Array) => Promise<boolean>;
  updateClipboardTimeout: (seconds: number) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  isLoading: true,

  loadSettings: async () => {
    try {
      const db = await DatabaseService.getDatabase();
      const rows = await db.getAllAsync<{ key: string; value: string }>('SELECT key, value FROM app_settings');

      const loaded: AppSettings = { ...DEFAULT_SETTINGS };
      for (const row of rows) {
        if (row.key === 'theme') loaded.theme = row.value as ThemeMode;
        if (row.key === 'autoLockTimeout') loaded.autoLockTimeout = row.value as AutoLockTimeout;
        if (row.key === 'biometricEnabled') loaded.biometricEnabled = row.value === 'true';
        if (row.key === 'clipboardTimeoutSeconds') loaded.clipboardTimeoutSeconds = Number(row.value);
        if (row.key === 'hidePasswordRevealSeconds') loaded.hidePasswordRevealSeconds = Number(row.value);
      }

      set({ settings: loaded, isLoading: false });
    } catch (e) {
      set({ settings: DEFAULT_SETTINGS, isLoading: false });
    }
  },

  updateTheme: async (theme: ThemeMode) => {
    const db = await DatabaseService.getDatabase();
    await db.runAsync('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)', 'theme', theme);
    set((state) => ({ settings: { ...state.settings, theme } }));
  },

  updateAutoLock: async (autoLockTimeout: AutoLockTimeout) => {
    const db = await DatabaseService.getDatabase();
    await db.runAsync('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)', 'autoLockTimeout', autoLockTimeout);
    set((state) => ({ settings: { ...state.settings, autoLockTimeout } }));
  },

  toggleBiometrics: async (enabled: boolean, sessionKey?: Uint8Array) => {
    const db = await DatabaseService.getDatabase();
    if (enabled) {
      const isAuthed = await BiometricsService.authenticate('Enable Biometric Unlock');
      if (!isAuthed) return false;

      if (sessionKey) {
        const keyBase64 = EncryptionService.uint8ArrayToBase64(sessionKey);
        await BiometricsService.saveBiometricKey(keyBase64);
      }
    } else {
      await BiometricsService.clearBiometricKey();
    }

    await db.runAsync('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)', 'biometricEnabled', enabled ? 'true' : 'false');
    set((state) => ({ settings: { ...state.settings, biometricEnabled: enabled } }));
    return true;
  },

  updateClipboardTimeout: async (seconds: number) => {
    const db = await DatabaseService.getDatabase();
    await db.runAsync('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)', 'clipboardTimeoutSeconds', String(seconds));
    set((state) => ({ settings: { ...state.settings, clipboardTimeoutSeconds: seconds } }));
  },
}));
