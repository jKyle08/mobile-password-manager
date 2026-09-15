import React, { useState, useEffect, useMemo } from 'react';
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
import { PasswordGenerator, PasswordGeneratorOptions } from '@/features/generator/password-generator';
import { PasswordStrengthService } from '@/security/password-strength';
import { StrengthMeter } from '@/components/StrengthMeter';
import { Button } from '@/components/ui/Button';
import { ClipboardService } from '@/security/clipboard.service';
import { useToast } from '@/components/ui/Toast';
import { RotateCw, Copy, Check, CheckSquare, Square, Plus } from 'lucide-react-native';

export default function GeneratorScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { showToast } = useToast();

  const [length, setLength] = useState(20);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);

  const [generatedPassword, setGeneratedPassword] = useState('');
  const [copied, setCopied] = useState(false);

  const generate = () => {
    const pwd = PasswordGenerator.generate({
      length,
      includeUppercase,
      includeLowercase,
      includeNumbers,
      includeSymbols,
    });
    setGeneratedPassword(pwd);
  };

  useEffect(() => {
    generate();
  }, [length, includeUppercase, includeLowercase, includeNumbers, includeSymbols]);

  const strength = useMemo(() => {
    return PasswordStrengthService.evaluate(generatedPassword);
  }, [generatedPassword]);

  const handleCopy = async () => {
    if (!generatedPassword) return;
    const ok = await ClipboardService.copyWithAutoClear(generatedPassword, 30);
    if (ok) {
      setCopied(true);
      showToast('Password copied to clipboard (clears in 30s)', 'success');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Output Display Card */}
        <View style={[styles.passwordCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.passwordText, { color: colors.text }]} selectable>
            {generatedPassword}
          </Text>

          <View style={styles.cardActions}>
            <TouchableOpacity
              onPress={generate}
              style={[styles.actionBtn, { backgroundColor: colors.surfaceSubtle }]}
              accessibilityLabel="Regenerate"
            >
              <RotateCw size={18} color={colors.primary} />
              <Text style={[styles.actionBtnText, { color: colors.primary }]}>Regenerate</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleCopy}
              style={[styles.actionBtn, { backgroundColor: colors.surfaceSubtle }]}
              accessibilityLabel="Copy Password"
            >
              {copied ? (
                <>
                  <Check size={18} color={colors.success} />
                  <Text style={[styles.actionBtnText, { color: colors.success }]}>Copied</Text>
                </>
              ) : (
                <>
                  <Copy size={18} color={colors.textSecondary} />
                  <Text style={[styles.actionBtnText, { color: colors.textSecondary }]}>Copy</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Strength Meter */}
        <StrengthMeter strength={strength} showSuggestions={false} />

        {/* Length Controls */}
        <View style={[styles.controlCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.controlHeader}>
            <Text style={[styles.controlTitle, { color: colors.text }]}>Length: {length}</Text>
          </View>

          <View style={styles.lengthButtonsRow}>
            {[12, 16, 20, 24, 32, 48].map((len) => (
              <TouchableOpacity
                key={len}
                onPress={() => setLength(len)}
                style={[
                  styles.lenPill,
                  {
                    backgroundColor: length === len ? colors.primary : colors.surfaceSubtle,
                    borderColor: length === len ? colors.primary : colors.surfaceBorder,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.lenPillText,
                    { color: length === len ? '#FFFFFF' : colors.textSecondary },
                  ]}
                >
                  {len}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Character Set Toggles */}
        <View style={[styles.controlCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.controlTitle, { color: colors.text, marginBottom: 12 }]}>
            Character Types
          </Text>

          {/* Uppercase */}
          <TouchableOpacity
            style={styles.toggleRow}
            onPress={() => setIncludeUppercase(!includeUppercase)}
          >
            <View style={styles.toggleLeft}>
              {includeUppercase ? (
                <CheckSquare size={20} color={colors.primary} />
              ) : (
                <Square size={20} color={colors.textMuted} />
              )}
              <Text style={[styles.toggleLabel, { color: colors.text }]}>Uppercase Letters</Text>
            </View>
            <Text style={[styles.sampleText, { color: colors.textMuted }]}>A-Z</Text>
          </TouchableOpacity>

          {/* Lowercase */}
          <TouchableOpacity
            style={styles.toggleRow}
            onPress={() => setIncludeLowercase(!includeLowercase)}
          >
            <View style={styles.toggleLeft}>
              {includeLowercase ? (
                <CheckSquare size={20} color={colors.primary} />
              ) : (
                <Square size={20} color={colors.textMuted} />
              )}
              <Text style={[styles.toggleLabel, { color: colors.text }]}>Lowercase Letters</Text>
            </View>
            <Text style={[styles.sampleText, { color: colors.textMuted }]}>a-z</Text>
          </TouchableOpacity>

          {/* Numbers */}
          <TouchableOpacity
            style={styles.toggleRow}
            onPress={() => setIncludeNumbers(!includeNumbers)}
          >
            <View style={styles.toggleLeft}>
              {includeNumbers ? (
                <CheckSquare size={20} color={colors.primary} />
              ) : (
                <Square size={20} color={colors.textMuted} />
              )}
              <Text style={[styles.toggleLabel, { color: colors.text }]}>Numbers</Text>
            </View>
            <Text style={[styles.sampleText, { color: colors.textMuted }]}>0-9</Text>
          </TouchableOpacity>

          {/* Symbols */}
          <TouchableOpacity
            style={styles.toggleRow}
            onPress={() => setIncludeSymbols(!includeSymbols)}
          >
            <View style={styles.toggleLeft}>
              {includeSymbols ? (
                <CheckSquare size={20} color={colors.primary} />
              ) : (
                <Square size={20} color={colors.textMuted} />
              )}
              <Text style={[styles.toggleLabel, { color: colors.text }]}>Special Symbols</Text>
            </View>
            <Text style={[styles.sampleText, { color: colors.textMuted }]}>!@#$%^&*</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.surfaceBorder }]}>
        <Button
          title="Create Account with this Password"
          size="lg"
          icon={<Plus size={18} color="#FFFFFF" />}
          onPress={() => {
            handleCopy();
            router.push('/(authenticated)/credentials/add');
          }}
        />
      </View>
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
  passwordCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 8,
  },
  passwordText: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 16,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 6,
  },
  actionBtnText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  controlCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 14,
  },
  controlHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  controlTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },
  lengthButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  lenPill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
  },
  lenPillText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  toggleLabel: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
  },
  sampleText: {
    fontSize: typography.sizes.sm,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
});
