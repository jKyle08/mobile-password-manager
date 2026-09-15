import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { typography } from '@/theme/typography';
import { ThemeMode } from '@/models/settings.model';
import { Moon, Sun, Smartphone, Check } from 'lucide-react-native';

const THEME_OPTIONS: { mode: ThemeMode; label: string; desc: string; icon: any }[] = [
  {
    mode: 'system',
    label: 'System Default',
    desc: 'Match your operating system appearance',
    icon: Smartphone,
  },
  {
    mode: 'dark',
    label: 'Dark Theme',
    desc: 'Sleek dark mode tailored for low-light environments',
    icon: Moon,
  },
  {
    mode: 'light',
    label: 'Light Theme',
    desc: 'Clean, high-contrast bright mode',
    icon: Sun,
  },
];

export default function AppearanceScreen() {
  const { colors, themeMode, setThemeMode } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
        COLOR THEME
      </Text>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        {THEME_OPTIONS.map((item, index) => {
          const isSelected = themeMode === item.mode;
          const isLast = index === THEME_OPTIONS.length - 1;
          const Icon = item.icon;

          return (
            <TouchableOpacity
              key={item.mode}
              activeOpacity={0.7}
              onPress={() => setThemeMode(item.mode)}
              style={[
                styles.row,
                !isLast && { borderBottomWidth: 1, borderBottomColor: colors.surfaceBorder },
              ]}
            >
              <View style={styles.rowLeft}>
                <View
                  style={[
                    styles.iconBox,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.surfaceSubtle,
                    },
                  ]}
                >
                  <Icon
                    size={20}
                    color={isSelected ? '#FFFFFF' : colors.textSecondary}
                  />
                </View>
                <View>
                  <Text
                    style={[
                      styles.rowTitle,
                      {
                        color: colors.text,
                        fontWeight: isSelected ? typography.weights.bold : typography.weights.semibold,
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                  <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>
                    {item.desc}
                  </Text>
                </View>
              </View>

              {isSelected && <Check size={20} color={colors.primary} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  sectionHeader: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    letterSpacing: 1,
    marginTop: 10,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: {
    fontSize: typography.sizes.base,
  },
  rowSubtitle: {
    fontSize: typography.sizes.xs,
    marginTop: 2,
    maxWidth: 240,
  },
});
