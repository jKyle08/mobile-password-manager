import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Category } from '@/models/category.model';
import { useTheme } from '@/theme/ThemeContext';
import { typography } from '@/theme/typography';
import { CategoryIcon, getCategoryColor } from './CategoryIcon';
import { Check, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';

interface CategorySelectBoxProps {
  categories: Category[];
  selectedId?: string;
  selectedIds?: string[];
  onSelect?: (categoryId: string | undefined) => void;
  onSelectIds?: (categoryIds: string[]) => void;
  label?: string;
}

export const CategorySelectBox: React.FC<CategorySelectBoxProps> = ({
  categories,
  selectedId,
  selectedIds,
  onSelect,
  onSelectIds,
  label = 'Category (Multi-Select)',
}) => {
  const { colors } = useTheme();
  const router = useRouter();

  // Normalize selected IDs
  const activeIds: string[] = useMemo(() => {
    if (selectedIds) return selectedIds;
    if (selectedId) return [selectedId];
    return [];
  }, [selectedIds, selectedId]);

  const handleToggleCategory = (catId: string) => {
    let nextIds: string[];
    if (activeIds.includes(catId)) {
      nextIds = activeIds.filter((id) => id !== catId);
    } else {
      nextIds = [...activeIds, catId];
    }

    if (onSelectIds) {
      onSelectIds(nextIds);
    }
    if (onSelect) {
      onSelect(nextIds[0] || undefined);
    }
  };

  const handleClearAll = () => {
    if (onSelectIds) {
      onSelectIds([]);
    }
    if (onSelect) {
      onSelect(undefined);
    }
  };

  // Selected names preview
  const selectedCategories = categories.filter((c) => activeIds.includes(c.id));
  const badgeLabel = useMemo(() => {
    if (selectedCategories.length === 0) return null;
    if (selectedCategories.length === 1) return selectedCategories[0].name;
    if (selectedCategories.length === 2) return `${selectedCategories[0].name}, ${selectedCategories[1].name}`;
    return `${selectedCategories[0].name} +${selectedCategories.length - 1}`;
  }, [selectedCategories]);

  return (
    <View style={styles.wrapper}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
          {badgeLabel && (
            <View style={[styles.selectedBadge, { backgroundColor: colors.surfaceSubtle }]}>
              <Text style={[styles.selectedBadgeText, { color: colors.primary }]}>
                {badgeLabel}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.headerActions}>
          {activeIds.length > 0 && (
            <TouchableOpacity
              onPress={handleClearAll}
              style={[styles.clearBtn, { backgroundColor: colors.surfaceSubtle }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={12} color={colors.textMuted} />
              <Text style={[styles.clearBtnText, { color: colors.textMuted }]}>Clear</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => router.push('/(authenticated)/categories')}
            style={styles.manageBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.manageBtnText, { color: colors.primary }]}>+ Manage</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Categories Box Grid / Scroll */}
      <View
        style={[
          styles.boxContainer,
          {
            backgroundColor: colors.inputBg,
            borderColor: activeIds.length > 0 ? colors.primary : colors.inputBorder,
          },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.scroll}
          contentContainerStyle={styles.scrollList}
          keyboardShouldPersistTaps="handled"
        >
          {/* None / Clear Option */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleClearAll}
            style={[
              styles.categoryCard,
              {
                backgroundColor: activeIds.length === 0 ? colors.surfaceHover : colors.surface,
                borderColor: activeIds.length === 0 ? colors.primary : colors.surfaceBorder,
              },
            ]}
          >
            <View style={[styles.iconWrapper, { backgroundColor: colors.surfaceSubtle }]}>
              <X size={16} color={colors.textMuted} />
            </View>
            <Text
              style={[
                styles.categoryName,
                {
                  color: activeIds.length === 0 ? colors.primary : colors.textMuted,
                  fontWeight: activeIds.length === 0 ? typography.weights.bold : typography.weights.medium,
                },
              ]}
              numberOfLines={1}
            >
              None
            </Text>
            {activeIds.length === 0 && (
              <View style={[styles.activeDot, { backgroundColor: colors.primary }]} />
            )}
          </TouchableOpacity>

          {/* All Categories */}
          {categories.map((cat) => {
            const isSelected = activeIds.includes(cat.id);
            const colorScheme = getCategoryColor(cat.icon || cat.name);

            return (
              <TouchableOpacity
                key={cat.id}
                activeOpacity={0.7}
                onPress={() => handleToggleCategory(cat.id)}
                style={[
                  styles.categoryCard,
                  {
                    backgroundColor: isSelected ? colors.surfaceHover : colors.surface,
                    borderColor: isSelected ? colorScheme.text : colors.surfaceBorder,
                  },
                ]}
              >
                {/* Icon with specific tint */}
                <View
                  style={[
                    styles.iconWrapper,
                    { backgroundColor: colorScheme.bg },
                  ]}
                >
                  <CategoryIcon
                    name={cat.icon || cat.name}
                    size={16}
                    color={colorScheme.text}
                  />
                </View>

                {/* Name */}
                <Text
                  style={[
                    styles.categoryName,
                    {
                      color: isSelected ? colors.text : colors.textSecondary,
                      fontWeight: isSelected ? typography.weights.bold : typography.weights.medium,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {cat.name}
                </Text>

                {/* Checkmark Indicator */}
                {isSelected && (
                  <View style={[styles.checkBadge, { backgroundColor: colorScheme.text }]}>
                    <Check size={10} color="#FFFFFF" strokeWidth={3} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  selectedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  selectedBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  clearBtnText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  manageBtn: {
    paddingVertical: 2,
  },
  manageBtnText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  boxContainer: {
    borderWidth: 1.2,
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  scroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  scrollList: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 2,
    flexGrow: 0,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1.2,
    minWidth: 88,
    gap: 7,
  },
  iconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: {
    fontSize: typography.sizes.sm,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 'auto',
  },
  checkBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
});
