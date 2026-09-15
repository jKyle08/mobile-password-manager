import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/theme/ThemeContext';
import { typography } from '@/theme/typography';
import { Input } from '@/components/ui/Input';
import { PasswordField } from '@/components/PasswordField';
import { WebsiteSuggestInput } from '@/components/WebsiteSuggestInput';
import { CategorySelectBox } from '@/components/CategorySelectBox';
import { PopularWebsite } from '@/data/popular-websites';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/auth.store';
import { useVaultStore } from '@/store/vault.store';
import { useCategoryStore } from '@/store/category.store';
import { useToast } from '@/components/ui/Toast';
import { PasswordGenerator } from '@/features/generator/password-generator';
import { Sparkles, Star } from 'lucide-react-native';

export default function EditCredentialScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const { sessionKey } = useAuthStore();
  const { credentials, updateCredential } = useVaultStore();
  const { categories } = useCategoryStore();

  const credential = credentials.find((c) => c.id === id);

  const [title, setTitle] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [website, setWebsite] = useState('');
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [favorite, setFavorite] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; password?: string }>({});

  useEffect(() => {
    if (credential) {
      setTitle(credential.title);
      setUsername(credential.username || '');
      setPassword(credential.password);
      setWebsite(credential.website || '');
      setCategoryIds(
        credential.categoryIds && credential.categoryIds.length > 0
          ? credential.categoryIds
          : credential.categoryId
          ? [credential.categoryId]
          : []
      );
      setNotes(credential.notes || '');
      setFavorite(credential.favorite);
    }
  }, [credential]);

  if (!credential) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFoundText, { color: colors.textMuted }]}>
          Account not found
        </Text>
        <Button title="Go Back" variant="outline" onPress={() => router.back()} />
      </View>
    );
  }

  const handleGeneratePassword = () => {
    const generated = PasswordGenerator.generate({ length: 20 });
    setPassword(generated);
    showToast('New strong password generated', 'info');
  };

  const handleSelectWebsite = (site: PopularWebsite) => {
    // If title is currently empty, suggest name
    if (!title.trim()) {
      setTitle(site.name.split(' / ')[0]);
      if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
    }
    // If category is not set, set according to site hint
    if (categoryIds.length === 0 && site.categoryHint) {
      const match = categories.find((c) => c.id === site.categoryHint);
      if (match) {
        setCategoryIds([match.id]);
      }
    }
    showToast(`Selected ${site.name}`, 'info');
  };

  const validate = () => {
    const newErrors: { title?: string; password?: string } = {};
    if (!title.trim()) {
      newErrors.title = 'Account name is required';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    if (!sessionKey) {
      showToast('Vault session expired. Please unlock again.', 'error');
      router.replace('/unlock');
      return;
    }

    try {
      setIsSubmitting(true);
      await updateCredential(
        id!,
        {
          title: title.trim(),
          username: username.trim() || undefined,
          password,
          website: website.trim() || undefined,
          categoryId: categoryIds[0] || undefined,
          categoryIds: categoryIds.length > 0 ? categoryIds : undefined,
          notes: notes.trim() || undefined,
          favorite,
        },
        sessionKey
      );

      showToast('Account updated successfully', 'success');
      router.back();
    } catch (e: any) {
      showToast('Failed to update account. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Favorite Header */}
        <View style={styles.topRow}>
          <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
            EDIT CREDENTIAL
          </Text>
          <TouchableOpacity
            onPress={() => setFavorite(!favorite)}
            style={[
              styles.favBtn,
              {
                backgroundColor: favorite ? colors.warningSurface : colors.surfaceSubtle,
                borderColor: favorite ? colors.warning : colors.surfaceBorder,
              },
            ]}
          >
            <Star
              size={16}
              color={favorite ? colors.warning : colors.textMuted}
              fill={favorite ? colors.warning : 'transparent'}
            />
            <Text
              style={[
                styles.favBtnText,
                { color: favorite ? colors.warning : colors.textSecondary },
              ]}
            >
              {favorite ? 'Favorite' : 'Mark Favorite'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Account Name */}
        <Input
          label="Account Name *"
          value={title}
          onChangeText={(text) => {
            setTitle(text);
            if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
          }}
          error={errors.title}
        />

        {/* Username / Email */}
        <Input
          label="Username / Email"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />

        {/* Password */}
        <PasswordField
          label="Password *"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
          }}
          error={errors.password}
          onGeneratePress={handleGeneratePassword}
        />

        {/* Quick Generate Password Bar */}
        <TouchableOpacity
          onPress={handleGeneratePassword}
          style={[styles.generateBar, { backgroundColor: colors.surfaceSubtle, borderColor: colors.surfaceBorder }]}
        >
          <Sparkles size={16} color={colors.primary} />
          <Text style={[styles.generateBarText, { color: colors.primary }]}>
            Regenerate Strong Password
          </Text>
        </TouchableOpacity>

        {/* Website with Suggestions */}
        <WebsiteSuggestInput
          label="Website URL"
          value={website}
          onChangeText={setWebsite}
          onSelectSuggestion={handleSelectWebsite}
        />

        {/* Category Selection Box */}
        <CategorySelectBox
          categories={categories}
          selectedIds={categoryIds}
          onSelectIds={setCategoryIds}
        />

        {/* Notes */}
        <Input
          label="Notes"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          style={{ minHeight: 80, textAlignVertical: 'top' }}
        />
      </ScrollView>

      {/* Action Footer */}
      <View style={[styles.footer, { borderTopColor: colors.surfaceBorder }]}>
        <Button
          title="Save Changes"
          size="lg"
          loading={isSubmitting}
          onPress={handleSave}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notFoundText: {
    fontSize: typography.sizes.base,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    letterSpacing: 1,
  },
  favBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  favBtnText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  generateBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: -8,
    marginBottom: 16,
    gap: 6,
  },
  generateBarText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  fieldWrapper: {
    marginBottom: 16,
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    marginBottom: 6,
  },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.2,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  dropdown: {
    marginTop: 6,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 6,
    elevation: 4,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
});
