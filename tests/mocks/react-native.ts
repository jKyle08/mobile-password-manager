export const Platform = {
  OS: 'node',
  select: (obj: any) => obj.default || obj.node,
};

export const AppState = {
  currentState: 'active',
  addEventListener: () => ({ remove: () => {} }),
};

export const Linking = {
  canOpenURL: async (url: string) => !url.includes('invalid-scheme'),
  openURL: async (url: string) => true,
  openSettings: async () => true,
};

export default {
  Platform,
  AppState,
  Linking,
};
