import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { useTheme } from '@/theme/ThemeContext';

export default function AuthenticatedLayout() {
  const router = useRouter();
  const { colors } = useTheme();
  const { isUnlocked, sessionKey } = useAuthStore();

  useEffect(() => {
    if (!isUnlocked || !sessionKey) {
      router.replace('/unlock');
    }
  }, [isUnlocked, sessionKey]);

  if (!isUnlocked || !sessionKey) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen name="vault" options={{ headerShown: false }} />
      <Stack.Screen name="credentials/add" options={{ title: 'Add Account', headerBackTitle: 'Vault' }} />
      <Stack.Screen name="credentials/[id]" options={{ title: 'Account Details', headerBackTitle: 'Vault' }} />
      <Stack.Screen name="credentials/edit" options={{ title: 'Edit Account', headerBackTitle: 'Details' }} />
      <Stack.Screen name="generator" options={{ title: 'Password Generator' }} />
      <Stack.Screen name="categories" options={{ title: 'Categories' }} />
      <Stack.Screen name="settings/index" options={{ title: 'Settings' }} />
      <Stack.Screen name="settings/security" options={{ title: 'Security' }} />
      <Stack.Screen name="settings/backup" options={{ title: 'Encrypted Backup' }} />
      <Stack.Screen name="settings/appearance" options={{ title: 'Appearance' }} />
    </Stack>
  );
}
