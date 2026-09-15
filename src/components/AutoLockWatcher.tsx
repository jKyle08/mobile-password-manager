import React, { useEffect, useRef } from 'react';
import { AppState, AppStateStatus, View, TouchableWithoutFeedback } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { useVaultStore } from '@/store/vault.store';
import { useSettingsStore } from '@/store/settings.store';
import { AUTO_LOCK_MS_MAP } from '@/models/settings.model';

export const AutoLockWatcher: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const appState = useRef(AppState.currentState);
  const backgroundTimeRef = useRef<number | null>(null);

  const { isUnlocked, isInitialized, lockVault, recordActivity } = useAuthStore();
  const { clearVault } = useVaultStore();
  const { settings } = useSettingsStore();

  const handleLock = () => {
    if (isUnlocked) {
      lockVault();
      clearVault();
      router.replace('/unlock');
    }
  };

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/active/) &&
        nextAppState.match(/inactive|background/)
      ) {
        // App went to background
        backgroundTimeRef.current = Date.now();
      }

      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App came to foreground
        if (backgroundTimeRef.current && isUnlocked) {
          const elapsed = Date.now() - backgroundTimeRef.current;
          const timeoutMs = AUTO_LOCK_MS_MAP[settings.autoLockTimeout];

          if (timeoutMs >= 0 && elapsed >= timeoutMs) {
            handleLock();
          }
        }
        backgroundTimeRef.current = null;
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isUnlocked, settings.autoLockTimeout]);

  // Periodic interval check for inactivity even while app is on-screen
  useEffect(() => {
    if (!isUnlocked) return;

    const timeoutMs = AUTO_LOCK_MS_MAP[settings.autoLockTimeout];
    if (timeoutMs <= 0) return; // 'immediately' or 'never'

    const interval = setInterval(() => {
      const { lastActiveTimestamp } = useAuthStore.getState();
      const elapsed = Date.now() - lastActiveTimestamp;
      if (elapsed >= timeoutMs) {
        handleLock();
      }
    }, 15000); // Check every 15s

    return () => clearInterval(interval);
  }, [isUnlocked, settings.autoLockTimeout]);

  return (
    <TouchableWithoutFeedback onPress={() => recordActivity()}>
      <View style={{ flex: 1 }}>{children}</View>
    </TouchableWithoutFeedback>
  );
};
