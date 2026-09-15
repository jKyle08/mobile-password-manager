import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
  TextInput,
} from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { typography } from '@/theme/typography';
import { Input } from './ui/Input';
import {
  POPULAR_WEBSITES,
  PopularWebsite,
  filterWebsiteSuggestions,
} from '@/data/popular-websites';
import { Globe, Sparkles, X, Check, Search, ExternalLink } from 'lucide-react-native';

interface WebsiteSuggestInputProps {
  label?: string;
  value: string;
  onChangeText: (url: string) => void;
  onSelectSuggestion?: (site: PopularWebsite) => void;
  error?: string;
  placeholder?: string;
}

export const WebsiteSuggestInput: React.FC<WebsiteSuggestInputProps> = ({
  label = 'Website URL',
  value,
  onChangeText,
  onSelectSuggestion,
  error,
  placeholder = 'https://example.com or select below',
}) => {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [showAllModal, setShowAllModal] = useState(false);
  const [modalSearch, setModalSearch] = useState('');

  // Top quick chips to show directly on the form
  const quickPickList = useMemo(() => {
    return POPULAR_WEBSITES.slice(0, 8);
  }, []);

  // Filtered live suggestions as user types
  const liveSuggestions = useMemo(() => {
    if (!isFocused || !value || value.length < 1) return [];
    return filterWebsiteSuggestions(value);
  }, [value, isFocused]);

  // Filtered list for the "Browse All" modal
  const modalList = useMemo(() => {
    if (!modalSearch.trim()) return POPULAR_WEBSITES;
    return filterWebsiteSuggestions(modalSearch);
  }, [modalSearch]);

  const handleSelect = (site: PopularWebsite) => {
    onChangeText(site.url);
    if (onSelectSuggestion) {
      onSelectSuggestion(site);
    }
    setIsFocused(false);
    setShowAllModal(false);
  };

  const handleBlur = () => {
    // Delay hiding dropdown so press event can register
    setTimeout(() => {
      setIsFocused(false);
    }, 200);

    // Auto-prepend https:// if user entered domain without protocol
    if (value && value.trim()) {
      const trimmed = value.trim();
      if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && trimmed.includes('.')) {
        onChangeText(`https://${trimmed}`);
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Website Input Field */}
      <Input
        label={label}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        autoCapitalize="none"
        keyboardType="url"
        error={error}
        containerStyle={{ marginBottom: 6 }}
        leftIcon={<Globe size={18} color={colors.textMuted} />}
        rightIcon={
          value ? (
            <TouchableOpacity onPress={() => onChangeText('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ) : undefined
        }
      />

      {/* Live Dropdown Suggestions when typing */}
      {isFocused && liveSuggestions.length > 0 && (
        <View
          style={[
            styles.dropdown,
            {
              backgroundColor: colors.surface,
              borderColor: colors.primary,
              shadowColor: '#000',
            },
          ]}
        >
          <View style={[styles.dropdownHeader, { borderBottomColor: colors.surfaceBorder }]}>
            <Sparkles size={13} color={colors.primary} />
            <Text style={[styles.dropdownHeaderText, { color: colors.primary }]}>
              Suggested Websites
            </Text>
          </View>
          {liveSuggestions.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.7}
              onPress={() => handleSelect(item)}
              style={[
                styles.dropdownItem,
                { borderBottomColor: colors.surfaceBorder },
              ]}
            >
              <View style={[styles.iconPill, { backgroundColor: colors.surfaceSubtle }]}>
                <Globe size={14} color={colors.primary} />
              </View>
              <View style={styles.itemTextContainer}>
                <Text style={[styles.itemTitle, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.itemUrl, { color: colors.textMuted }]} numberOfLines={1}>
                  {item.url}
                </Text>
              </View>
              <View style={[styles.domainBadge, { backgroundColor: colors.surfaceSubtle }]}>
                <Text style={[styles.domainBadgeText, { color: colors.textSecondary }]}>
                  {item.domain}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Quick Select Chips */}
      <View style={styles.quickBarContainer}>
        <View style={styles.quickBarHeader}>
          <Text style={[styles.quickBarLabel, { color: colors.textSecondary }]}>
            Popular Websites:
          </Text>
          <TouchableOpacity
            onPress={() => {
              setModalSearch('');
              setShowAllModal(true);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.viewAllText, { color: colors.primary }]}>View All ({POPULAR_WEBSITES.length})</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.scroll}
          contentContainerStyle={styles.chipsScroll}
          keyboardShouldPersistTaps="handled"
        >
          {quickPickList.map((site) => {
            const isSelected = value.toLowerCase().includes(site.domain.toLowerCase());
            return (
              <TouchableOpacity
                key={site.id}
                activeOpacity={0.7}
                onPress={() => handleSelect(site)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isSelected ? colors.surfaceHover : colors.surfaceSubtle,
                    borderColor: isSelected ? colors.primary : colors.surfaceBorder,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    {
                      color: isSelected ? colors.primary : colors.text,
                      fontWeight: isSelected ? typography.weights.bold : typography.weights.medium,
                    },
                  ]}
                >
                  {site.name.split(' / ')[0]}
                </Text>
                {isSelected && <Check size={12} color={colors.primary} style={{ marginLeft: 4 }} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Full Screen / Modal Directory of Popular Websites */}
      <Modal
        visible={showAllModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAllModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.surface,
                borderColor: colors.surfaceBorder,
              },
            ]}
          >
            {/* Modal Header */}
            <View style={[styles.modalHeader, { borderBottomColor: colors.surfaceBorder }]}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Popular Websites</Text>
                <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
                  Tap to auto-fill URL, name & category
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowAllModal(false)}
                style={[styles.closeBtn, { backgroundColor: colors.surfaceSubtle }]}
              >
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Modal Search */}
            <View
              style={[
                styles.modalSearchContainer,
                {
                  backgroundColor: colors.inputBg,
                  borderColor: colors.inputBorder,
                },
              ]}
            >
              <Search size={18} color={colors.textMuted} />
              <TextInput
                placeholder="Search Gmail, Yahoo, GitHub, Facebook..."
                placeholderTextColor={colors.textMuted}
                value={modalSearch}
                onChangeText={setModalSearch}
                style={[styles.modalSearchInput, { color: colors.text }]}
                autoCapitalize="none"
                autoFocus
              />
              {modalSearch ? (
                <TouchableOpacity onPress={() => setModalSearch('')}>
                  <X size={16} color={colors.textMuted} />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Website List */}
            <FlatList
              data={modalList}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingVertical: 8 }}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleSelect(item)}
                  style={[
                    styles.modalListItem,
                    { borderBottomColor: colors.surfaceBorder },
                  ]}
                >
                  <View style={[styles.modalListIcon, { backgroundColor: colors.surfaceSubtle }]}>
                    <Globe size={18} color={colors.primary} />
                  </View>
                  <View style={styles.modalListItemText}>
                    <Text style={[styles.modalItemTitle, { color: colors.text }]}>
                      {item.name}
                    </Text>
                    <Text style={[styles.modalItemUrl, { color: colors.textMuted }]}>
                      {item.url}
                    </Text>
                  </View>
                  <ExternalLink size={16} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 0,
    position: 'relative',
    zIndex: 10,
  },
  dropdown: {
    position: 'relative',
    marginTop: -8,
    marginBottom: 8,
    borderWidth: 1.5,
    borderRadius: 12,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 6,
  },
  dropdownHeaderText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  iconPill: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  itemTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  itemTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  itemUrl: {
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  domainBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  domainBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  quickBarContainer: {
    marginTop: 0,
    marginBottom: 10,
  },
  quickBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  quickBarLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  viewAllText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  scroll: {
    flexGrow: 0,
    flexShrink: 0,
    height: 34,
  },
  chipsScroll: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    flexGrow: 0,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    height: 30,
  },
  chipText: {
    fontSize: typography.sizes.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '75%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  modalSubtitle: {
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginVertical: 12,
  },
  modalSearchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: typography.sizes.sm,
  },
  modalListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalListIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalListItemText: {
    flex: 1,
  },
  modalItemTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  modalItemUrl: {
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
});
