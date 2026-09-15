export type ThemeMode = 'system' | 'light' | 'dark';

export type AutoLockTimeout = 'immediately' | '1min' | '5min' | '15min' | '30min' | 'never';

export interface AppSettings {
  theme: ThemeMode;
  autoLockTimeout: AutoLockTimeout;
  biometricEnabled: boolean;
  clipboardTimeoutSeconds: number; // e.g. 30 seconds
  hidePasswordRevealSeconds: number; // e.g. 10 seconds
}

export const AUTO_LOCK_MS_MAP: Record<AutoLockTimeout, number> = {
  immediately: 0,
  '1min': 60 * 1000,
  '5min': 5 * 60 * 1000,
  '15min': 15 * 60 * 1000,
  '30min': 30 * 60 * 1000,
  never: -1,
};

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  autoLockTimeout: '5min',
  biometricEnabled: false,
  clipboardTimeoutSeconds: 30,
  hidePasswordRevealSeconds: 10,
};
