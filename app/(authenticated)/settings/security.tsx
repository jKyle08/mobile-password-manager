import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme/ThemeContext';
import { typography } from '@/theme/typography';
import { useAuthStore } from '@/store/auth.store';
import { useSettingsStore } from '@/store/settings.store';
import { useToast } from '@/components/ui/Toast';
import { PasswordField } from '@/components/PasswordField';
import { StrengthMeter } from '@/components/StrengthMeter';
import { Button } from '@/components/ui/Button';
import { PasswordStrengthService } from '@/security/password-strength';
import { AutoLockTimeout } from '@/models/settings.model';
import { ShieldAlert, Fingerprint, Lock, Check } from 'lucide-react-native';

const AUTO_LOCK_OPTIONS: { label: string; value: AutoLockTimeout }[] = [
  { label: 'Immediately', value: 'immediately' },
  { label: '1 minute', value: '1min' },
  { label: '5 minutes (Default)', value: '5min' },
  { label: '15 minutes', value: '15min' },
  { label: '30 minutes', value: '30min' },
  { label: 'Never', value: 'never' },
];

export default function SecuritySettingsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const { sessionKey, changeMasterPassword, biometricAvailable, lockVault } = useAuthStore();
  const { settings, updateAutoLock, toggleBiometrics } = useSettingsStore();

  // Change Password state
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [changeError, setChangeError] = useState('');

  const strength = useMemo(() => {
    return PasswordStrengthService.evaluate(newPassword);
  }, [newPassword]);

  const isValidLength = newPassword.length >= 12;
  const isMatching = newPassword.length > 0 && newPassword === confirmNewPassword;

  const handleChangeMasterPassword = async () => {
    setChangeError('');
    if (!isValidLength) {
      setChangeError('New master password must be at least 12 characters.');
      return;
    }
    if (!isMatching) {
      setChangeError('New passwords do not match.');
      return;
    }

    try {
      setIsChangingPassword(true);
      await changeMasterPassword(newPassword, settings.biometricEnabled);
      showToast('Master password changed and vault re-encrypted!', 'success');
      setShowPasswordChange(false);
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (e: any) {
      setChangeError(e.message || 'Failed to change master password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleToggleBiometrics = async (val: boolean) => {
    if (!sessionKey) return;
    const ok = await toggleBiometrics(val, sessionKey);
    if (ok) {
      showToast(val ? 'Biometric unlock enabled' : 'Biometric unlock disabled', 'info');
    } else {
      showToast('Biometric authentication cancelled or not available', 'warning');
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Biometrics Section */}
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
          BIOMETRIC AUTHENTICATION
        </Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleLeft}>
              <View style={[styles.iconBox, { backgroundColor: colors.surfaceSubtle }]}>
                <Fingerprint size={20} color={colors.primary} />
              </View>
              <View style={styles.toggleText}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>
                  Biometric Unlock
                </Text>
                <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>
                  {biometricAvailable
                    ? 'Use Face ID or Fingerprint to unlock'
                    : 'Not available or not enrolled on this device'}
                </Text>
              </View>
            </View>
            <Switch
              value={settings.biometricEnabled}
              onValueChange={handleToggleBiometrics}
              disabled={!biometricAvailable}
              trackColor={{ false: colors.surfaceBorder, true: colors.primary }}
            />
          </View>
        </View>

        {/* Auto Lock Section */}
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
          AUTO-LOCK TIMEOUT
        </Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          {AUTO_LOCK_OPTIONS.map((opt, index) => {
            const isSelected = settings.autoLockTimeout === opt.value;
            const isLast = index === AUTO_LOCK_OPTIONS.length - 1;
            return (
              <TouchableOpacity
                key={opt.value}
                onPress={() => updateAutoLock(opt.value)}
                style={[
                  styles.optionRow,
                  !isLast && { borderBottomWidth: 1, borderBottomColor: colors.surfaceBorder },
                ]}
              >
                <Text
                  style={[
                    styles.optionText,
                    {
                      color: isSelected ? colors.primary : colors.text,
                      fontWeight: isSelected ? typography.weights.bold : typography.weights.regular,
                    },
                  ]}
                >
                  {opt.label}
                </Text>
                {isSelected && <Check size={18} color={colors.primary} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Change Master Password Section */}
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
          MASTER PASSWORD
        </Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          {!showPasswordChange ? (
            <TouchableOpacity
              onPress={() => setShowPasswordChange(true)}
              style={styles.changePasswordTrigger}
            >
              <Text style={[styles.rowTitle, { color: colors.primary }]}>
                Change Master Password
              </Text>
              <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>
                Re-encrypts all credentials under a fresh derived key
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.changePasswordForm}>
              <View
                style={[
                  styles.warningBanner,
                  { backgroundColor: colors.warningSurface, borderColor: colors.warning },
                ]}
              >
                <ShieldAlert size={18} color={colors.warning} style={{ marginRight: 8 }} />
                <Text style={[styles.warningBannerText, { color: colors.text }]}>
                  This will re-encrypt your entire vault with the new master password.
                </Text>
              </View>

              <PasswordField
                label="New Master Password *"
                placeholder="Min 12 characters"
                value={newPassword}
                onChangeText={setNewPassword}
              />

              <StrengthMeter strength={strength} />

              <PasswordField
                label="Confirm New Password *"
                placeholder="Confirm new master password"
                value={confirmNewPassword}
                onChangeText={setConfirmNewPassword}
                error={
                  confirmNewPassword.length > 0 && !isMatching
                    ? 'Passwords do not match'
                    : undefined
                }
              />

              {changeError ? (
                <Text style={[styles.errorText, { color: colors.destructive }]}>
                  {changeError}
                </Text>
              ) : null}

              <View style={styles.formButtonRow}>
                <Button
                  title="Cancel"
                  variant="secondary"
                  onPress={() => {
                    setShowPasswordChange(false);
                    setNewPassword('');
                    setConfirmNewPassword('');
                    setChangeError('');
                  }}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Update & Re-encrypt"
                  loading={isChangingPassword}
                  disabled={!isValidLength || !isMatching || isChangingPassword}
                  onPress={handleChangeMasterPassword}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          )}
        </View>

        {/* Lock Vault Now */}
        <View style={{ marginTop: 24 }}>
          <Button
            title="Lock Vault Now"
            variant="destructive"
            icon={<Lock size={18} color="#FFFFFF" />}
            onPress={() => {
              lockVault();
              router.replace('/unlock');
            }}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionHeader: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    letterSpacing: 1,
    marginTop: 18,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 10,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleText: {
    flex: 1,
  },
  rowTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
  rowSubtitle: {
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  optionText: {
    fontSize: typography.sizes.sm,
  },
  changePasswordTrigger: {
    padding: 16,
  },
  changePasswordForm: {
    padding: 16,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  warningBannerText: {
    flex: 1,
    fontSize: typography.sizes.xs,
    lineHeight: 16,
  },
  errorText: {
    fontSize: typography.sizes.xs,
    textAlign: 'center',
    marginVertical: 8,
  },
  formButtonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
});
