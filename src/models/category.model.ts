export interface Category {
  id: string;
  name: string;
  icon?: string;
  isDefault?: boolean;
  createdAt: string;
}

export const DEFAULT_CATEGORIES: Omit<Category, 'createdAt'>[] = [
  { id: 'cat-personal', name: 'Personal', icon: 'user', isDefault: true },
  { id: 'cat-work', name: 'Work', icon: 'briefcase', isDefault: true },
  { id: 'cat-finance', name: 'Finance', icon: 'credit-card', isDefault: true },
  { id: 'cat-social', name: 'Social', icon: 'message-circle', isDefault: true },
  { id: 'cat-development', name: 'Development', icon: 'code', isDefault: true },
  { id: 'cat-shopping', name: 'Shopping', icon: 'shopping-cart', isDefault: true },
  { id: 'cat-other', name: 'Other', icon: 'folder', isDefault: true },
];
