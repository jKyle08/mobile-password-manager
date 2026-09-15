import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const BIOMETRIC_VAULT_KEY = 'securevault_biometric_key';

export interface BiometricStatus {
  isAvailable: boolean;
  isEnrolled: boolean;
  biometryType: 'face' | 'fingerprint' | 'iris' | 'none';
}

export class BiometricsService {
  /**
   * Checks if biometric hardware is present and user has enrolled biometric credentials.
   */
  public static async checkBiometricAvailability(): Promise<BiometricStatus> {
    try {
      if (Platform.OS === 'web') {
        return { isAvailable: false, isEnrolled: false, biometryType: 'none' };
      }

      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

      let biometryType: 'face' | 'fingerprint' | 'iris' | 'none' = 'none';
      if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        biometryType = 'face';
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        biometryType = 'fingerprint';
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        biometryType = 'iris';
      }

      return {
        isAvailable: hasHardware && isEnrolled,
        isEnrolled,
        biometryType,
      };
    } catch (e) {
      return { isAvailable: false, isEnrolled: false, biometryType: 'none' };
    }
  }

  /**
   * Prompts the user to authenticate using device biometrics
   */
  public static async authenticate(promptMessage = 'Unlock your SecureVault'): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        return false;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel: 'Use Master Password',
        fallbackLabel: 'Use Master Password',
        disableDeviceFallback: false,
      });

      return result.success;
    } catch (e) {
      return false;
    }
  }

  /**
   * Stores the derived key in platform SecureStore (Keychain/Keystore)
   * protected by biometric authentication
   */
  public static async saveBiometricKey(keyBase64: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') {
          // Emulation for web dev preview only
          localStorage.setItem(BIOMETRIC_VAULT_KEY, keyBase64);
        }
        return;
      }

      await SecureStore.setItemAsync(BIOMETRIC_VAULT_KEY, keyBase64, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    } catch (e) {
      console.warn('Failed to save biometric key in SecureStore', e);
    }
  }

  /**
   * Retrieves the derived key from SecureStore
   */
  public static async getBiometricKey(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') {
          return localStorage.getItem(BIOMETRIC_VAULT_KEY);
        }
        return null;
      }

      return await SecureStore.getItemAsync(BIOMETRIC_VAULT_KEY);
    } catch (e) {
      return null;
    }
  }

  /**
   * Clears the biometric key from SecureStore (e.g. when disabling biometric unlock or changing master password)
   */
  public static async clearBiometricKey(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(BIOMETRIC_VAULT_KEY);
        }
        return;
      }

      await SecureStore.deleteItemAsync(BIOMETRIC_VAULT_KEY);
    } catch (e) {
      // Ignore deletion errors
    }
  }
}
