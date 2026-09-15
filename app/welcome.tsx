import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme/ThemeContext';
import { typography } from '@/theme/typography';
import { Button } from '@/components/ui/Button';
import { ShieldCheck, Lock, Key, Smartphone } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WelcomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Hero Icon */}
        <View style={[styles.iconContainer, { backgroundColor: colors.surfaceSubtle }]}>
          <ShieldCheck size={64} color={colors.primary} />
        </View>

        {/* Header Text */}
        <Text style={[styles.title, { color: colors.text }]}>
          Welcome to SecureVault
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Securely store your passwords, logins, and private accounts in one offline place.
        </Text>

        {/* Feature Highlights */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: colors.surfaceSubtle }]}>
              <Lock size={20} color={colors.primary} />
            </View>
            <View style={styles.featureText}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>Zero-Knowledge Encryption</Text>
              <Text style={[styles.featureDesc, { color: colors.textMuted }]}>
                AES-256-GCM & PBKDF2 keys derived only from your master password.
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: colors.surfaceSubtle }]}>
              <Smartphone size={20} color={colors.secondary} />
            </View>
            <View style={styles.featureText}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>100% Local & Offline</Text>
              <Text style={[styles.featureDesc, { color: colors.textMuted }]}>
                No remote servers, no tracking, and no cloud logins in V1.
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: colors.surfaceSubtle }]}>
              <Key size={20} color={colors.accent} />
            </View>
            <View style={styles.featureText}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>Biometric Quick Unlock</Text>
              <Text style={[styles.featureDesc, { color: colors.textMuted }]}>
                Face ID & Fingerprint support protected by platform Keystore.
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Action Footer */}
      <View style={styles.footer}>
        <Button
          title="Get Started"
          size="lg"
          onPress={() => router.push('/setup')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  content: {
    alignItems: 'center',
    marginTop: 20,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
  },
  title: {
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.extrabold,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: typography.sizes.base,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
    marginBottom: 36,
  },
  featuresContainer: {
    width: '100%',
    gap: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: typography.sizes.sm,
    lineHeight: 18,
  },
  footer: {
    width: '100%',
    marginBottom: 10,
  },
});
