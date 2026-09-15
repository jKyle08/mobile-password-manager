import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme/ThemeContext';
import { typography } from '@/theme/typography';
import { useAuthStore } from '@/store/auth.store';
import { useVaultStore } from '@/store/vault.store';
import { useSettingsStore } from '@/store/settings.store';
import {
  Shield,
  Palette,
  HardDrive,
  Info,
  Lock,
  ChevronRight,
  Fingerprint,
  Timer,
  FileDown,
  FolderOpen,
} from 'lucide-react-native';

export default function SettingsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { lockVault } = useAuthStore();
  const { credentials } = useVaultStore();
  const { settings } = useSettingsStore();

  const handleLockNow = () => {
    lockVault();
    router.replace('/unlock');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Security Section */}
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
          SECURITY
        </Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <TouchableOpacity
            style={[styles.row, { borderBottomColor: colors.surfaceBorder }]}
            onPress={() => router.push('/(authenticated)/settings/security')}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: colors.surfaceSubtle }]}>
                <Shield size={18} color={colors.primary} />
              </View>
              <Text style={[styles.rowTitle, { color: colors.text }]}>
                Change Master Password
              </Text>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.row, { borderBottomColor: colors.surfaceBorder }]}
            onPress={() => router.push('/(authenticated)/settings/security')}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: colors.surfaceSubtle }]}>
                <Fingerprint size={18} color={colors.secondary} />
              </View>
              <View>
                <Text style={[styles.rowTitle, { color: colors.text }]}>
                  Biometric Unlock
                </Text>
                <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>
                  {settings.biometricEnabled ? 'Enabled' : 'Disabled'}
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.row, { borderBottomColor: colors.surfaceBorder }]}
            onPress={() => router.push('/(authenticated)/settings/security')}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: colors.surfaceSubtle }]}>
                <Timer size={18} color={colors.warning} />
              </View>
              <View>
                <Text style={[styles.rowTitle, { color: colors.text }]}>
                  Auto-Lock Timeout
                </Text>
                <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>
                  {settings.autoLockTimeout}
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.row}
            onPress={handleLockNow}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: colors.destructiveSurface }]}>
                <Lock size={18} color={colors.destructive} />
              </View>
              <Text style={[styles.rowTitle, { color: colors.destructive }]}>
                Lock Vault Now
              </Text>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Categories Section */}
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
          ORGANIZATION
        </Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => router.push('/(authenticated)/categories')}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: colors.surfaceSubtle }]}>
                <FolderOpen size={18} color={colors.primary} />
              </View>
              <Text style={[styles.rowTitle, { color: colors.text }]}>
                Manage Categories
              </Text>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Appearance Section */}
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
          APPEARANCE
        </Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => router.push('/(authenticated)/settings/appearance')}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: colors.surfaceSubtle }]}>
                <Palette size={18} color={colors.accent} />
              </View>
              <View>
                <Text style={[styles.rowTitle, { color: colors.text }]}>Theme</Text>
                <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>
                  {settings.theme.charAt(0).toUpperCase() + settings.theme.slice(1)}
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Vault & Backup Section */}
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
          VAULT & BACKUP
        </Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <TouchableOpacity
            style={[styles.row, { borderBottomColor: colors.surfaceBorder }]}
            onPress={() => router.push('/(authenticated)/settings/backup')}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: colors.surfaceSubtle }]}>
                <FileDown size={18} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.rowTitle, { color: colors.text }]}>
                  Encrypted Backup & Restore
                </Text>
                <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>
                  AES-256-GCM authenticated export
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: colors.surfaceSubtle }]}>
                <HardDrive size={18} color={colors.textSecondary} />
              </View>
              <Text style={[styles.rowTitle, { color: colors.text }]}>
                Total Credentials Stored
              </Text>
            </View>
            <Text style={[styles.badgeCount, { color: colors.primary }]}>
              {credentials.length}
            </Text>
          </View>
        </View>

        {/* About Section */}
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
          ABOUT & SECURITY
        </Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={[styles.row, { borderBottomColor: colors.surfaceBorder }]}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: colors.surfaceSubtle }]}>
                <Info size={18} color={colors.textSecondary} />
              </View>
              <Text style={[styles.rowTitle, { color: colors.text }]}>Version</Text>
            </View>
            <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>1.0.0 (Offline-First)</Text>
          </View>

          <View style={styles.aboutBox}>
            <Text style={[styles.aboutTitle, { color: colors.text }]}>
              Zero-Knowledge Guarantee
            </Text>
            <Text style={[styles.aboutDesc, { color: colors.textSecondary }]}>
              Passwords and notes are encrypted locally with AES-256-GCM. Your master password is never stored or transmitted.
            </Text>
          </View>
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
  rowSubtitle: {
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  badgeCount: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },
  aboutBox: {
    padding: 16,
  },
  aboutTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    marginBottom: 4,
  },
  aboutDesc: {
    fontSize: typography.sizes.xs,
    lineHeight: 18,
  },
});
