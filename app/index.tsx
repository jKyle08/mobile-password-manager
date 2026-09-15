import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useRootNavigationState } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { useTheme } from '@/theme/ThemeContext';

export default function IndexScreen() {
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();
  const { colors } = useTheme();
  const { isInitialized, isUnlocked, isLoading, checkVaultStatus } = useAuthStore();

  useEffect(() => {
    checkVaultStatus();
  }, []);

  useEffect(() => {
    // Wait until root navigator is fully mounted
    if (!rootNavigationState?.key) return;
    if (isLoading) return;

    if (!isInitialized) {
      router.replace('/welcome');
    } else if (!isUnlocked) {
      router.replace('/unlock');
    } else {
      router.replace('/(authenticated)/vault');
    }
  }, [rootNavigationState?.key, isInitialized, isUnlocked, isLoading]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
