import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme/ThemeContext';
import { typography } from '@/theme/typography';
import { useAuthStore } from '@/store/auth.store';
import { useVaultStore } from '@/store/vault.store';
import {
  VaultHealthService,
  VaultHealthReport,
} from '@/security/vault-health.service';
import {
  ShieldCheck,
  AlertTriangle,
  Clock,
  Key,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  CheckCircle2,
  Info,
  Layers,
} from 'lucide-react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type FilterTab = 'all' | 'reused' | 'weak' | 'old' | 'safe';

export default function VaultHealthScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { sessionKey } = useAuthStore();
  const { credentials, isLoading, loadCredentials } = useVaultStore();

  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const report: VaultHealthReport = useMemo(() => {
    return VaultHealthService.analyze(credentials);
  }, [credentials]);

  const handleRefresh = () => {
    if (sessionKey) {
      loadCredentials(sessionKey);
    }
  };

  const setFilterWithAnimation = (tab: FilterTab) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveTab(tab);
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return colors.success;
    if (score >= 70) return colors.secondary;
    if (score >= 50) return colors.warning;
    return colors.destructive;
  };

  const scoreColor = getScoreColor(report.score);

  // Accounts list based on active filter
  const displayedAccounts = useMemo(() => {
    if (activeTab === 'reused') {
      return credentials.filter((c) => report.auditMap[c.id]?.isReused);
    }
    if (activeTab === 'weak') {
      return credentials.filter((c) => report.auditMap[c.id]?.isWeak);
    }
    if (activeTab === 'old') {
      return credentials.filter((c) => report.auditMap[c.id]?.isOld);
    }
    if (activeTab === 'safe') {
      return credentials.filter((c) => report.auditMap[c.id]?.isSafe);
    }
    // 'all' = accounts with at least one issue (or all accounts if no issues)
    const vulnerable = credentials.filter((c) => !report.auditMap[c.id]?.isSafe);
    return vulnerable.length > 0 ? vulnerable : credentials;
  }, [activeTab, credentials, report.auditMap]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Overall Health Score Card */}
        <View
          style={[
            styles.scoreCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          <View style={styles.scoreHeaderRow}>
            <View style={styles.scoreInfo}>
              <View style={styles.scoreBadgeRow}>
                <View
                  style={[
                    styles.gradeBadge,
                    { backgroundColor: `${scoreColor}20`, borderColor: scoreColor },
                  ]}
                >
                  <Text style={[styles.gradeBadgeText, { color: scoreColor }]}>
                    GRADE {report.grade}
                  </Text>
                </View>
                <Text style={[styles.statusLabelText, { color: scoreColor }]}>
                  {report.statusLabel}
                </Text>
              </View>

              <Text style={[styles.scoreTitle, { color: colors.text }]}>
                Vault Security Health
              </Text>

              <Text style={[styles.scoreDescription, { color: colors.textSecondary }]}>
                {report.totalAccounts === 0
                  ? 'Add accounts to begin automated vault security analysis.'
                  : report.totalVulnerabilitiesCount === 0
                  ? 'All accounts pass security audits with unique & strong credentials.'
                  : `${report.totalVulnerabilitiesCount} security alert${report.totalVulnerabilitiesCount > 1 ? 's' : ''} detected across ${report.totalAccounts} accounts.`}
              </Text>
            </View>

            {/* Circular / Large Score Number Display */}
            <View
              style={[
                styles.scoreCircle,
                {
                  borderColor: scoreColor,
                  backgroundColor: `${scoreColor}10`,
                },
              ]}
            >
              <Text style={[styles.scoreNumber, { color: scoreColor }]}>
                {report.score}
              </Text>
              <Text style={[styles.scorePercentLabel, { color: colors.textMuted }]}>
                / 100
              </Text>
            </View>
          </View>

          {/* Linear Progress Bar */}
          <View style={[styles.progressBarTrack, { backgroundColor: colors.surfaceSubtle }]}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${report.score}%`,
                  backgroundColor: scoreColor,
                },
              ]}
            />
          </View>

          {/* Quick Metrics Bar */}
          <View style={[styles.metricsRow, { borderTopColor: colors.surfaceBorder }]}>
            <View style={styles.metricItem}>
              <Text style={[styles.metricNumber, { color: colors.text }]}>
                {report.totalAccounts}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.textMuted }]}>
                Total
              </Text>
            </View>

            <View style={[styles.metricDivider, { backgroundColor: colors.surfaceBorder }]} />

            <View style={styles.metricItem}>
              <Text style={[styles.metricNumber, { color: colors.success }]}>
                {report.safeAccountsCount}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.textMuted }]}>
                Protected
              </Text>
            </View>

            <View style={[styles.metricDivider, { backgroundColor: colors.surfaceBorder }]} />

            <View style={styles.metricItem}>
              <Text
                style={[
                  styles.metricNumber,
                  {
                    color:
                      report.totalVulnerabilitiesCount > 0
                        ? colors.destructive
                        : colors.textSecondary,
                  },
                ]}
              >
                {report.totalAccounts - report.safeAccountsCount}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.textMuted }]}>
                At Risk
              </Text>
            </View>
          </View>
        </View>

        {/* 4 Core Security Audit Metric Cards */}
        <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
          SECURITY CATEGORIES
        </Text>

        <View style={styles.auditCardsGrid}>
          {/* Reused Passwords */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setFilterWithAnimation('reused')}
            style={[
              styles.auditCategoryCard,
              {
                backgroundColor:
                  activeTab === 'reused' ? `${colors.warning}15` : colors.card,
                borderColor:
                  activeTab === 'reused' ? colors.warning : colors.cardBorder,
              },
            ]}
          >
            <View style={styles.auditCardTop}>
              <View
                style={[
                  styles.auditIconWrapper,
                  { backgroundColor: `${colors.warning}20` },
                ]}
              >
                <Layers size={20} color={colors.warning} />
              </View>
              <View
                style={[
                  styles.countPill,
                  {
                    backgroundColor:
                      report.reusedAccountsCount > 0
                        ? colors.warning
                        : colors.surfaceSubtle,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.countPillText,
                    {
                      color:
                        report.reusedAccountsCount > 0
                          ? '#000000'
                          : colors.textMuted,
                    },
                  ]}
                >
                  {report.reusedAccountsCount}
                </Text>
              </View>
            </View>
            <Text style={[styles.auditCardTitle, { color: colors.text }]}>
              Reused Passwords
            </Text>
            <Text style={[styles.auditCardSub, { color: colors.textMuted }]}>
              {report.reusedAccountsCount > 0
                ? `${report.reusedIssues.length} duplicate group${report.reusedIssues.length > 1 ? 's' : ''}`
                : 'Zero duplicates'}
            </Text>
          </TouchableOpacity>

          {/* Weak Passwords */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setFilterWithAnimation('weak')}
            style={[
              styles.auditCategoryCard,
              {
                backgroundColor:
                  activeTab === 'weak' ? `${colors.destructive}15` : colors.card,
                borderColor:
                  activeTab === 'weak' ? colors.destructive : colors.cardBorder,
              },
            ]}
          >
            <View style={styles.auditCardTop}>
              <View
                style={[
                  styles.auditIconWrapper,
                  { backgroundColor: `${colors.destructive}20` },
                ]}
              >
                <AlertTriangle size={20} color={colors.destructive} />
              </View>
              <View
                style={[
                  styles.countPill,
                  {
                    backgroundColor:
                      report.weakIssues.length > 0
                        ? colors.destructive
                        : colors.surfaceSubtle,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.countPillText,
                    {
                      color:
                        report.weakIssues.length > 0
                          ? '#FFFFFF'
                          : colors.textMuted,
                    },
                  ]}
                >
                  {report.weakIssues.length}
                </Text>
              </View>
            </View>
            <Text style={[styles.auditCardTitle, { color: colors.text }]}>
              Weak Passwords
            </Text>
            <Text style={[styles.auditCardSub, { color: colors.textMuted }]}>
              {report.weakIssues.length > 0
                ? '< 12 chars or low entropy'
                : 'All pass strength check'}
            </Text>
          </TouchableOpacity>

          {/* Old / Stagnant Passwords */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setFilterWithAnimation('old')}
            style={[
              styles.auditCategoryCard,
              {
                backgroundColor:
                  activeTab === 'old' ? `${colors.secondary}15` : colors.card,
                borderColor:
                  activeTab === 'old' ? colors.secondary : colors.cardBorder,
              },
            ]}
          >
            <View style={styles.auditCardTop}>
              <View
                style={[
                  styles.auditIconWrapper,
                  { backgroundColor: `${colors.secondary}20` },
                ]}
              >
                <Clock size={20} color={colors.secondary} />
              </View>
              <View
                style={[
                  styles.countPill,
                  {
                    backgroundColor:
                      report.oldIssues.length > 0
                        ? colors.secondary
                        : colors.surfaceSubtle,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.countPillText,
                    {
                      color:
                        report.oldIssues.length > 0
                          ? '#FFFFFF'
                          : colors.textMuted,
                    },
                  ]}
                >
                  {report.oldIssues.length}
                </Text>
              </View>
            </View>
            <Text style={[styles.auditCardTitle, { color: colors.text }]}>
              Old Passwords
            </Text>
            <Text style={[styles.auditCardSub, { color: colors.textMuted }]}>
              {report.oldIssues.length > 0
                ? 'Unchanged in 90+ days'
                : 'All rotated recently'}
            </Text>
          </TouchableOpacity>

          {/* Safe & Strong */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setFilterWithAnimation('safe')}
            style={[
              styles.auditCategoryCard,
              {
                backgroundColor:
                  activeTab === 'safe' ? `${colors.success}15` : colors.card,
                borderColor:
                  activeTab === 'safe' ? colors.success : colors.cardBorder,
              },
            ]}
          >
            <View style={styles.auditCardTop}>
              <View
                style={[
                  styles.auditIconWrapper,
                  { backgroundColor: `${colors.success}20` },
                ]}
              >
                <ShieldCheck size={20} color={colors.success} />
              </View>
              <View
                style={[
                  styles.countPill,
                  {
                    backgroundColor:
                      report.safeAccountsCount > 0
                        ? colors.success
                        : colors.surfaceSubtle,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.countPillText,
                    {
                      color:
                        report.safeAccountsCount > 0
                          ? '#FFFFFF'
                          : colors.textMuted,
                    },
                  ]}
                >
                  {report.safeAccountsCount}
                </Text>
              </View>
            </View>
            <Text style={[styles.auditCardTitle, { color: colors.text }]}>
              Safe & Strong
            </Text>
            <Text style={[styles.auditCardSub, { color: colors.textMuted }]}>
              Passed all audits
            </Text>
          </TouchableOpacity>
        </View>

        {/* Filter Pills */}
        <View style={styles.filterTabsWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterTabsContainer}
          >
            <TouchableOpacity
              onPress={() => setFilterWithAnimation('all')}
              style={[
                styles.filterPill,
                {
                  backgroundColor:
                    activeTab === 'all' ? colors.primary : colors.surfaceSubtle,
                  borderColor:
                    activeTab === 'all' ? colors.primary : colors.surfaceBorder,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterPillText,
                  { color: activeTab === 'all' ? '#FFFFFF' : colors.textSecondary },
                ]}
              >
                All Vulnerabilities ({report.totalAccounts - report.safeAccountsCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setFilterWithAnimation('reused')}
              style={[
                styles.filterPill,
                {
                  backgroundColor:
                    activeTab === 'reused' ? colors.warning : colors.surfaceSubtle,
                  borderColor:
                    activeTab === 'reused' ? colors.warning : colors.surfaceBorder,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterPillText,
                  {
                    color:
                      activeTab === 'reused' ? '#000000' : colors.textSecondary,
                  },
                ]}
              >
                ⚠️ Reused ({report.reusedAccountsCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setFilterWithAnimation('weak')}
              style={[
                styles.filterPill,
                {
                  backgroundColor:
                    activeTab === 'weak' ? colors.destructive : colors.surfaceSubtle,
                  borderColor:
                    activeTab === 'weak' ? colors.destructive : colors.surfaceBorder,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterPillText,
                  { color: activeTab === 'weak' ? '#FFFFFF' : colors.textSecondary },
                ]}
              >
                🔴 Weak ({report.weakIssues.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setFilterWithAnimation('old')}
              style={[
                styles.filterPill,
                {
                  backgroundColor:
                    activeTab === 'old' ? colors.secondary : colors.surfaceSubtle,
                  borderColor:
                    activeTab === 'old' ? colors.secondary : colors.surfaceBorder,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterPillText,
                  { color: activeTab === 'old' ? '#FFFFFF' : colors.textSecondary },
                ]}
              >
                ⏳ Old / 90d+ ({report.oldIssues.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setFilterWithAnimation('safe')}
              style={[
                styles.filterPill,
                {
                  backgroundColor:
                    activeTab === 'safe' ? colors.success : colors.surfaceSubtle,
                  borderColor:
                    activeTab === 'safe' ? colors.success : colors.surfaceBorder,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterPillText,
                  { color: activeTab === 'safe' ? '#FFFFFF' : colors.textSecondary },
                ]}
              >
                🛡️ Safe ({report.safeAccountsCount})
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Reused Groups Highlights (When filtered by Reused or All) */}
        {(activeTab === 'reused' || activeTab === 'all') &&
          report.reusedIssues.length > 0 && (
            <View style={styles.reusedSection}>
              <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
                REUSED PASSWORD CLUSTERS
              </Text>
              {report.reusedIssues.map((group, idx) => (
                <View
                  key={`group-${idx}`}
                  style={[
                    styles.reusedGroupCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.cardBorder,
                    },
                  ]}
                >
                  <View style={styles.reusedGroupHeader}>
                    <View style={styles.reusedBadge}>
                      <Layers size={14} color={colors.warning} />
                      <Text style={[styles.reusedBadgeText, { color: colors.warning }]}>
                        Shared across {group.count} accounts
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() =>
                        router.push('/(authenticated)/generator')
                      }
                      style={[
                        styles.quickGenBtn,
                        { backgroundColor: colors.surfaceSubtle },
                      ]}
                    >
                      <Sparkles size={12} color={colors.primary} />
                      <Text style={[styles.quickGenBtnText, { color: colors.primary }]}>
                        New Password
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.reusedAccountsList}>
                    {group.accounts.map((acc) => (
                      <TouchableOpacity
                        key={acc.id}
                        onPress={() => router.push(`/(authenticated)/credentials/${acc.id}`)}
                        style={[
                          styles.reusedAccountRow,
                          { borderTopColor: colors.surfaceBorder },
                        ]}
                      >
                        <View style={styles.reusedAccountInfo}>
                          <Text style={[styles.reusedAccountTitle, { color: colors.text }]}>
                            {acc.title}
                          </Text>
                          {acc.username ? (
                            <Text style={[styles.reusedAccountSub, { color: colors.textMuted }]}>
                              {acc.username}
                            </Text>
                          ) : null}
                        </View>
                        <ChevronRight size={16} color={colors.textMuted} />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}

        {/* Detailed Account Issues List */}
        <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
          {activeTab === 'safe'
            ? 'PROTECTED ACCOUNTS'
            : activeTab === 'all'
            ? 'ACCOUNTS REQUIRING ATTENTION'
            : `${activeTab.toUpperCase()} ACCOUNTS`}
        </Text>

        {displayedAccounts.length === 0 ? (
          <View
            style={[
              styles.cleanCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <View
              style={[
                styles.cleanIconBox,
                { backgroundColor: `${colors.success}20` },
              ]}
            >
              <CheckCircle2 size={36} color={colors.success} />
            </View>
            <Text style={[styles.cleanTitle, { color: colors.text }]}>
              {activeTab === 'safe'
                ? 'No Safe Accounts Yet'
                : 'No Issues in This Category!'}
            </Text>
            <Text style={[styles.cleanSub, { color: colors.textSecondary }]}>
              {activeTab === 'safe'
                ? 'Update your passwords with the password generator to improve account security.'
                : 'All accounts in your vault meet recommended security standards.'}
            </Text>
          </View>
        ) : (
          displayedAccounts.map((account) => {
            const audit = report.auditMap[account.id];
            const isSafe = audit?.isSafe;

            return (
              <View
                key={account.id}
                style={[
                  styles.accountCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                {/* Account Card Header */}
                <View style={styles.accountCardHeader}>
                  <View style={styles.accountCardTitleGroup}>
                    <View
                      style={[
                        styles.accountAvatar,
                        {
                          backgroundColor: isSafe
                            ? `${colors.success}20`
                            : `${colors.destructive}20`,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.accountAvatarText,
                          {
                            color: isSafe ? colors.success : colors.destructive,
                          },
                        ]}
                      >
                        {account.title.substring(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.accountTextContainer}>
                      <Text style={[styles.accountTitle, { color: colors.text }]}>
                        {account.title}
                      </Text>
                      <Text style={[styles.accountUsername, { color: colors.textMuted }]}>
                        {account.username || account.website || 'No username'}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() =>
                      router.push(`/(authenticated)/credentials/${account.id}`)
                    }
                    style={[
                      styles.viewBtn,
                      { backgroundColor: colors.surfaceSubtle },
                    ]}
                  >
                    <Text style={[styles.viewBtnText, { color: colors.textSecondary }]}>
                      View
                    </Text>
                    <ArrowUpRight size={14} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {/* Audit Vulnerabilities Badges */}
                <View style={styles.issueBadgesContainer}>
                  {audit?.isReused && (
                    <View
                      style={[
                        styles.issueBadge,
                        {
                          backgroundColor: `${colors.warning}15`,
                          borderColor: `${colors.warning}40`,
                        },
                      ]}
                    >
                      <Layers size={13} color={colors.warning} />
                      <Text style={[styles.issueBadgeText, { color: colors.warning }]}>
                        Reused in {audit.reusedWithCount} accounts
                      </Text>
                    </View>
                  )}

                  {audit?.isWeak && (
                    <View
                      style={[
                        styles.issueBadge,
                        {
                          backgroundColor: `${colors.destructive}15`,
                          borderColor: `${colors.destructive}40`,
                        },
                      ]}
                    >
                      <AlertTriangle size={13} color={colors.destructive} />
                      <Text style={[styles.issueBadgeText, { color: colors.destructive }]}>
                        Weak ({audit.strengthResult.label} • {audit.strengthResult.entropyBits} bits)
                      </Text>
                    </View>
                  )}

                  {audit?.isOld && (
                    <View
                      style={[
                        styles.issueBadge,
                        {
                          backgroundColor: `${colors.secondary}15`,
                          borderColor: `${colors.secondary}40`,
                        },
                      ]}
                    >
                      <Clock size={13} color={colors.secondary} />
                      <Text style={[styles.issueBadgeText, { color: colors.secondary }]}>
                        Stagnant ({audit.daysOld} days old)
                      </Text>
                    </View>
                  )}

                  {isSafe && (
                    <View
                      style={[
                        styles.issueBadge,
                        {
                          backgroundColor: `${colors.success}15`,
                          borderColor: `${colors.success}40`,
                        },
                      ]}
                    >
                      <CheckCircle2 size={13} color={colors.success} />
                      <Text style={[styles.issueBadgeText, { color: colors.success }]}>
                        Strong & Unique
                      </Text>
                    </View>
                  )}
                </View>

                {/* Detailed Guidance & Suggestions */}
                {audit?.isWeak && audit.strengthResult.suggestions.length > 0 && (
                  <View
                    style={[
                      styles.suggestionBox,
                      { backgroundColor: colors.surfaceSubtle },
                    ]}
                  >
                    <Info size={13} color={colors.textMuted} style={styles.suggestionIcon} />
                    <Text style={[styles.suggestionText, { color: colors.textSecondary }]}>
                      {audit.strengthResult.suggestions[0]}
                    </Text>
                  </View>
                )}

                {/* Card Actions */}
                {!isSafe && (
                  <View
                    style={[
                      styles.cardActionsRow,
                      { borderTopColor: colors.surfaceBorder },
                    ]}
                  >
                    <TouchableOpacity
                      onPress={() =>
                        router.push({
                          pathname: '/(authenticated)/credentials/edit',
                          params: { id: account.id },
                        })
                      }
                      style={[
                        styles.fixActionBtn,
                        { backgroundColor: colors.primary },
                      ]}
                    >
                      <Key size={14} color="#FFFFFF" />
                      <Text style={styles.fixActionBtnText}>Change Password</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => router.push('/(authenticated)/generator')}
                      style={[
                        styles.secondaryActionBtn,
                        {
                          backgroundColor: colors.surfaceSubtle,
                          borderColor: colors.surfaceBorder,
                        },
                      ]}
                    >
                      <Sparkles size={14} color={colors.primary} />
                      <Text style={[styles.secondaryActionBtnText, { color: colors.primary }]}>
                        Generate
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}

        {/* Security Recommendations Tips */}
        <View
          style={[
            styles.tipsCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          <View style={styles.tipHeader}>
            <ShieldCheck size={20} color={colors.primary} />
            <Text style={[styles.tipTitle, { color: colors.text }]}>
              Vault Health Guidelines
            </Text>
          </View>
          <Text style={[styles.tipBullet, { color: colors.textSecondary }]}>
            • <Text style={{ fontWeight: typography.weights.bold, color: colors.text }}>Never Reuse Passwords:</Text> When one website is breached, attackers use automated credential stuffing to compromise other accounts.
          </Text>
          <Text style={[styles.tipBullet, { color: colors.textSecondary }]}>
            • <Text style={{ fontWeight: typography.weights.bold, color: colors.text }}>Aim for 16+ Characters:</Text> Use the built-in generator to create high-entropy passwords with letters, numbers, and symbols.
          </Text>
          <Text style={[styles.tipBullet, { color: colors.textSecondary }]}>
            • <Text style={{ fontWeight: typography.weights.bold, color: colors.text }}>Rotate Critical Accounts:</Text> Update financial and primary email passwords every 90 days.
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
  scoreCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
  },
  scoreHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  scoreInfo: {
    flex: 1,
    marginRight: 16,
  },
  scoreBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  gradeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  gradeBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    letterSpacing: 0.5,
  },
  statusLabelText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  scoreTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    marginBottom: 4,
  },
  scoreDescription: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.regular,
    lineHeight: 18,
  },
  scoreCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    lineHeight: 26,
  },
  scorePercentLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 14,
    borderTopWidth: 1,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricNumber: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricDivider: {
    width: 1,
    height: 24,
  },
  sectionHeading: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 8,
  },
  auditCardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  auditCategoryCard: {
    width: '48%',
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  auditCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  auditIconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countPillText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  auditCardTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    marginBottom: 2,
  },
  auditCardSub: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.regular,
  },
  filterTabsWrapper: {
    marginBottom: 16,
  },
  filterTabsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  reusedSection: {
    marginBottom: 20,
  },
  reusedGroupCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  reusedGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  reusedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reusedBadgeText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  quickGenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  quickGenBtnText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  reusedAccountsList: {
    marginTop: 2,
  },
  reusedAccountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  reusedAccountInfo: {
    flex: 1,
  },
  reusedAccountTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  reusedAccountSub: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.regular,
  },
  cleanCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  cleanIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cleanTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    marginBottom: 4,
    textAlign: 'center',
  },
  cleanSub: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.regular,
    textAlign: 'center',
    lineHeight: 18,
  },
  accountCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  accountCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  accountCardTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  accountAvatar: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  accountAvatarText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  accountTextContainer: {
    flex: 1,
  },
  accountTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
  accountUsername: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.regular,
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  viewBtnText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  issueBadgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  issueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  issueBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  suggestionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 10,
  },
  suggestionIcon: {
    marginRight: 6,
  },
  suggestionText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.regular,
    flex: 1,
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  fixActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  fixActionBtnText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  secondaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  secondaryActionBtnText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  tipsCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginTop: 10,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  tipTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  tipBullet: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.regular,
    lineHeight: 18,
    marginBottom: 6,
  },
});
