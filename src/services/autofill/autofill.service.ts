import { Platform, Linking } from 'react-native';
import { Credential, UriMatchType } from '@/models/credential.model';
import { AppSettings } from '@/models/settings.model';
import { UriMatcherService } from './uri-matcher.service';
import { ClipboardService } from '@/security/clipboard.service';
import { BiometricsService } from '@/security/biometrics.service';

export interface AutofillStatus {
  androidAutofillSupported: boolean;
  androidAutofillEnabled: boolean;
  iosAutoFillSupported: boolean;
  iosAutoFillEnabled: boolean;
  vaultProtected: boolean;
  biometricAvailable: boolean;
  clipboardTimeoutSeconds: number;
}

export interface AutofillExecutionResult {
  success: boolean;
  error?: string;
  copiedField?: 'username' | 'password' | 'both';
  openedUrl?: string;
}

export class AutofillService {
  /**
   * Validates and normalizes website URL for platform browser opening
   */
  public static validateWebsiteUrl(url?: string): {
    isValid: boolean;
    formattedUrl: string;
    displayHost: string;
    error?: string;
  } {
    if (!url || !url.trim()) {
      return {
        isValid: false,
        formattedUrl: '',
        displayHost: '',
        error: 'This account does not have a valid website URL.',
      };
    }

    const res = UriMatcherService.formatBrowserUrl(url);
    if (!res.isValid) {
      return {
        isValid: false,
        formattedUrl: '',
        displayHost: '',
        error: res.error || 'Invalid website URL format.',
      };
    }

    const displayHost = UriMatcherService.getDisplayHost(res.url);
    return {
      isValid: true,
      formattedUrl: res.url,
      displayHost,
    };
  }

  /**
   * Action: Open Website
   * Validates stored URL and opens it in default platform browser without exposing password
   */
  public static async openWebsite(url?: string): Promise<{ success: boolean; error?: string }> {
    const val = this.validateWebsiteUrl(url);
    if (!val.isValid) {
      return { success: false, error: val.error };
    }

    try {
      const canOpen = await Linking.canOpenURL(val.formattedUrl);
      if (canOpen) {
        await Linking.openURL(val.formattedUrl);
        return { success: true };
      } else {
        return { success: false, error: 'Operating system cannot open this web URL.' };
      }
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to open website.' };
    }
  }

  /**
   * Find all credentials matching a target website/app URI
   */
  public static findMatchingCredentials(
    targetUri: string,
    allCredentials: Credential[],
    defaultMatchType: UriMatchType = 'domain'
  ): Credential[] {
    if (!targetUri || !allCredentials || allCredentials.length === 0) {
      return [];
    }

    return allCredentials.filter((cred) => {
      // Check primary website field
      if (cred.website) {
        if (UriMatcherService.matches(cred.website, targetUri, defaultMatchType)) {
          return true;
        }
      }

      // Check additional URIs if present
      if (cred.uris && cred.uris.length > 0) {
        for (const uriItem of cred.uris) {
          const matchType = uriItem.matchType || defaultMatchType;
          if (UriMatcherService.matches(uriItem.uri, targetUri, matchType)) {
            return true;
          }
        }
      }

      // Also check if title matches target hostname (e.g. title: "GitHub", target: "github.com")
      const titleLower = cred.title.toLowerCase().trim();
      const targetParsed = UriMatcherService.parseUri(targetUri);
      if (targetParsed.isValid) {
        const domainFirst = targetParsed.baseDomain.split('.')[0];
        if (domainFirst && domainFirst.length > 2 && (titleLower === domainFirst || titleLower.includes(domainFirst))) {
          return true;
        }
      }

      return false;
    });
  }

  /**
   * Action: Open & Fill
   * Validates stored URL, authenticates user, opens browser, and prepares credentials safely
   */
  public static async executeOpenAndFill(
    credential: Credential,
    settings: AppSettings
  ): Promise<AutofillExecutionResult> {
    const val = this.validateWebsiteUrl(credential.website);
    if (!val.isValid) {
      return { success: false, error: val.error };
    }

    // Authenticate if required
    if (settings.autofillRequireAuth && settings.biometricEnabled) {
      const authenticated = await BiometricsService.authenticate(
        `Authenticate to Open & Fill for ${credential.title}`
      );
      if (!authenticated) {
        return { success: false, error: 'Authentication required to access credentials.' };
      }
    }

    // Determine credential to copy
    const textToCopy = (settings.autofillUsername && credential.username)
      ? credential.username
      : credential.password;
    const fieldType: 'username' | 'password' = (settings.autofillUsername && credential.username)
      ? 'username'
      : 'password';

    if (textToCopy) {
      await ClipboardService.copyWithAutoClear(
        textToCopy,
        settings.clipboardTimeoutSeconds || 30
      );
    }

    // Launch URL
    try {
      const canOpen = await Linking.canOpenURL(val.formattedUrl);
      if (canOpen) {
        await Linking.openURL(val.formattedUrl);
        return {
          success: true,
          copiedField: fieldType,
          openedUrl: val.formattedUrl,
        };
      } else {
        return { success: false, error: 'Browser cannot open this URL.' };
      }
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to open browser.' };
    }
  }

  /**
   * Action: Autofill (In-app credential release)
   */
  public static async executeAutofill(
    credential: Credential,
    settings: AppSettings,
    targetField: 'username' | 'password' = 'username'
  ): Promise<AutofillExecutionResult> {
    if (settings.autofillRequireAuth && settings.biometricEnabled) {
      const authenticated = await BiometricsService.authenticate(
        `Authenticate to autofill for ${credential.title}`
      );
      if (!authenticated) {
        return { success: false, error: 'Authentication required to release password.' };
      }
    }

    const textToCopy = targetField === 'username' ? (credential.username || credential.password) : credential.password;
    if (!textToCopy) {
      return { success: false, error: 'No credential value to autofill.' };
    }

    await ClipboardService.copyWithAutoClear(
      textToCopy,
      settings.clipboardTimeoutSeconds || 30
    );

    return {
      success: true,
      copiedField: targetField,
    };
  }

  /**
   * Get OS and vault autofill capability status
   */
  public static async getStatus(settings: AppSettings): Promise<AutofillStatus> {
    const bioStatus = await BiometricsService.checkBiometricAvailability();

    return {
      androidAutofillSupported: Platform.OS === 'android',
      androidAutofillEnabled: Platform.OS === 'android' && settings.autofillEnabled,
      iosAutoFillSupported: Platform.OS === 'ios',
      iosAutoFillEnabled: Platform.OS === 'ios' && settings.autofillEnabled,
      vaultProtected: true,
      biometricAvailable: bioStatus.isAvailable,
      clipboardTimeoutSeconds: settings.clipboardTimeoutSeconds || 30,
    };
  }

  /**
   * Open platform settings for AutoFill setup
   */
  public static async openSystemAutofillSettings(): Promise<void> {
    try {
      if (Platform.OS === 'ios') {
        await Linking.openURL('App-Prefs:PASSWORDS');
      } else if (Platform.OS === 'android') {
        await Linking.openSettings();
      } else {
        await Linking.openSettings();
      }
    } catch {
      await Linking.openSettings();
    }
  }
}
