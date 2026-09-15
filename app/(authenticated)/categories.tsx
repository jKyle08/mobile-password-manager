import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { typography } from '@/theme/typography';
import { useCategoryStore } from '@/store/category.store';
import { useVaultStore } from '@/store/vault.store';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { ConfirmationModal } from '@/components/ui/Modal';
import { CategoryIcon, getCategoryColor } from '@/components/CategoryIcon';
import {
  Plus,
  Trash2,
  Lock,
  Layers,
  Sparkles,
} from 'lucide-react-native';

const AVAILABLE_ICONS = [
  { id: 'folder', name: 'Folder' },
  { id: 'user', name: 'Personal' },
  { id: 'briefcase', name: 'Work' },
  { id: 'credit-card', name: 'Finance' },
  { id: 'message-circle', name: 'Social' },
  { id: 'code', name: 'Code' },
  { id: 'shopping-cart', name: 'Shopping' },
  { id: 'gamepad', name: 'Gaming' },
  { id: 'key', name: 'Keys' },
  { id: 'shield', name: 'Security' },
  { id: 'globe', name: 'Web' },
  { id: 'heart', name: 'Favorites' },
];

export default function CategoriesScreen() {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const { categories, addCategory, deleteCategory } = useCategoryStore();
  const { credentials } = useVaultStore();

  const [newCatName, setNewCatName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('folder');
  const [isAdding, setIsAdding] = useState(false);
  const [deletingCatId, setDeletingCatId] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!newCatName.trim()) {
      showToast('Category name cannot be empty', 'error');
      return;
    }
    try {
      setIsAdding(true);
      await addCategory(newCatName.trim(), selectedIcon);
      setNewCatName('');
      setSelectedIcon('folder');
      showToast('Category created', 'success');
    } catch (e) {
      showToast('Failed to create category', 'error');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCatId) return;
    try {
      await deleteCategory(deletingCatId);
      showToast('Category deleted', 'info');
    } catch (e) {
      showToast('Failed to delete category', 'error');
    } finally {
      setDeletingCatId(null);
    }
  };

  const getCredentialCountForCategory = (catId: string) => {
    return credentials.filter((c) => c.categoryId === catId).length;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Add New Category Box */}
      <View
        style={[
          styles.addSection,
          {
            backgroundColor: colors.card,
            borderColor: colors.cardBorder,
          },
        ]}
      >
        <View style={styles.addHeader}>
          <Layers size={16} color={colors.primary} />
          <Text style={[styles.addTitle, { color: colors.text }]}>
            Create New Category
          </Text>
        </View>

        <View style={styles.addInputRow}>
          <TextInput
            placeholder="Category Name (e.g. Crypto, Streaming)"
            placeholderTextColor={colors.textMuted}
            value={newCatName}
            onChangeText={setNewCatName}
            style={[
              styles.addInput,
              {
                backgroundColor: colors.inputBg,
                borderColor: colors.inputBorder,
                color: colors.text,
              },
            ]}
          />
          <Button
            title="Create"
            size="md"
            icon={<Plus size={16} color="#FFFFFF" />}
            loading={isAdding}
            disabled={!newCatName.trim() || isAdding}
            onPress={handleCreate}
          />
        </View>

        {/* Icon Selector Pills */}
        <View style={styles.iconPickerSection}>
          <Text style={[styles.iconPickerLabel, { color: colors.textSecondary }]}>
            Pick Icon:
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.iconScroll}
          >
            {AVAILABLE_ICONS.map((iconItem) => {
              const isSelected = selectedIcon === iconItem.id;
              const colorScheme = getCategoryColor(iconItem.id);

              return (
                <TouchableOpacity
                  key={iconItem.id}
                  activeOpacity={0.7}
                  onPress={() => setSelectedIcon(iconItem.id)}
                  style={[
                    styles.iconPill,
                    {
                      backgroundColor: isSelected ? colorScheme.bg : colors.surfaceSubtle,
                      borderColor: isSelected ? colorScheme.text : colors.surfaceBorder,
                    },
                  ]}
                >
                  <CategoryIcon
                    name={iconItem.id}
                    size={15}
                    color={isSelected ? colorScheme.text : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.iconPillText,
                      {
                        color: isSelected ? colorScheme.text : colors.textSecondary,
                        fontWeight: isSelected ? typography.weights.bold : typography.weights.medium,
                      },
                    ]}
                  >
                    {iconItem.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>

      {/* Categories Header */}
      <View style={styles.listHeaderRow}>
        <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
          ALL CATEGORIES ({categories.length})
        </Text>
      </View>

      {/* Categories List Cards */}
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const count = getCredentialCountForCategory(item.id);
          const colorScheme = getCategoryColor(item.icon || item.name);

          return (
            <View
              style={[
                styles.catCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              <View style={styles.catLeft}>
                <View
                  style={[
                    styles.catIconBox,
                    {
                      backgroundColor: colorScheme.bg,
                      borderColor: colorScheme.border,
                    },
                  ]}
                >
                  <CategoryIcon
                    name={item.icon || item.name}
                    size={20}
                    color={colorScheme.text}
                  />
                </View>

                <View style={styles.catInfo}>
                  <Text style={[styles.catName, { color: colors.text }]}>
                    {item.name}
                  </Text>
                  <View style={styles.countBadgeRow}>
                    <View style={[styles.countBadge, { backgroundColor: colors.surfaceSubtle }]}>
                      <Text style={[styles.countBadgeText, { color: colors.textSecondary }]}>
                        {count} {count === 1 ? 'account' : 'accounts'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.catRight}>
                {item.isDefault ? (
                  <View style={[styles.defaultBadge, { backgroundColor: colors.surfaceSubtle }]}>
                    <Lock size={12} color={colors.textMuted} style={{ marginRight: 4 }} />
                    <Text style={[styles.defaultText, { color: colors.textMuted }]}>
                      Default
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => setDeletingCatId(item.id)}
                    style={[styles.trashBtn, { backgroundColor: colors.destructiveSurface }]}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Trash2 size={16} color={colors.destructive} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        visible={deletingCatId !== null}
        title="Delete Category?"
        message="This category will be deleted. Any accounts in this category will become unassigned."
        confirmLabel="Delete"
        isDestructive
        onConfirm={handleDelete}
        onCancel={() => setDeletingCatId(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  addSection: {
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1.2,
    gap: 12,
  },
  addHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  addInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  addInput: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: typography.sizes.sm,
  },
  iconPickerSection: {
    gap: 8,
  },
  iconPickerLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  iconScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 4,
  },
  iconPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1.2,
    gap: 6,
  },
  iconPillText: {
    fontSize: typography.sizes.xs,
  },
  listHeaderRow: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionHeading: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.5,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 10,
  },
  catCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.2,
  },
  catLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  catIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catInfo: {
    gap: 4,
  },
  catName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
  countBadgeRow: {
    flexDirection: 'row',
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  countBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  catRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  defaultText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  trashBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
