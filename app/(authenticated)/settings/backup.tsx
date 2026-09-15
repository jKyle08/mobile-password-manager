import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme/ThemeContext';
import { typography } from '@/theme/typography';
import { useAuthStore } from '@/store/auth.store';
import { useVaultStore } from '@/store/vault.store';
import { useCategoryStore } from '@/store/category.store';
import { useToast } from '@/components/ui/Toast';
import { PasswordField } from '@/components/PasswordField';
import { Button } from '@/components/ui/Button';
import { BackupService } from '@/features/backup/backup.service';
import { ClipboardService } from '@/security/clipboard.service';
import { ShieldCheck, Download, Upload, Copy, Check, ShieldAlert } from 'lucide-react-native';

export default function BackupSettingsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const { sessionKey } = useAuthStore();
  const { loadCredentials } = useVaultStore();
  const { loadCategories } = useCategoryStore();

  // Export State
  const [exportPassword, setExportPassword] = useState('');
  const [exportedJson, setExportedJson] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [copiedExport, setCopiedExport] = useState(false);

  // Import State
  const [importJson, setImportJson] = useState('');
  const [importPassword, setImportPassword] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState('');

  const handleExport = async () => {
    if (!exportPassword || exportPassword.length < 8) {
      showToast('Backup password must be at least 8 characters', 'error');
      return;
    }
    if (!sessionKey) {
      showToast('Session expired. Please unlock vault.', 'error');
      return;
    }

    try {
      setIsExporting(true);
      const json = await BackupService.exportEncryptedBackup(exportPassword, sessionKey);
      setExportedJson(json);
      showToast('Encrypted backup generated successfully', 'success');
    } catch (e: any) {
      showToast(e.message || 'Failed to generate backup', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyExport = async () => {
    if (!exportedJson) return;
    const ok = await ClipboardService.copyWithAutoClear(exportedJson, 60);
    if (ok) {
      setCopiedExport(true);
      showToast('Encrypted backup copied to clipboard', 'success');
      setTimeout(() => setCopiedExport(false), 2000);
    }
  };

  const handleImport = async () => {
    setImportError('');
    if (!importJson.trim()) {
      setImportError('Please paste your encrypted backup JSON payload.');
      return;
    }
    if (!importPassword) {
      setImportError('Please enter the password used to encrypt this backup.');
      return;
    }
    if (!sessionKey) {
      showToast('Session expired. Please unlock vault.', 'error');
      return;
    }

    try {
      setIsImporting(true);
      const res = await BackupService.importEncryptedBackup(
        importJson.trim(),
        importPassword,
        sessionKey
      );

      // Refresh stores
      await loadCredentials(sessionKey);
      await loadCategories();

      showToast(
        `Imported ${res.importedCredentials} accounts & ${res.importedCategories} categories!`,
        'success'
      );
      setImportJson('');
      setImportPassword('');
      router.back();
    } catch (e: any) {
      setImportError(e.message || 'Unable to import backup. Please check your file and password.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Security Notice */}
        <View
          style={[
            styles.noticeBox,
            { backgroundColor: colors.surfaceSubtle, borderColor: colors.surfaceBorder },
          ]}
        >
          <ShieldCheck size={20} color={colors.primary} style={{ marginRight: 10 }} />
          <Text style={[styles.noticeText, { color: colors.textSecondary }]}>
            Backups are protected with AES-256-GCM. Plaintext passwords are never exported.
          </Text>
        </View>

        {/* Section 1: Export Backup */}
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
          EXPORT ENCRYPTED BACKUP
        </Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
            Create an encrypted snapshot of your entire vault. Choose a strong password to protect this backup.
          </Text>

          <PasswordField
            label="Backup Protection Password *"
            placeholder="Min 8 characters"
            value={exportPassword}
            onChangeText={setExportPassword}
          />

          <Button
            title="Generate Encrypted Backup"
            icon={<Download size={18} color="#FFFFFF" />}
            loading={isExporting}
            disabled={!exportPassword || exportPassword.length < 8 || isExporting}
            onPress={handleExport}
            style={{ marginTop: 6 }}
          />

          {exportedJson ? (
            <View style={styles.exportResult}>
              <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>
                Encrypted Backup Payload:
              </Text>
              <TextInput
                value={exportedJson}
                editable={false}
                multiline
                numberOfLines={4}
                style={[
                  styles.jsonBox,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                    color: colors.textSecondary,
                  },
                ]}
              />
              <Button
                title={copiedExport ? 'Copied' : 'Copy Backup to Clipboard'}
                variant="secondary"
                icon={copiedExport ? <Check size={16} color={colors.success} /> : <Copy size={16} color={colors.text} />}
                onPress={handleCopyExport}
                style={{ marginTop: 8 }}
              />
            </View>
          ) : null}
        </View>

        {/* Section 2: Import Backup */}
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
          IMPORT ENCRYPTED BACKUP
        </Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
            Paste your encrypted backup JSON and enter the password used to protect it.
          </Text>

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            Backup JSON Payload *
          </Text>
          <TextInput
            placeholder='{"format": "securevault_backup", ...}'
            placeholderTextColor={colors.textMuted}
            value={importJson}
            onChangeText={setImportJson}
            multiline
            numberOfLines={4}
            style={[
              styles.jsonBox,
              {
                backgroundColor: colors.inputBg,
                borderColor: colors.inputBorder,
                color: colors.text,
                minHeight: 90,
              },
            ]}
          />

          <PasswordField
            label="Backup Password *"
            placeholder="Enter password used when exporting"
            value={importPassword}
            onChangeText={setImportPassword}
          />

          {importError ? (
            <View style={styles.errorBox}>
              <ShieldAlert size={16} color={colors.destructive} style={{ marginRight: 6 }} />
              <Text style={[styles.errorText, { color: colors.destructive }]}>
                {importError}
              </Text>
            </View>
          ) : null}

          <Button
            title="Restore Vault Backup"
            icon={<Upload size={18} color="#FFFFFF" />}
            loading={isImporting}
            disabled={!importJson.trim() || !importPassword || isImporting}
            onPress={handleImport}
            style={{ marginTop: 6 }}
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
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  noticeText: {
    flex: 1,
    fontSize: typography.sizes.xs,
    lineHeight: 18,
  },
  sectionHeader: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    letterSpacing: 1,
    marginTop: 14,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  cardDesc: {
    fontSize: typography.sizes.xs,
    lineHeight: 18,
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    marginBottom: 6,
  },
  jsonBox: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    fontSize: typography.sizes.xs,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 12,
  },
  exportResult: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  resultLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    marginBottom: 6,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  errorText: {
    flex: 1,
    fontSize: typography.sizes.xs,
    lineHeight: 16,
  },
});
