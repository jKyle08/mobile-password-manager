import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme/ThemeContext';
import { typography } from '@/theme/typography';
import { PasswordField } from '@/components/PasswordField';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/auth.store';
import { useSettingsStore } from '@/store/settings.store';
import { useToast } from '@/components/ui/Toast';
import { Lock, Fingerprint } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function UnlockScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const { unlockWithPassword, unlockWithBiometrics, biometricAvailable } = useAuthStore();
  const { settings } = useSettingsStore();

  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Attempt automatic biometric prompt if enabled
  useEffect(() => {
    if (settings.biometricEnabled && biometricAvailable) {
      handleBiometricUnlock();
    }
  }, [settings.biometricEnabled, biometricAvailable]);

  const handlePasswordUnlock = async () => {
    if (!password) {
      setErrorMsg('Please enter your master password.');
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);
    try {
      await unlockWithPassword(password);
      setPassword('');
      router.replace('/(authenticated)/vault');
    } catch (e: any) {
      setErrorMsg(e.message || 'Unable to unlock your vault. Please check your master password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBiometricUnlock = async () => {
    setErrorMsg('');
    try {
      await unlockWithBiometrics();
      router.replace('/(authenticated)/vault');
    } catch (e: any) {
      // Don't show loud error if user simply cancelled biometric prompt
      if (!e.message?.includes('cancelled')) {
        setErrorMsg(e.message || 'Biometric authentication failed.');
      }
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Icon */}
          <View style={[styles.iconContainer, { backgroundColor: colors.surfaceSubtle }]}>
            <Lock size={48} color={colors.primary} />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>Welcome Back</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Enter your master password to decrypt your vault
          </Text>

          {/* Master Password Input */}
          <View style={styles.form}>
            <PasswordField
              label="Master Password"
              placeholder="Enter your master password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errorMsg) setErrorMsg('');
              }}
              error={errorMsg}
            />

            <Button
              title="Unlock Vault"
              size="lg"
              loading={isSubmitting}
              onPress={handlePasswordUnlock}
              style={styles.unlockBtn}
            />

            {settings.biometricEnabled && biometricAvailable && (
              <>
                <View style={styles.dividerRow}>
                  <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />
                  <Text style={[styles.dividerText, { color: colors.textMuted }]}>or</Text>
                  <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />
                </View>

                <Button
                  title="Unlock with Biometrics"
                  variant="secondary"
                  size="lg"
                  icon={<Fingerprint size={20} color={colors.primary} />}
                  onPress={handleBiometricUnlock}
                />
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 20,
  },
  iconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    marginBottom: 32,
    maxWidth: 280,
  },
  form: {
    width: '100%',
    maxWidth: 360,
  },
  unlockBtn: {
    marginTop: 8,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
});
