export interface ThemeColors {
  background: string;
  surface: string;
  surfaceSubtle: string;
  surfaceBorder: string;
  surfaceHover: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryDark: string;
  primaryLight: string;
  primaryForeground: string;
  secondary: string;
  accent: string;
  destructive: string;
  destructiveSurface: string;
  success: string;
  successSurface: string;
  warning: string;
  warningSurface: string;
  card: string;
  cardBorder: string;
  inputBg: string;
  inputBorder: string;
  inputFocusBorder: string;
  tabBarBg: string;
  tabBarBorder: string;
  badgeBg: string;
}

export const darkTheme: ThemeColors = {
  background: '#090D16', // Rich deep slate
  surface: '#111827',
  surfaceSubtle: '#1E293B',
  surfaceBorder: '#334155',
  surfaceHover: '#1F293D',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  primary: '#6366F1', // Indigo accent
  primaryDark: '#4F46E5',
  primaryLight: '#818CF8',
  primaryForeground: '#FFFFFF',
  secondary: '#38BDF8', // Sky
  accent: '#10B981', // Emerald
  destructive: '#EF4444',
  destructiveSurface: '#451A1A',
  success: '#10B981',
  successSurface: '#064E3B',
  warning: '#F59E0B',
  warningSurface: '#452A0A',
  card: '#131C2E',
  cardBorder: '#1E293B',
  inputBg: '#0F172A',
  inputBorder: '#334155',
  inputFocusBorder: '#6366F1',
  tabBarBg: '#0F172A',
  tabBarBorder: '#1E293B',
  badgeBg: '#1E293B',
};

export const lightTheme: ThemeColors = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceSubtle: '#F1F5F9',
  surfaceBorder: '#E2E8F0',
  surfaceHover: '#F8FAFC',
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  primary: '#4F46E5', // Indigo
  primaryDark: '#4338CA',
  primaryLight: '#6366F1',
  primaryForeground: '#FFFFFF',
  secondary: '#0284C7',
  accent: '#059669',
  destructive: '#DC2626',
  destructiveSurface: '#FEE2E2',
  success: '#16A34A',
  successSurface: '#DCFCE7',
  warning: '#D97706',
  warningSurface: '#FEF3C7',
  card: '#FFFFFF',
  cardBorder: '#E2E8F0',
  inputBg: '#FFFFFF',
  inputBorder: '#CBD5E1',
  inputFocusBorder: '#4F46E5',
  tabBarBg: '#FFFFFF',
  tabBarBorder: '#E2E8F0',
  badgeBg: '#F1F5F9',
};
