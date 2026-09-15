import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Linking,
} from 'react-native';
import { Credential } from '@/models/credential.model';
import { useTheme } from '@/theme/ThemeContext';
import { typography } from '@/theme/typography';
import { useSettingsStore } from '@/store/settings.store';
import { ClipboardService } from '@/security/clipboard.service';
import { BiometricsService } from '@/security/biometrics.service';
import { useToast } from './ui/Toast';
import {
  Globe,
  ExternalLink,
  Copy,
  Check,
  User,
  Key,
  ShieldCheck,
  X,
  Sparkles,
  ArrowRight,
  Layers,
  ChevronRight,
} from 'lucide-react-native';

interface AutoFillModalProps {
  visible: boolean;
  credential: Credential | null;
  allCredentials: Credential[];
  onClose: () => void;
  onSelectAccount?: (credential: Credential) => void;
}

export const AutoFillModal: React.FC<AutoFillModalProps> = ({
  visible,
  credential,
  allCredentials,
  onClose,
}) => {
  const { colors } = useTheme();
  const { settings } = useSettingsStore();
  const { showToast } = useToast();

  const [selectedCred, setSelectedCred] = useState<Credential | null>(credential);
  const [copiedState, setCopiedState] = useState<'username' | 'password' | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Sync selected credential when modal opens
  React.useEffect(() => {
    if (credential) {
      setSelectedCred(credential);
      setCopiedState(null);
    }
  }, [credential, visible]);

  const activeCred = selectedCred || credential;

  // Find all accounts that match the same website domain or title
  const matchingAccounts = useMemo(() => {
    if (!activeCred) return [];
    const targetUrl = (activeCred.website || '').toLowerCase().trim();
    const targetTitle = activeCred.title.toLowerCase().trim();

    return allCredentials.filter((c) => {
      if (c.id === activeCred.id) return true;
      const cUrl = (c.website || '').toLowerCase().trim();
      const cTitle = c.title.toLowerCase().trim();

      if (targetUrl && cUrl && (targetUrl.includes(cUrl) || cUrl.includes(targetUrl))) {
        return true;
      }
      return cTitle === targetTitle;
    });
  }, [activeCred, allCredentials]);

  if (!activeCred) return null;

  const cleanUrl = (url: string) => {
    let u = url.trim();
    if (!u.startsWith('http://') && !u.startsWith('https://')) {
      u = 'https://' + u;
    }
    return u;
  };

  const getDomainDisplayName = (url?: string) => {
    if (!url) return activeCred.title;
    try {
      const parsed = cleanUrl(url);
      const host = new URL(parsed).hostname.replace(/^www\./, '');
      return host || activeCred.title;
    } catch {
      return activeCred.title;
    }
  };

  const handleLaunchAndFill = async () => {
    if (!activeCred.website) {
      showToast('No website URL saved for this account', 'error');
      return;
    }

    // Biometric check if biometric lock is enabled
    if (settings.biometricEnabled) {
      setIsAuthenticating(true);
      const isAuth = await BiometricsService.authenticate(
        `Authenticate to log into ${activeCred.title}`
      );
      setIsAuthenticating(false);
      if (!isAuth) {
        showToast('Biometric authentication failed', 'error');
        return;
      }
    }

    // Copy username first if available, else copy password
    const textToCopy = activeCred.username || activeCred.password;
    const label = activeCred.username ? 'Username' : 'Password';

    if (textToCopy) {
      await ClipboardService.copyWithAutoClear(
        textToCopy,
        settings.clipboardTimeoutSeconds || 30
      );
      showToast(
        `${label} copied! Opening ${getDomainDisplayName(activeCred.website)}...`,
        'success'
      );
    }

    const url = cleanUrl(activeCred.website);
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        onClose();
      } else {
        showToast('Could not open link', 'error');
      }
    } catch {
      showToast('Invalid website URL', 'error');
    }
  };

  const handleCopyField = async (type: 'username' | 'password') => {
    const text = type === 'username' ? activeCred.username : activeCred.password;
    if (!text) return;

    if (type === 'password' && settings.biometricEnabled) {
      setIsAuthenticating(true);
      const isAuth = await BiometricsService.authenticate('Authenticate to copy password');
      setIsAuthenticating(false);
      if (!isAuth) return;
    }

    await ClipboardService.copyWithAutoClear(
      text,
      settings.clipboardTimeoutSeconds || 30
    );
    setCopiedState(type);
    showToast(
      `${type === 'username' ? 'Username' : 'Password'} copied (clears in ${
        settings.clipboardTimeoutSeconds || 30
      }s)`,
      'success'
    );
    setTimeout(() => setCopiedState(null), 2500);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={onClose}
          style={styles.backdropTouch}
        />

        <View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          {/* Sheet Header */}
          <View style={[styles.sheetHeader, { borderBottomColor: colors.surfaceBorder }]}>
            <View style={styles.headerLeft}>
              <View
                style={[
                  styles.serviceAvatar,
                  { backgroundColor: `${colors.primary}20` },
                ]}
              >
                <Globe size={22} color={colors.primary} />
              </View>
              <View style={styles.headerTitles}>
                <Text style={[styles.serviceTitle, { color: colors.text }]}>
                  {activeCred.title}
                </Text>
                <Text style={[styles.serviceSubtitle, { color: colors.textMuted }]}>
                  {getDomainDisplayName(activeCred.website)}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: colors.surfaceSubtle }]}
            >
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.sheetContent}>
            {/* Multi-Account Selector (if > 1 matching account) */}
            {matchingAccounts.length > 1 && (
              <View style={styles.multiAccountSection}>
                <View style={styles.multiAccountHeader}>
                  <Layers size={14} color={colors.primary} />
                  <Text style={[styles.multiAccountHeading, { color: colors.textSecondary }]}>
                    SELECT ACCOUNT ({matchingAccounts.length} SAVED)
                  </Text>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.accountPillsContainer}
                >
                  {matchingAccounts.map((acc) => {
                    const isSelected = acc.id === activeCred.id;
                    return (
                      <TouchableOpacity
                        key={acc.id}
                        onPress={() => setSelectedCred(acc)}
                        style={[
                          styles.accountPill,
                          {
                            backgroundColor: isSelected
                              ? `${colors.primary}20`
                              : colors.surfaceSubtle,
                            borderColor: isSelected
                              ? colors.primary
                              : colors.surfaceBorder,
                          },
                        ]}
                      >
                        <User
                          size={12}
                          color={isSelected ? colors.primary : colors.textSecondary}
                        />
                        <Text
                          style={[
                            styles.accountPillText,
                            {
                              color: isSelected
                                ? colors.primary
                                : colors.textSecondary,
                              fontWeight: isSelected
                                ? typography.weights.bold
                                : typography.weights.medium,
                            },
                          ]}
                        >
                          {acc.username || acc.title}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Active Account Overview Card */}
            <View
              style={[
                styles.accountCard,
                {
                  backgroundColor: colors.surfaceSubtle,
                  borderColor: colors.surfaceBorder,
                },
              ]}
            >
              {/* Username Field */}
              <View style={styles.credRow}>
                <View style={styles.credInfo}>
                  <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>
                    USERNAME / EMAIL
                  </Text>
                  <Text style={[styles.fieldValue, { color: colors.text }]} numberOfLines={1}>
                    {activeCred.username || 'No username saved'}
                  </Text>
                </View>
                {activeCred.username && (
                  <TouchableOpacity
                    onPress={() => handleCopyField('username')}
                    style={[
                      styles.copyBtn,
                      {
                        backgroundColor:
                          copiedState === 'username'
                            ? `${colors.success}20`
                            : colors.card,
                      },
                    ]}
                  >
                    {copiedState === 'username' ? (
                      <Check size={14} color={colors.success} />
                    ) : (
                      <Copy size={14} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                )}
              </View>

              {/* Password Field */}
              <View style={[styles.credRow, { borderTopColor: colors.surfaceBorder }]}>
                <View style={styles.credInfo}>
                  <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>
                    PASSWORD
                  </Text>
                  <Text style={[styles.maskedPasswordText, { color: colors.textMuted }]}>
                    ••••••••••••••••
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleCopyField('password')}
                  style={[
                    styles.copyBtn,
                    {
                      backgroundColor:
                        copiedState === 'password'
                          ? `${colors.success}20`
                          : colors.card,
                    },
                  ]}
                >
                  {copiedState === 'password' ? (
                    <Check size={14} color={colors.success} />
                  ) : (
                    <Copy size={14} color={colors.primary} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Primary Action: Launch & Auto-Fill */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleLaunchAndFill}
              disabled={isAuthenticating}
              style={[
                styles.launchActionBtn,
                { backgroundColor: colors.primary },
              ]}
            >
              <ExternalLink size={18} color="#FFFFFF" />
              <Text style={styles.launchActionBtnText}>
                Launch & Log in to {activeCred.title}
              </Text>
            </TouchableOpacity>

            {/* Security Guarantee Note */}
            <View style={styles.securityNoteRow}>
              <ShieldCheck size={14} color={colors.success} />
              <Text style={[styles.securityNoteText, { color: colors.textMuted }]}>
                Protected by 256-bit encryption • Clipboard auto-clears in 30s
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  backdropTouch: {
    flex: 1,
  },
  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    maxHeight: '80%',
    paddingBottom: 24,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  serviceAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitles: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  serviceSubtitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.regular,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetContent: {
    padding: 20,
  },
  multiAccountSection: {
    marginBottom: 16,
  },
  multiAccountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  multiAccountHeading: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    letterSpacing: 0.5,
  },
  accountPillsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  accountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  accountPillText: {
    fontSize: typography.sizes.xs,
  },
  accountCard: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    marginBottom: 18,
  },
  credRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  credInfo: {
    flex: 1,
    marginRight: 10,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: typography.weights.semibold,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  maskedPasswordText: {
    fontSize: typography.sizes.sm,
    letterSpacing: 2,
  },
  copyBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  launchActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 14,
  },
  launchActionBtnText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },
  securityNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  securityNoteText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.regular,
  },
});
