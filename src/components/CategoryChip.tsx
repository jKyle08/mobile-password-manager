import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Category } from '@/models/category.model';
import { useTheme } from '@/theme/ThemeContext';
import { typography } from '@/theme/typography';
import { CategoryIcon, getCategoryColor } from './CategoryIcon';
import { LayoutGrid, Star } from 'lucide-react-native';

interface CategoryChipGroupProps {
  categories: Category[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  showFavoritesFilter?: boolean;
}

export const CategoryChipGroup: React.FC<CategoryChipGroupProps> = ({
  categories,
  selectedId,
  onSelect,
  showFavoritesFilter = true,
}) => {
  const { colors } = useTheme();

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={styles.container}
      >
        {/* "All" chip */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onSelect(null)}
          style={[
            styles.chip,
            {
              backgroundColor: selectedId === null ? colors.primary : colors.surfaceSubtle,
              borderColor: selectedId === null ? colors.primary : colors.surfaceBorder,
            },
          ]}
        >
          <LayoutGrid size={14} color={selectedId === null ? '#FFFFFF' : colors.textSecondary} />
          <Text
            style={[
              styles.chipText,
              { color: selectedId === null ? '#FFFFFF' : colors.textSecondary },
            ]}
          >
            All
          </Text>
        </TouchableOpacity>

        {/* "Favorites" filter chip */}
        {showFavoritesFilter && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onSelect('favorites')}
            style={[
              styles.chip,
              {
                backgroundColor: selectedId === 'favorites' ? colors.warning : colors.surfaceSubtle,
                borderColor: selectedId === 'favorites' ? colors.warning : colors.surfaceBorder,
              },
            ]}
          >
            <Star
              size={14}
              color={selectedId === 'favorites' ? '#FFFFFF' : colors.warning}
              fill={selectedId === 'favorites' ? '#FFFFFF' : 'transparent'}
            />
            <Text
              style={[
                styles.chipText,
                { color: selectedId === 'favorites' ? '#FFFFFF' : colors.textSecondary },
              ]}
            >
              Favorites
            </Text>
          </TouchableOpacity>
        )}

        {/* Dynamic categories */}
        {categories.map((cat) => {
          const isSelected = selectedId === cat.id;
          const colorScheme = getCategoryColor(cat.icon || cat.name);

          return (
            <TouchableOpacity
              key={cat.id}
              activeOpacity={0.7}
              onPress={() => onSelect(cat.id)}
              style={[
                styles.chip,
                {
                  backgroundColor: isSelected ? colorScheme.text : colors.surfaceSubtle,
                  borderColor: isSelected ? colorScheme.text : colors.surfaceBorder,
                },
              ]}
            >
              <CategoryIcon
                name={cat.icon || cat.name}
                size={14}
                color={isSelected ? '#FFFFFF' : colorScheme.text}
              />
              <Text
                style={[
                  styles.chipText,
                  { color: isSelected ? '#FFFFFF' : colors.textSecondary },
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    height: 42,
    flexGrow: 0,
    flexShrink: 0,
    marginBottom: 4,
    justifyContent: 'center',
  },
  scroll: {
    flexGrow: 0,
    flexShrink: 0,
    height: 42,
  },
  container: {
    paddingHorizontal: 16,
    paddingVertical: 2,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 0,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.2,
    gap: 6,
    height: 34,
  },
  chipText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
});

