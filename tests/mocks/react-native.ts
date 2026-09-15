export const Platform = {
  OS: 'node',
  select: (obj: any) => obj.default || obj.node,
};

export const AppState = {
  currentState: 'active',
  addEventListener: () => ({ remove: () => {} }),
};

export default {
  Platform,
  AppState,
};
