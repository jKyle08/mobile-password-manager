import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Input } from './ui/Input';
import { useTheme } from '@/theme/ThemeContext';
import { Eye, EyeOff, Sparkles, Copy, Check } from 'lucide-react-native';
import { ClipboardService } from '@/security/clipboard.service';
import { useToast } from './ui/Toast';

interface PasswordFieldProps {
  value: string;
  onChangeText?: (text: string) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  editable?: boolean;
  onGeneratePress?: () => void;
  autoHideSeconds?: number;
}

export const PasswordField: React.FC<PasswordFieldProps> = ({
  value,
  onChangeText,
  label = 'Password',
  placeholder = 'Enter password',
  error,
  editable = true,
  onGeneratePress,
  autoHideSeconds = 10,
}) => {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const [isSecure, setIsSecure] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (!isSecure && autoHideSeconds > 0) {
      timer = setTimeout(() => {
        setIsSecure(true);
      }, autoHideSeconds * 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isSecure, autoHideSeconds]);

  const handleCopy = async () => {
    if (!value) return;
    const ok = await ClipboardService.copyWithAutoClear(value, 30);
    if (ok) {
      setCopied(true);
      showToast('Password copied to clipboard (clears in 30s)', 'success');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const toggleSecure = () => {
    setIsSecure(!isSecure);
  };

  return (
    <View style={styles.container}>
      <Input
        label={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={isSecure}
        error={error}
        editable={editable}
        autoCapitalize="none"
        autoCorrect={false}
        rightIcon={
          <View style={styles.actionRow}>
            {onGeneratePress && (
              <TouchableOpacity
                onPress={onGeneratePress}
                style={styles.iconBtn}
                activeOpacity={0.7}
                accessibilityLabel="Generate strong password"
              >
                <Sparkles size={18} color={colors.primary} />
              </TouchableOpacity>
            )}
            {value ? (
              <TouchableOpacity
                onPress={handleCopy}
                style={styles.iconBtn}
                activeOpacity={0.7}
                accessibilityLabel="Copy password"
              >
                {copied ? (
                  <Check size={18} color={colors.success} />
                ) : (
                  <Copy size={18} color={colors.textSecondary} />
                )}
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              onPress={toggleSecure}
              style={styles.iconBtn}
              activeOpacity={0.7}
              accessibilityLabel={isSecure ? 'Show password' : 'Hide password'}
            >
              {isSecure ? (
                <Eye size={18} color={colors.textSecondary} />
              ) : (
                <EyeOff size={18} color={colors.primary} />
              )}
            </TouchableOpacity>
          </View>
        }
      />
      {!isSecure && autoHideSeconds > 0 && (
        <Text style={[styles.autoHideHint, { color: colors.warning }]}>
          Password visible (will auto-hide in {autoHideSeconds}s)
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconBtn: {
    padding: 6,
  },
  autoHideHint: {
    fontSize: 11,
    marginTop: -10,
    marginBottom: 10,
  },
});
