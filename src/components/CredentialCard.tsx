import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Credential } from '@/models/credential.model';
import { useTheme } from '@/theme/ThemeContext';
import { typography } from '@/theme/typography';
import { Star, ExternalLink, Lock, User, ChevronRight } from 'lucide-react-native';
import { ClipboardService } from '@/security/clipboard.service';
import { useToast } from './ui/Toast';
import { CategoryIcon, getCategoryColor } from './CategoryIcon';

interface CredentialCardProps {
  credential: Credential;
  categoryName?: string;
  categoryNames?: string[];
  onPress: () => void;
  onToggleFavorite: () => void;
  onLaunchSite?: (credential: Credential) => void;
}

export const CredentialCard: React.FC<CredentialCardProps> = ({
  credential,
  categoryName,
  categoryNames,
  onPress,
  onToggleFavorite,
  onLaunchSite,
}) => {
  const { colors } = useTheme();
  const { showToast } = useToast();

  const handleCopyUsername = async (e: any) => {
    e.stopPropagation?.();
    if (credential.username) {
      await ClipboardService.copyWithAutoClear(credential.username, 30);
      showToast('Username copied to clipboard', 'info');
    }
  };

  const handleLaunchWebsite = async (e: any) => {
    e.stopPropagation?.();
    if (onLaunchSite) {
      onLaunchSite(credential);
      return;
    }
    if (!credential.website) return;
    let url = credential.website.trim();
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
    } catch {
      showToast('Could not open website', 'error');
    }
  };

  // Generate a stylish initial or icon
  const initial = credential.title.charAt(0).toUpperCase() || 'A';
  
  // Normalize category names list
  const allCategoryNames = categoryNames && categoryNames.length > 0
    ? categoryNames
    : (categoryName ? [categoryName] : []);
  const displayedCategories = allCategoryNames.slice(0, 2);
  const remainingCount = allCategoryNames.length - 2;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
        },
      ]}
    >
      <View style={styles.header}>
        {/* Logo / Initial Badge */}
        <View style={[styles.avatar, { backgroundColor: colors.surfaceSubtle }]}>
          <Text style={[styles.avatarText, { color: colors.primary }]}>{initial}</Text>
        </View>

        {/* Title & Username */}
        <View style={styles.titleContainer}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
              {credential.title}
            </Text>
            {displayedCategories.map((catName) => {
              const catColor = getCategoryColor(catName);
              return (
                <View
                  key={catName}
                  style={[
                    styles.categoryPill,
                    {
                      backgroundColor: catColor.bg,
                      borderColor: catColor.border,
                    },
                  ]}
                >
                  <CategoryIcon name={catName} size={11} color={catColor.text} />
                  <Text style={[styles.categoryPillText, { color: catColor.text }]}>
                    {catName}
                  </Text>
                </View>
              );
            })}
            {remainingCount > 0 && (
              <View style={[styles.categoryPill, { backgroundColor: colors.surfaceSubtle, borderColor: colors.surfaceBorder }]}>
                <Text style={[styles.categoryPillText, { color: colors.textMuted }]}>
                  +{remainingCount}
                </Text>
              </View>
            )}
          </View>

          {credential.username ? (
            <Text style={[styles.username, { color: colors.textSecondary }]} numberOfLines={1}>
              {credential.username}
            </Text>
          ) : (
            <Text style={[styles.username, { color: colors.textMuted }]}>
              No username
            </Text>
          )}
        </View>

        {/* Favorite Star */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={(e) => {
            e.stopPropagation?.();
            onToggleFavorite();
          }}
          style={styles.starBtn}
        >
          <Star
            size={20}
            color={credential.favorite ? '#F59E0B' : colors.textMuted}
            fill={credential.favorite ? '#F59E0B' : 'transparent'}
          />
        </TouchableOpacity>
      </View>

      {/* Footer: Protected Password representation & Launch / Go to Website action */}
      <View style={[styles.footer, { borderTopColor: colors.surfaceBorder }]}>
        <View style={styles.passwordMaskContainer}>
          <Lock size={13} color={colors.textMuted} style={styles.keyIcon} />
          <Text style={[styles.maskedPassword, { color: colors.textMuted }]}>
            ••••••••••••
          </Text>
        </View>

        <View style={styles.actionButtons}>
          {credential.username && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleCopyUsername}
              style={[styles.miniBtn, { backgroundColor: colors.surfaceSubtle }]}
              accessibilityLabel="Copy username"
            >
              <User size={13} color={colors.textSecondary} />
            </TouchableOpacity>
          )}

          {credential.website ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleLaunchWebsite}
              style={[
                styles.launchBtn,
                {
                  backgroundColor: `${colors.primary}15`,
                  borderColor: `${colors.primary}30`,
                },
              ]}
              accessibilityLabel="Go to website"
            >
              <Text style={[styles.launchBtnText, { color: colors.primary }]}>
                Go to Site
              </Text>
              <ExternalLink size={12} color={colors.primary} />
            </TouchableOpacity>
          ) : (
            <View style={styles.detailsHint}>
              <Text style={[styles.detailsHintText, { color: colors.textMuted }]}>
                Details
              </Text>
              <ChevronRight size={13} color={colors.textMuted} />
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  titleContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    maxWidth: 160,
  },
  categoryBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    borderWidth: 1,
    gap: 4,
  },
  categoryPillText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
  },
  username: {
    fontSize: typography.sizes.sm,
    marginTop: 2,
  },
  starBtn: {
    padding: 6,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  passwordMaskContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  keyIcon: {
    marginRight: 6,
  },
  maskedPassword: {
    fontSize: typography.sizes.sm,
    letterSpacing: 2,
    fontWeight: typography.weights.bold,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniBtn: {
    padding: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  launchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  launchBtnText: {
    fontSize: 11,
    fontWeight: typography.weights.semibold,
  },
  detailsHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  detailsHintText: {
    fontSize: 11,
    fontWeight: typography.weights.medium,
  },
});
