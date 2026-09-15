import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import {
  User,
  Briefcase,
  CreditCard,
  MessageCircle,
  Code,
  ShoppingCart,
  Folder,
  Tag,
  Gamepad2,
  Heart,
  Globe,
  Shield,
  Key,
} from 'lucide-react-native';

interface CategoryIconProps {
  name?: string;
  size?: number;
  color?: string;
  bgColor?: string;
  style?: ViewStyle;
}

export const getCategoryColor = (iconOrName?: string): { bg: string; text: string; border: string } => {
  const key = (iconOrName || '').toLowerCase();
  if (key.includes('finance') || key.includes('credit') || key.includes('bank') || key.includes('money')) {
    return { bg: 'rgba(16, 185, 129, 0.15)', text: '#10B981', border: 'rgba(16, 185, 129, 0.3)' }; // Emerald
  }
  if (key.includes('work') || key.includes('briefcase') || key.includes('office')) {
    return { bg: 'rgba(245, 158, 11, 0.15)', text: '#F59E0B', border: 'rgba(245, 158, 11, 0.3)' }; // Amber
  }
  if (key.includes('social') || key.includes('message') || key.includes('chat')) {
    return { bg: 'rgba(56, 189, 248, 0.15)', text: '#38BDF8', border: 'rgba(56, 189, 248, 0.3)' }; // Sky
  }
  if (key.includes('dev') || key.includes('code') || key.includes('git') || key.includes('tech')) {
    return { bg: 'rgba(99, 102, 241, 0.15)', text: '#6366F1', border: 'rgba(99, 102, 241, 0.3)' }; // Indigo
  }
  if (key.includes('shop') || key.includes('cart') || key.includes('store')) {
    return { bg: 'rgba(236, 72, 153, 0.15)', text: '#EC4899', border: 'rgba(236, 72, 153, 0.3)' }; // Pink
  }
  if (key.includes('personal') || key.includes('user') || key.includes('me')) {
    return { bg: 'rgba(168, 85, 247, 0.15)', text: '#A855F7', border: 'rgba(168, 85, 247, 0.3)' }; // Purple
  }
  return { bg: 'rgba(148, 163, 184, 0.15)', text: '#94A3B8', border: 'rgba(148, 163, 184, 0.3)' }; // Slate
};

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  name = 'folder',
  size = 18,
  color,
  bgColor,
  style,
}) => {
  const colorScheme = getCategoryColor(name);
  const iconColor = color || colorScheme.text;

  const renderIcon = () => {
    const iconKey = (name || '').toLowerCase();
    switch (iconKey) {
      case 'user':
      case 'personal':
        return <User size={size} color={iconColor} />;
      case 'briefcase':
      case 'work':
        return <Briefcase size={size} color={iconColor} />;
      case 'credit-card':
      case 'finance':
        return <CreditCard size={size} color={iconColor} />;
      case 'message-circle':
      case 'social':
        return <MessageCircle size={size} color={iconColor} />;
      case 'code':
      case 'development':
        return <Code size={size} color={iconColor} />;
      case 'shopping-cart':
      case 'shopping':
        return <ShoppingCart size={size} color={iconColor} />;
      case 'gamepad':
      case 'gaming':
        return <Gamepad2 size={size} color={iconColor} />;
      case 'heart':
        return <Heart size={size} color={iconColor} />;
      case 'globe':
        return <Globe size={size} color={iconColor} />;
      case 'shield':
        return <Shield size={size} color={iconColor} />;
      case 'key':
        return <Key size={size} color={iconColor} />;
      case 'folder':
      default:
        return <Folder size={size} color={iconColor} />;
    }
  };

  if (bgColor || style) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: bgColor || colorScheme.bg },
          style,
        ]}
      >
        {renderIcon()}
      </View>
    );
  }

  return renderIcon();
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
});
