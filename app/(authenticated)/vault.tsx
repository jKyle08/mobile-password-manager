import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme/ThemeContext';
import { typography } from '@/theme/typography';
import { useAuthStore } from '@/store/auth.store';
import { useVaultStore } from '@/store/vault.store';
import { useCategoryStore } from '@/store/category.store';
import { CredentialCard } from '@/components/CredentialCard';
import { CategoryChipGroup } from '@/components/CategoryChip';
import { AutoFillModal } from '@/components/AutoFillModal';
import { Credential } from '@/models/credential.model';
import {
  Search,
  Plus,
  Settings,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Sparkles,
  FolderOpen,
  Activity,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react-native';
import { VaultHealthService } from '@/security/vault-health.service';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function VaultScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { sessionKey, lockVault } = useAuthStore();
  const {
    credentials,
    searchQuery,
    selectedCategoryId,
    isLoading,
    loadCredentials,
    toggleFavorite,
    setSearchQuery,
    setSelectedCategoryId,
  } = useVaultStore();

  const { categories, loadCategories } = useCategoryStore();
  const [autoFillCred, setAutoFillCred] = React.useState<Credential | null>(null);

  useEffect(() => {
    if (sessionKey) {
      loadCredentials(sessionKey);
      loadCategories();
    }
  }, [sessionKey]);

  const handleRefresh = () => {
    if (sessionKey) {
      loadCredentials(sessionKey);
      loadCategories();
    }
  };

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((cat) => map.set(cat.id, cat.name));
    return map;
  }, [categories]);

  const healthReport = useMemo(() => {
    return VaultHealthService.analyze(credentials);
  }, [credentials]);

  const healthScoreColor = useMemo(() => {
    if (healthReport.score >= 85) return colors.success;
    if (healthReport.score >= 70) return colors.secondary;
    if (healthReport.score >= 50) return colors.warning;
    return colors.destructive;
  }, [healthReport.score, colors]);

  // Filter credentials by category and search query
  const filteredCredentials = useMemo(() => {
    return credentials.filter((item) => {
      // Category filter
      if (selectedCategoryId === 'favorites') {
        if (!item.favorite) return false;
      } else if (selectedCategoryId) {
        const itemCatIds = item.categoryIds && item.categoryIds.length > 0
          ? item.categoryIds
          : (item.categoryId ? [item.categoryId] : []);
        if (!itemCatIds.includes(selectedCategoryId)) return false;
      }

      // Search query filter (searches title, username, website, tags, and category names)
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchUsername = item.username?.toLowerCase().includes(q);
        const matchWebsite = item.website?.toLowerCase().includes(q);
        const itemCatIds = item.categoryIds && item.categoryIds.length > 0
          ? item.categoryIds
          : (item.categoryId ? [item.categoryId] : []);
        const matchCategory = itemCatIds.some((catId) =>
          categoryMap.get(catId)?.toLowerCase().includes(q)
        );
        return matchTitle || matchUsername || matchWebsite || matchCategory;
      }

      return true;
    });
  }, [credentials, selectedCategoryId, searchQuery, categoryMap]);

  // Split into favorites and regular accounts for structured layout
  const { favoritesList, otherList } = useMemo(() => {
    if (selectedCategoryId === 'favorites') {
      return { favoritesList: filteredCredentials, otherList: [] };
    }
    const favs = filteredCredentials.filter((c) => c.favorite);
    const others = filteredCredentials.filter((c) => !c.favorite);
    return { favoritesList: favs, otherList: others };
  }, [filteredCredentials, selectedCategoryId]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <View style={styles.branding}>
          <ShieldCheck size={26} color={colors.primary} style={styles.brandIcon} />
          <Text style={[styles.brandTitle, { color: colors.text }]}>My Vault</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => router.push('/(authenticated)/health')}
            style={[
              styles.headerIconBtn,
              { backgroundColor: colors.surfaceSubtle, position: 'relative' },
            ]}
            accessibilityLabel="Vault Security Health"
          >
            {healthReport.totalVulnerabilitiesCount > 0 ? (
              <ShieldAlert size={20} color={healthScoreColor} />
            ) : (
              <ShieldCheck size={20} color={colors.success} />
            )}
            {healthReport.totalVulnerabilitiesCount > 0 && (
              <View
                style={[
                  styles.headerBadgeDot,
                  { backgroundColor: healthScoreColor },
                ]}
              />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(authenticated)/generator')}
            style={[styles.headerIconBtn, { backgroundColor: colors.surfaceSubtle }]}
            accessibilityLabel="Password Generator"
          >
            <Sparkles size={20} color={colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(authenticated)/settings')}
            style={[styles.headerIconBtn, { backgroundColor: colors.surfaceSubtle }]}
            accessibilityLabel="Settings"
          >
            <Settings size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              lockVault();
              router.replace('/unlock');
            }}
            style={[styles.headerIconBtn, { backgroundColor: colors.surfaceSubtle }]}
            accessibilityLabel="Lock Vault"
          >
            <Lock size={20} color={colors.destructive} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Security Health Mini Banner (when credentials exist) */}
      {credentials.length > 0 && (
        <View style={styles.healthBannerWrapper}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/(authenticated)/health')}
            style={[
              styles.healthBanner,
              {
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <View style={styles.healthBannerLeft}>
              <View
                style={[
                  styles.healthScorePill,
                  {
                    backgroundColor: `${healthScoreColor}18`,
                    borderColor: healthScoreColor,
                  },
                ]}
              >
                <Text style={[styles.healthScorePillText, { color: healthScoreColor }]}>
                  {healthReport.score}%
                </Text>
              </View>
              <View style={styles.healthBannerTextContainer}>
                <View style={styles.healthBannerTitleRow}>
                  <Text style={[styles.healthBannerTitle, { color: colors.text }]}>
                    Vault Health: {healthReport.statusLabel}
                  </Text>
                  {healthReport.totalVulnerabilitiesCount > 0 && (
                    <View
                      style={[
                        styles.warningCountBadge,
                        { backgroundColor: `${colors.destructive}20` },
                      ]}
                    >
                      <Text
                        style={[
                          styles.warningCountBadgeText,
                          { color: colors.destructive },
                        ]}
                      >
                        {healthReport.totalVulnerabilitiesCount} issues
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.healthBannerSubtitle, { color: colors.textMuted }]}>
                  {healthReport.totalVulnerabilitiesCount === 0
                    ? 'All passwords are strong & unique'
                    : `${healthReport.reusedAccountsCount} reused • ${healthReport.weakIssues.length} weak • ${healthReport.oldIssues.length} stagnant`}
                </Text>
              </View>
            </View>

            <View style={styles.healthBannerRight}>
              <Text style={[styles.healthBannerActionText, { color: colors.primary }]}>
                Audit
              </Text>
              <ChevronRight size={16} color={colors.primary} />
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: colors.inputBg,
              borderColor: colors.inputBorder,
            },
          ]}
        >
          <Search size={18} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            placeholder="Search accounts, usernames, URLs..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: colors.text }]}
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {/* Category Pills */}
      <CategoryChipGroup
        categories={categories}
        selectedId={selectedCategoryId}
        onSelect={setSelectedCategoryId}
      />

      {/* Credentials List */}
      <FlatList
        data={filteredCredentials}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconContainer, { backgroundColor: colors.surfaceSubtle }]}>
              <FolderOpen size={48} color={colors.textMuted} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {searchQuery ? 'No matching accounts found' : 'No credentials yet'}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              {searchQuery
                ? 'Try a different search query or category filter.'
                : 'Tap "+ Add Account" below to store your first password securely.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const itemCatIds = item.categoryIds && item.categoryIds.length > 0
            ? item.categoryIds
            : (item.categoryId ? [item.categoryId] : []);
          const categoryNames = itemCatIds
            .map((catId) => categoryMap.get(catId))
            .filter(Boolean) as string[];

          return (
            <CredentialCard
              credential={item}
              categoryNames={categoryNames}
              onPress={() => router.push(`/(authenticated)/credentials/${item.id}`)}
              onToggleFavorite={() => toggleFavorite(item.id)}
              onLaunchSite={(cred) => setAutoFillCred(cred)}
            />
          );
        }}
      />

      {/* Quick AutoFill & Login Assistant Modal */}
      <AutoFillModal
        visible={Boolean(autoFillCred)}
        credential={autoFillCred}
        allCredentials={credentials}
        onClose={() => setAutoFillCred(null)}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => router.push('/(authenticated)/credentials/add')}
        style={[
          styles.fab,
          {
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
          },
        ]}
      >
        <Plus size={24} color="#FFFFFF" />
        <Text style={styles.fabText}>Add Account</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  branding: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandIcon: {
    marginRight: 10,
  },
  brandTitle: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBadgeDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  healthBannerWrapper: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 4,
  },
  healthBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  healthBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  healthScorePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1.5,
    marginRight: 10,
  },
  healthScorePillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  healthBannerTextContainer: {
    flex: 1,
  },
  healthBannerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  healthBannerTitle: {
    fontSize: 13,
    fontWeight: typography.weights.bold,
  },
  warningCountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  warningCountBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  healthBannerSubtitle: {
    fontSize: 11,
  },
  healthBannerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  healthBannerActionText: {
    fontSize: 12,
    fontWeight: typography.weights.semibold,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 46,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.sizes.base,
    height: '100%',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 90,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  emptyIconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 30,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  fabText: {
    color: '#FFFFFF',
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.base,
    marginLeft: 6,
  },
});
