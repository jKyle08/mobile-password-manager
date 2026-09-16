import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme/ThemeContext';
import { typography } from '@/theme/typography';
import { useSettingsStore } from '@/store/settings.store';
import { useAuthStore } from '@/store/auth.store';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { AutofillService, AutofillStatus } from '@/services/autofill/autofill.service';
import { UriMatchType } from '@/models/credential.model';
import {
  ShieldCheck,
  Sparkles,
  Smartphone,
  Globe,
  Lock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Fingerprint,
} from 'lucide-react-native';

const MATCH_TYPE_OPTIONS: { label: string; desc: string; value: UriMatchType }[] = [
  {
    label: 'Base Domain (Recommended)',
    desc: 'Matches any subdomain of the site (e.g., login.github.com matches github.com)',
    value: 'domain',
  },
  {
    label: 'Exact Hostname',
    desc: 'Matches the exact subdomain & host (e.g., login.github.com only)',
    value: 'host',
  },
  {
    label: 'Exact Full URL',
    desc: 'Matches the entire scheme, host, and path prefix',
    value: 'exact',
  },
];

export default function AutofillSettingsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const { settings, updateAutofillSetting } = useSettingsStore();
  const { biometricAvailable } = useAuthStore();

  const [status, setStatus] = useState<AutofillStatus | null>(null);

  useEffect(() => {
    AutofillService.getStatus(settings).then(setStatus);
  }, [settings]);

  const handleToggle = async (key: any, val: boolean) => {
    await updateAutofillSetting(key, val);
    showToast('Autofill settings updated', 'info');
  };

  const handleSelectMatchType = async (matchType: UriMatchType) => {
    await updateAutofillSetting('defaultUriMatchType', matchType);
    showToast(`Default matching strategy set to ${matchType}`, 'info');
  };

  const handleOpenSystemSettings = async () => {
    await AutofillService.openSystemAutofillSettings();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Status Header Card */}
        <View style={[styles.statusCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.statusHeaderRow}>
            <View style={[styles.iconBox, { backgroundColor: `${colors.primary}20` }]}>
              <Sparkles size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.statusCardTitle, { color: colors.text }]}>
                AutoFill & Quick Login Status
              </Text>
              <Text style={[styles.statusCardSubtitle, { color: colors.textMuted }]}>
                Fill credentials seamlessly across browsers and apps
              </Text>
            </View>
          </View>

          <View style={[styles.statusItemsList, { borderTopColor: colors.surfaceBorder }]}>
            {/* Vault Status */}
            <View style={styles.statusRow}>
              <View style={styles.statusRowLeft}>
                <CheckCircle2 size={16} color={colors.success} />
                <Text style={[styles.statusRowLabel, { color: colors.text }]}>
                  Vault Security
                </Text>
              </View>
              <Text style={[styles.statusBadgeText, { color: colors.success }]}>
                AES-256-GCM Protected
              </Text>
            </View>

            {/* In-App AutoFill & Open */}
            <View style={styles.statusRow}>
              <View style={styles.statusRowLeft}>
                <CheckCircle2 size={16} color={colors.success} />
                <Text style={[styles.statusRowLabel, { color: colors.text }]}>
                  In-App Open & Fill
                </Text>
              </View>
              <Text style={[styles.statusBadgeText, { color: colors.success }]}>
                {settings.openAndFillEnabled ? 'Active' : 'Disabled'}
              </Text>
            </View>

            {/* Biometric Guard */}
            <View style={styles.statusRow}>
              <View style={styles.statusRowLeft}>
                <Fingerprint size={16} color={settings.biometricEnabled ? colors.success : colors.warning} />
                <Text style={[styles.statusRowLabel, { color: colors.text }]}>
                  Biometric Guard
                </Text>
              </View>
              <Text
                style={[
                  styles.statusBadgeText,
                  { color: settings.biometricEnabled ? colors.success : colors.warning },
                ]}
              >
                {settings.biometricEnabled ? 'Enabled' : 'Master Password Only'}
              </Text>
            </View>

            {/* Android / iOS System Service */}
            <View style={styles.statusRow}>
              <View style={styles.statusRowLeft}>
                <Smartphone size={16} color={colors.primary} />
                <Text style={[styles.statusRowLabel, { color: colors.text }]}>
                  {Platform.OS === 'ios' ? 'iOS Password AutoFill' : 'Android Autofill'}
                </Text>
              </View>
              <Text style={[styles.statusBadgeText, { color: colors.primary }]}>
                {settings.autofillEnabled ? 'Enabled' : 'Disabled'}
              </Text>
            </View>
          </View>

          {/* Open System Settings Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleOpenSystemSettings}
            style={[styles.systemSettingsBtn, { backgroundColor: colors.surfaceSubtle }]}
          >
            <Text style={[styles.systemSettingsBtnText, { color: colors.primary }]}>
              Open Device Autofill Settings
            </Text>
            <ExternalLink size={14} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Core Autofill Toggles */}
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
          AUTOFILL BEHAVIOR
        </Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          {/* Main Enable Autofill Toggle */}
          <View style={[styles.toggleRow, { borderBottomColor: colors.surfaceBorder }]}>
            <View style={styles.toggleTextContainer}>
              <Text style={[styles.rowTitle, { color: colors.text }]}>
                Enable AutoFill
              </Text>
              <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>
                Allow SecureVault to offer stored credentials
              </Text>
            </View>
            <Switch
              value={settings.autofillEnabled}
              onValueChange={(val) => handleToggle('autofillEnabled', val)}
              trackColor={{ false: colors.surfaceSubtle, true: colors.primary }}
            />
          </View>

          {/* Require Authentication Toggle */}
          <View style={[styles.toggleRow, { borderBottomColor: colors.surfaceBorder }]}>
            <View style={styles.toggleTextContainer}>
              <Text style={[styles.rowTitle, { color: colors.text }]}>
                Require Authentication
              </Text>
              <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>
                Require Face ID / Fingerprint before releasing passwords
              </Text>
            </View>
            <Switch
              value={settings.autofillRequireAuth}
              onValueChange={(val) => handleToggle('autofillRequireAuth', val)}
              trackColor={{ false: colors.surfaceSubtle, true: colors.primary }}
            />
          </View>

          {/* AutoFill Username */}
          <View style={[styles.toggleRow, { borderBottomColor: colors.surfaceBorder }]}>
            <View style={styles.toggleTextContainer}>
              <Text style={[styles.rowTitle, { color: colors.text }]}>
                AutoFill Username / Email
              </Text>
              <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>
                Automatically fill username when logging in
              </Text>
            </View>
            <Switch
              value={settings.autofillUsername}
              onValueChange={(val) => handleToggle('autofillUsername', val)}
              trackColor={{ false: colors.surfaceSubtle, true: colors.primary }}
            />
          </View>

          {/* AutoFill Password */}
          <View style={[styles.toggleRow, { borderBottomColor: colors.surfaceBorder }]}>
            <View style={styles.toggleTextContainer}>
              <Text style={[styles.rowTitle, { color: colors.text }]}>
                AutoFill Password
              </Text>
              <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>
                Automatically fill password on login forms
              </Text>
            </View>
            <Switch
              value={settings.autofillPassword}
              onValueChange={(val) => handleToggle('autofillPassword', val)}
              trackColor={{ false: colors.surfaceSubtle, true: colors.primary }}
            />
          </View>

          {/* Open & Fill Action */}
          <View style={styles.toggleRow}>
            <View style={styles.toggleTextContainer}>
              <Text style={[styles.rowTitle, { color: colors.text }]}>
                Open & Fill
              </Text>
              <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>
                Launch browser and prepare credentials with 1 tap
              </Text>
            </View>
            <Switch
              value={settings.openAndFillEnabled}
              onValueChange={(val) => handleToggle('openAndFillEnabled', val)}
              trackColor={{ false: colors.surfaceSubtle, true: colors.primary }}
            />
          </View>
        </View>

        {/* Default URI Matching Strategy */}
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
          DEFAULT URI MATCHING STRATEGY
        </Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          {MATCH_TYPE_OPTIONS.map((opt, idx) => {
            const isSelected = settings.defaultUriMatchType === opt.value;
            const isLast = idx === MATCH_TYPE_OPTIONS.length - 1;
            return (
              <TouchableOpacity
                key={opt.value}
                onPress={() => handleSelectMatchType(opt.value)}
                style={[
                  styles.optionRow,
                  { borderBottomColor: colors.surfaceBorder, borderBottomWidth: isLast ? 0 : 1 },
                ]}
              >
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text
                    style={[
                      styles.optionTitle,
                      { color: isSelected ? colors.primary : colors.text },
                    ]}
                  >
                    {opt.label}
                  </Text>
                  <Text style={[styles.optionDesc, { color: colors.textMuted }]}>
                    {opt.desc}
                  </Text>
                </View>
                {isSelected && <CheckCircle2 size={18} color={colors.primary} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* How It Works Guide Card */}
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
          HOW IT WORKS
        </Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder, padding: 16 }]}>
          <Text style={[styles.guideBullet, { color: colors.textSecondary }]}>
            • <Text style={{ fontWeight: typography.weights.bold, color: colors.text }}>Phishing Prevention:</Text> SecureVault cryptographically matches domains. If you land on a phishing clone (e.g. evil-paypal.com), credentials will never be exposed.
          </Text>
          <Text style={[styles.guideBullet, { color: colors.textSecondary }]}>
            • <Text style={{ fontWeight: typography.weights.bold, color: colors.text }}>Multiple Accounts:</Text> If you have multiple logins for the same site, the AutoFill assistant prompts you to choose the exact account.
          </Text>
          <Text style={[styles.guideBullet, { color: colors.textSecondary }]}>
            • <Text style={{ fontWeight: typography.weights.bold, color: colors.text }}>Auto-Purge Clipboard:</Text> Any copied credentials automatically erase after {settings.clipboardTimeoutSeconds}s.
          </Text>
        </View>
      </ScrollView>
    </View>
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
  statusCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginBottom: 20,
  },
  statusHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusCardTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  statusCardSubtitle: {
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  statusItemsList: {
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 10,
    marginBottom: 14,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusRowLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  statusBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  systemSettingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 10,
  },
  systemSettingsBtnText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  sectionHeader: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    letterSpacing: 1,
    marginTop: 10,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  toggleTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  rowTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
  rowSubtitle: {
    fontSize: typography.sizes.xs,
    marginTop: 2,
    lineHeight: 16,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  optionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    marginBottom: 2,
  },
  optionDesc: {
    fontSize: typography.sizes.xs,
    lineHeight: 16,
  },
  guideBullet: {
    fontSize: typography.sizes.xs,
    lineHeight: 18,
    marginBottom: 8,
  },
});
