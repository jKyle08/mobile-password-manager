// Mock for expo-local-authentication
export const hasHardwareAsync = async () => true;
export const isEnrolledAsync = async () => true;
export const supportedAuthenticationTypesAsync = async () => [1]; // FINGERPRINT
export const authenticateAsync = async () => ({ success: true });
export const AuthenticationType = {
  FINGERPRINT: 1,
  FACIAL_RECOGNITION: 2,
  IRIS: 3,
};

// Mock for expo-secure-store
const store = new Map<string, string>();
export const setItemAsync = async (key: string, value: string) => {
  store.set(key, value);
};
export const getItemAsync = async (key: string) => {
  return store.get(key) || null;
};
export const deleteItemAsync = async (key: string) => {
  store.delete(key);
};
export const WHEN_UNLOCKED_THIS_DEVICE_ONLY = 1;

// Mock for expo-clipboard
let clipboardContent = '';
export const setStringAsync = async (text: string) => {
  clipboardContent = text;
};
export const getStringAsync = async () => {
  return clipboardContent;
};
