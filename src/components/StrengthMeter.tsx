import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { typography } from '@/theme/typography';
import { PasswordStrengthResult } from '@/security/password-strength';

interface StrengthMeterProps {
  strength: PasswordStrengthResult;
  showSuggestions?: boolean;
}

export const StrengthMeter: React.FC<StrengthMeterProps> = ({
  strength,
  showSuggestions = true,
}) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          Password Strength:
        </Text>
        <Text style={[styles.strengthLabel, { color: strength.color }]}>
          {strength.label} {strength.entropyBits > 0 ? `(~${strength.entropyBits} bits)` : ''}
        </Text>
      </View>

      {/* Multi-segment Progress Bar */}
      <View style={styles.barContainer}>
        {[0, 1, 2, 3, 4].map((step) => {
          const isActive = step <= strength.score;
          return (
            <View
              key={step}
              style={[
                styles.segment,
                {
                  backgroundColor: isActive
                    ? strength.color
                    : colors.surfaceSubtle,
                },
              ]}
            />
          );
        })}
      </View>

      {showSuggestions && strength.suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          {strength.suggestions.map((item, idx) => (
            <Text key={idx} style={[styles.suggestionText, { color: colors.textMuted }]}>
              • {item}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  strengthLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  barContainer: {
    flexDirection: 'row',
    gap: 6,
    height: 6,
    width: '100%',
  },
  segment: {
    flex: 1,
    borderRadius: 3,
  },
  suggestionsContainer: {
    marginTop: 8,
    gap: 2,
  },
  suggestionText: {
    fontSize: typography.sizes.xs,
  },
});
