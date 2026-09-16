import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/theme/ThemeContext';
import { typography } from '@/theme/typography';
import { useAuthStore } from '@/store/auth.store';
import { useVaultStore } from '@/store/vault.store';
import { useCategoryStore } from '@/store/category.store';
import { useSettingsStore } from '@/store/settings.store';
import { useToast } from '@/components/ui/Toast';
import { ClipboardService } from '@/security/clipboard.service';
import { Button } from '@/components/ui/Button';
import { ConfirmationModal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { CategoryIcon, getCategoryColor } from '@/components/CategoryIcon';
import {
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  Star,
  Trash2,
  Edit3,
  Calendar,
  Check,
  ShieldCheck,
  AlertTriangle,
  Layers,
  Clock,
  Sparkles,
  Zap,
  Globe,
  KeyRound,
  Fingerprint,
  Landmark,
} from 'lucide-react-native';
import { VaultHealthService } from '@/security/vault-health.service';
import { AutofillService } from '@/services/autofill/autofill.service';
import { AutoFillModal } from '@/components/AutoFillModal';

export default function CredentialDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const { sessionKey } = useAuthStore();
  const { credentials, deleteCredential, toggleFavorite } = useVaultStore();
  const { categories } = useCategoryStore();
  const { settings } = useSettingsStore();

  const credential = credentials.find((c) => c.id === id);

  const healthAudit = React.useMemo(() => {
    if (!credential) return null;
    const report = VaultHealthService.analyze(credentials);
    return report.auditMap[credential.id] || null;
  }, [credentials, credential]);

  const activeCatIds = credential?.categoryIds && credential.categoryIds.length > 0
    ? credential.categoryIds
    : (credential?.categoryId ? [credential.categoryId] : []);
  const assignedCategories = categories.filter((c) => activeCatIds.includes(c.id));

  const isFinanceOrBanking = React.useMemo(() => {
    if (!credential) return false;
    const inFinanceCat = assignedCategories.some(
      (c) => c.id === 'cat-finance' || c.name.toLowerCase().includes('finance') || c.name.toLowerCase().includes('bank')
    );
    const titleMatch = /bank|chase|bofa|bdo|bpi|metrobank|unionbank|gcash|maya|paypal|fidelity|schwab|citi|capital\s*one/i.test(
      credential.title
    );
    return inFinanceCat || titleMatch;
  }, [credential, assignedCategories]);

  const [isPasswordRevealed, setIsPasswordRevealed] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAutofillModal, setShowAutofillModal] = useState(false);
  const [isProcessingOpenAndFill, setIsProcessingOpenAndFill] = useState(false);

  // Auto-hide revealed password after configurable seconds (default 10s)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (isPasswordRevealed) {
      const hideSeconds = settings.hidePasswordRevealSeconds || 10;
      timer = setTimeout(() => {
        setIsPasswordRevealed(false);
      }, hideSeconds * 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isPasswordRevealed, settings.hidePasswordRevealSeconds]);

  if (!credential) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFoundText, { color: colors.textMuted }]}>
          Account not found
        </Text>
        <Button title="Go Back" variant="outline" onPress={() => router.back()} />
      </View>
    );
  }

  const handleCopy = async (text: string, fieldName: string) => {
    const ok = await ClipboardService.copyWithAutoClear(text, settings.clipboardTimeoutSeconds);
    if (ok) {
      setCopiedField(fieldName);
      showToast(`${fieldName} copied to clipboard (clears in ${settings.clipboardTimeoutSeconds}s)`, 'success');
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  /**
   * Action 1: Open Website
   * Validates URL, opens in default browser without exposing password.
   * If missing/invalid, displays clear error message.
   */
  const handleOpenWebsite = async () => {
    const result = await AutofillService.openWebsite(credential.website);
    if (!result.success) {
      showToast(result.error || 'This account does not have a valid website URL.', 'error');
    }
  };

  /**
   * Action 2: Open & Fill
   * Validates URL, performs biometric auth, opens browser, and readies credentials in clipboard with auto-clear.
   */
  const handleOpenAndFill = async () => {
    try {
      setIsProcessingOpenAndFill(true);
      const result = await AutofillService.executeOpenAndFill(credential, settings);
      if (result.success) {
        showToast(
          `Credentials ready! Clipboard will auto-clear in ${settings.clipboardTimeoutSeconds}s.`,
          'success'
        );
      } else {
        showToast(result.error || 'This account does not have a valid website URL.', 'error');
      }
    } finally {
      setIsProcessingOpenAndFill(false);
    }
  };

  /**
   * Action 3: Autofill / Account Selector Modal
   */
  const handleAutofill = () => {
    setShowAutofillModal(true);
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteCredential(credential.id);
      showToast('Account removed from vault', 'info');
      router.back();
    } catch (e) {
      showToast('Failed to delete account', 'error');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const initial = credential.title.charAt(0).toUpperCase() || 'A';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Profile Card */}
        <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={[styles.avatar, { backgroundColor: colors.surfaceSubtle }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>{initial}</Text>
          </View>
          <View style={styles.heroText}>
            <Text style={[styles.title, { color: colors.text }]}>{credential.title}</Text>
            {assignedCategories.length > 0 && (
              <View style={styles.categoriesRow}>
                {assignedCategories.map((cat) => {
                  const catColor = getCategoryColor(cat.icon || cat.name);
                  return (
                    <View
                      key={cat.id}
                      style={[
                        styles.categoryPill,
                        {
                          backgroundColor: catColor.bg,
                          borderColor: catColor.border,
                        },
                      ]}
                    >
                      <CategoryIcon name={cat.icon || cat.name} size={12} color={catColor.text} />
                      <Text style={[styles.categoryPillText, { color: catColor.text }]}>
                        {cat.name}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
          <TouchableOpacity
            onPress={() => toggleFavorite(credential.id)}
            style={styles.favBtn}
          >
            <Star
              size={24}
              color={credential.favorite ? '#F59E0B' : colors.textMuted}
              fill={credential.favorite ? '#F59E0B' : 'transparent'}
            />
          </TouchableOpacity>
        </View>

        {/* Banking Security Banner */}
        {isFinanceOrBanking && (
          <View
            style={[
              styles.bankingBanner,
              {
                backgroundColor: `${colors.secondary}12`,
                borderColor: `${colors.secondary}35`,
              },
            ]}
          >
            <View style={styles.bankingBannerHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Landmark size={16} color={colors.secondary} />
                <Text style={[styles.bankingBannerTitle, { color: colors.secondary }]}>
                  High-Security Banking & Finance Account
                </Text>
              </View>
            </View>
            <Text style={[styles.bankingBannerDesc, { color: colors.textSecondary }]}>
              Protected by local AES-256-GCM encryption. Use <Text style={{ fontWeight: '700', color: colors.secondary }}>Open Website</Text> or <Text style={{ fontWeight: '700', color: colors.secondary }}>Open & Fill</Text> to access your bank securely without exposing your password.
            </Text>
          </View>
        )}

        {/* Autofill & Website Action Bar */}
        <View style={[styles.quickActionsCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.quickActionsTitle, { color: colors.textSecondary }]}>
            CREDENTIAL ACTIONS
          </Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={[styles.quickActionButton, { backgroundColor: `${colors.primary}15`, borderColor: `${colors.primary}30` }]}
              onPress={handleOpenWebsite}
              activeOpacity={0.7}
            >
              <Globe size={18} color={colors.primary} />
              <Text style={[styles.quickActionText, { color: colors.primary }]}>Open Website</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionButton, { backgroundColor: `${colors.secondary}15`, borderColor: `${colors.secondary}30` }]}
              onPress={handleAutofill}
              activeOpacity={0.7}
            >
              <Fingerprint size={18} color={colors.secondary} />
              <Text style={[styles.quickActionText, { color: colors.secondary }]}>Autofill</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionButton, { backgroundColor: `${colors.accent}15`, borderColor: `${colors.accent}30` }]}
              onPress={handleOpenAndFill}
              activeOpacity={0.7}
              disabled={isProcessingOpenAndFill}
            >
              <Zap size={18} color={colors.accent} />
              <Text style={[styles.quickActionText, { color: colors.accent }]}>Open & Fill</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Username Row */}
        {credential.username && (
          <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Username / Email</Text>
            <View style={styles.valueRow}>
              <Text style={[styles.detailValue, { color: colors.text }]} selectable>
                {credential.username}
              </Text>
              <TouchableOpacity
                onPress={() => handleCopy(credential.username!, 'Username')}
                style={[styles.actionIconBtn, { backgroundColor: colors.surfaceSubtle }]}
              >
                {copiedField === 'Username' ? (
                  <Check size={18} color={colors.success} />
                ) : (
                  <Copy size={18} color={colors.primary} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Password Row */}
        <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.labelRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Password</Text>
            {isPasswordRevealed && (
              <Text style={[styles.revealCountdown, { color: colors.warning }]}>
                Auto-hides in {settings.hidePasswordRevealSeconds}s
              </Text>
            )}
          </View>
          <View style={styles.valueRow}>
            <Text
              style={[
                styles.detailValue,
                {
                  color: colors.text,
                  letterSpacing: isPasswordRevealed ? 0 : 3,
                  fontWeight: isPasswordRevealed ? typography.weights.medium : typography.weights.bold,
                },
              ]}
              selectable={isPasswordRevealed}
            >
              {isPasswordRevealed ? credential.password : '••••••••••••••••'}
            </Text>
            <View style={styles.passwordBtnGroup}>
              <TouchableOpacity
                onPress={() => setIsPasswordRevealed(!isPasswordRevealed)}
                style={[styles.actionIconBtn, { backgroundColor: colors.surfaceSubtle }]}
                accessibilityLabel={isPasswordRevealed ? 'Hide password' : 'Show password'}
              >
                {isPasswordRevealed ? (
                  <EyeOff size={18} color={colors.primary} />
                ) : (
                  <Eye size={18} color={colors.textSecondary} />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleCopy(credential.password, 'Password')}
                style={[styles.actionIconBtn, { backgroundColor: colors.surfaceSubtle }]}
                accessibilityLabel="Copy password"
              >
                {copiedField === 'Password' ? (
                  <Check size={18} color={colors.success} />
                ) : (
                  <Copy size={18} color={colors.primary} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Security Audit Badge / Box */}
        {healthAudit && (
          <View
            style={[
              styles.securityAuditBox,
              {
                backgroundColor: healthAudit.isSafe ? `${colors.success}10` : `${colors.warning}10`,
                borderColor: healthAudit.isSafe ? `${colors.success}30` : `${colors.warning}30`,
              },
            ]}
          >
            <View style={styles.securityAuditHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {healthAudit.isSafe ? (
                  <ShieldCheck size={16} color={colors.success} />
                ) : (
                  <AlertTriangle size={16} color={colors.warning} />
                )}
                <Text
                  style={[
                    styles.securityAuditTitle,
                    { color: healthAudit.isSafe ? colors.success : colors.warning },
                  ]}
                >
                  {healthAudit.isSafe ? 'Security Status: Strong & Unique' : 'Security Alert: Attention Needed'}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => router.push('/(authenticated)/health')}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}
              >
                <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '600' }}>
                  Vault Audit
                </Text>
              </TouchableOpacity>
            </View>

            {healthAudit.issues.map((issue, idx) => (
              <Text key={idx} style={[styles.securityAuditIssue, { color: colors.textSecondary }]}>
                • {issue}
              </Text>
            ))}

            {!healthAudit.isSafe && (
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: '/(authenticated)/credentials/edit',
                    params: { id: credential.id },
                  })
                }
                style={[styles.securityFixBtn, { backgroundColor: colors.primary }]}
              >
                <Sparkles size={13} color="#FFFFFF" />
                <Text style={styles.securityFixBtnText}>Update to Strong Password</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Website Row */}
        {credential.website && (
          <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Website</Text>
            <View style={styles.valueRow}>
              <Text style={[styles.detailValue, { color: colors.primary }]} numberOfLines={1}>
                {credential.website}
              </Text>
              <TouchableOpacity
                onPress={handleOpenWebsite}
                style={[styles.actionIconBtn, { backgroundColor: colors.surfaceSubtle }]}
                accessibilityLabel="Open in browser"
              >
                <ExternalLink size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Additional URIs */}
        {credential.uris && credential.uris.length > 0 && (
          <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Additional Domains & Apps</Text>
            {credential.uris.map((u, idx) => (
              <View key={idx} style={[styles.uriItemRow, idx > 0 && { borderTopColor: colors.surfaceBorder, borderTopWidth: 1 }]}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[styles.uriItemText, { color: colors.text }]} numberOfLines={1}>{u.uri}</Text>
                  <Text style={[styles.uriItemMatch, { color: colors.textMuted }]}>Match: {u.matchType || 'domain'}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => AutofillService.openWebsite(u.uri)}
                  style={[styles.actionIconBtn, { backgroundColor: colors.surfaceSubtle }]}
                >
                  <ExternalLink size={16} color={colors.primary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Notes */}
        {credential.notes && (
          <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Notes</Text>
            <Text style={[styles.notesValue, { color: colors.text }]} selectable>
              {credential.notes}
            </Text>
          </View>
        )}

        {/* Metadata Footer */}
        <View style={styles.metaRow}>
          <Calendar size={14} color={colors.textMuted} />
          <Text style={[styles.metaText, { color: colors.textMuted }]}>
            Updated: {new Date(credential.updatedAt).toLocaleDateString()}
          </Text>
        </View>

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          <Button
            title="Edit Account"
            variant="secondary"
            icon={<Edit3 size={18} color={colors.text} />}
            onPress={() => router.push(`/(authenticated)/credentials/edit?id=${credential.id}`)}
            style={styles.actionBtn}
          />
          <Button
            title="Delete"
            variant="destructive"
            icon={<Trash2 size={18} color="#FFFFFF" />}
            onPress={() => setShowDeleteModal(true)}
            style={styles.actionBtn}
          />
        </View>
      </ScrollView>

      {/* Autofill & Account Selection Modal */}
      <AutoFillModal
        visible={showAutofillModal}
        credential={credential}
        allCredentials={credentials}
        onClose={() => setShowAutofillModal(false)}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        visible={showDeleteModal}
        title="Delete Account?"
        message={`"${credential.title}" will be permanently removed from your vault. This cannot be undone.`}
        confirmLabel="Delete Account"
        isDestructive
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notFoundText: {
    fontSize: typography.sizes.base,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  heroText: {
    flex: 1,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    marginBottom: 4,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
  },
  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    gap: 5,
  },
  categoryPillText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  favBtn: {
    padding: 8,
  },
  bankingBanner: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  bankingBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  bankingBannerTitle: {
    fontSize: 13,
    fontWeight: typography.weights.bold,
  },
  bankingBannerDesc: {
    fontSize: typography.sizes.xs,
    lineHeight: 18,
  },
  quickActionsCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  quickActionsTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.5,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  quickActionText: {
    fontSize: 11,
    fontWeight: typography.weights.bold,
    textAlign: 'center',
  },
  uriItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  uriItemText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  uriItemMatch: {
    fontSize: 11,
    marginTop: 2,
  },
  detailCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  revealCountdown: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailValue: {
    flex: 1,
    fontSize: typography.sizes.base,
    marginRight: 10,
  },
  notesValue: {
    fontSize: typography.sizes.sm,
    lineHeight: 20,
  },
  passwordBtnGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  actionIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityAuditBox: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  securityAuditHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  securityAuditTitle: {
    fontSize: 13,
    fontWeight: typography.weights.bold,
  },
  securityAuditIssue: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 2,
  },
  securityFixBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  securityFixBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: typography.weights.semibold,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 24,
    gap: 6,
  },
  metaText: {
    fontSize: typography.sizes.xs,
  },
  bottomActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
  },
});
