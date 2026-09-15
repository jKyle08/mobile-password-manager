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
} from 'lucide-react-native';

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

  const [isPasswordRevealed, setIsPasswordRevealed] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const activeCatIds = credential.categoryIds && credential.categoryIds.length > 0
    ? credential.categoryIds
    : (credential.categoryId ? [credential.categoryId] : []);
  const assignedCategories = categories.filter((c) => activeCatIds.includes(c.id));

  const handleCopy = async (text: string, fieldName: string) => {
    const ok = await ClipboardService.copyWithAutoClear(text, settings.clipboardTimeoutSeconds);
    if (ok) {
      setCopiedField(fieldName);
      showToast(`${fieldName} copied to clipboard (clears in ${settings.clipboardTimeoutSeconds}s)`, 'success');
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const handleOpenWebsite = async () => {
    if (!credential.website) return;
    let url = credential.website;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        showToast('Invalid website URL', 'error');
      }
    } catch (e) {
      showToast('Could not open link', 'error');
    }
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
