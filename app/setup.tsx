import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme/ThemeContext';
import { typography } from '@/theme/typography';
import { PasswordField } from '@/components/PasswordField';
import { StrengthMeter } from '@/components/StrengthMeter';
import { Button } from '@/components/ui/Button';
import { PasswordStrengthService } from '@/security/password-strength';
import { useAuthStore } from '@/store/auth.store';
import { useToast } from '@/components/ui/Toast';
import { ShieldAlert, CheckCircle2 } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SetupScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const { initializeVault } = useAuthStore();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const strength = useMemo(() => {
    return PasswordStrengthService.evaluate(password);
  }, [password]);

  const isValidLength = password.length >= 12;
  const isMatching = password.length > 0 && password === confirmPassword;

  const handleCreateVault = async () => {
    setErrorMsg('');
    if (!isValidLength) {
      setErrorMsg('Master password must be at least 12 characters long.');
      return;
    }
    if (!isMatching) {
      setErrorMsg('Passwords do not match. Please verify your confirmation.');
      return;
    }

    try {
      setIsSubmitting(true);
      await initializeVault(password);
      setIsSuccessModalVisible(true);
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to initialize vault. Please try again.');
      showToast('Vault initialization failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinishSetup = () => {
    router.replace('/(authenticated)/vault');
  };

  if (isSuccessModalVisible) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.successContent}>
          <View style={[styles.successIconContainer, { backgroundColor: colors.successSurface }]}>
            <CheckCircle2 size={64} color={colors.success} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Vault Created</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Your vault is encrypted with AES-256-GCM and stored securely on this device.
          </Text>
        </View>
        <View style={styles.footer}>
          <Button
            title="Continue to Vault"
            size="lg"
            onPress={handleFinishSetup}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.title, { color: colors.text }]}>
            Create Master Password
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            This master password will be used to derive your AES-256 encryption key.
          </Text>

          {/* Security Warning Box */}
          <View
            style={[
              styles.warningBox,
              {
                backgroundColor: colors.warningSurface,
                borderColor: colors.warning,
              },
            ]}
          >
            <ShieldAlert size={22} color={colors.warning} style={styles.warningIcon} />
            <Text style={[styles.warningText, { color: colors.text }]}>
              There is no password recovery. If you lose your master password, your encrypted data cannot be decrypted by anyone.
            </Text>
          </View>

          {/* Master Password Input */}
          <PasswordField
            label="Master Password"
            placeholder="Min 12 characters (e.g. passphrase)"
            value={password}
            onChangeText={setPassword}
          />

          {/* Strength Meter */}
          <StrengthMeter strength={strength} />

          {/* Confirm Password Input */}
          <PasswordField
            label="Confirm Password"
            placeholder="Re-enter your master password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            error={
              confirmPassword.length > 0 && !isMatching
                ? 'Passwords do not match'
                : undefined
            }
          />

          {errorMsg ? (
            <Text style={[styles.generalError, { color: colors.destructive }]}>
              {errorMsg}
            </Text>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title="Create Vault"
            size="lg"
            disabled={!isValidLength || !isMatching || isSubmitting}
            loading={isSubmitting}
            onPress={handleCreateVault}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  title: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    lineHeight: 20,
    marginBottom: 20,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  warningIcon: {
    marginRight: 10,
  },
  warningText: {
    flex: 1,
    fontSize: typography.sizes.xs,
    lineHeight: 18,
    fontWeight: typography.weights.medium,
  },
  generalError: {
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    marginTop: 10,
  },
  footer: {
    paddingTop: 12,
  },
  successContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  successIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
});
