import { UriMatchType } from '@/models/credential.model';

export interface ParsedUri {
  raw: string;
  scheme: string;
  hostname: string;
  port: string;
  pathname: string;
  baseDomain: string;
  isAppScheme: boolean;
  appIdentifier?: string;
  isValid: boolean;
}

// Common multi-part second-level domains for accurate base domain extraction
const MULTI_PART_TLDS = new Set([
  'co.uk',
  'org.uk',
  'gov.uk',
  'ac.uk',
  'com.au',
  'net.au',
  'org.au',
  'edu.au',
  'co.jp',
  'ne.jp',
  'co.nz',
  'org.nz',
  'co.za',
  'com.br',
  'com.mx',
  'com.sg',
  'com.tw',
  'co.in',
  'net.in',
  'org.in',
  'co.kr',
  'ne.kr',
]);

export class UriMatcherService {
  /**
   * Parse and normalize any URI (web URL or app package identifier)
   */
  public static parseUri(input?: string): ParsedUri {
    if (!input || typeof input !== 'string') {
      return {
        raw: '',
        scheme: '',
        hostname: '',
        port: '',
        pathname: '',
        baseDomain: '',
        isAppScheme: false,
        isValid: false,
      };
    }

    const trimmed = input.trim();
    if (!trimmed) {
      return {
        raw: '',
        scheme: '',
        hostname: '',
        port: '',
        pathname: '',
        baseDomain: '',
        isAppScheme: false,
        isValid: false,
      };
    }

    // Check for mobile app package schemes: android://com.app.id or ios://bundle.id or app://id
    const appMatch = trimmed.match(/^(android|ios|app):\/\/([a-zA-Z0-9._-]+)/i);
    if (appMatch) {
      const scheme = appMatch[1].toLowerCase();
      const appId = appMatch[2].toLowerCase();
      return {
        raw: trimmed,
        scheme,
        hostname: appId,
        port: '',
        pathname: '',
        baseDomain: appId,
        isAppScheme: true,
        appIdentifier: appId,
        isValid: true,
      };
    }

    // Reject dangerous or non-web schemes
    if (/^(javascript|data|vbscript|file):/i.test(trimmed)) {
      return {
        raw: trimmed,
        scheme: 'unsafe',
        hostname: '',
        port: '',
        pathname: '',
        baseDomain: '',
        isAppScheme: false,
        isValid: false,
      };
    }

    // Prepend https:// if no scheme is provided (e.g. "github.com/login")
    let urlString = trimmed;
    if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//i.test(urlString)) {
      urlString = 'https://' + urlString;
    }

    try {
      // Basic URL constructor parse
      const parsed = new URL(urlString);
      const scheme = parsed.protocol.replace(':', '').toLowerCase();

      // Only allow http and https schemes for web URIs
      if (scheme !== 'http' && scheme !== 'https') {
        return {
          raw: trimmed,
          scheme,
          hostname: parsed.hostname.toLowerCase(),
          port: parsed.port,
          pathname: parsed.pathname,
          baseDomain: parsed.hostname.toLowerCase(),
          isAppScheme: false,
          isValid: false,
        };
      }

      const hostname = parsed.hostname.toLowerCase();
      const port = parsed.port || (scheme === 'https' ? '443' : '80');
      const pathname = (parsed.pathname || '/').replace(/\/+$/, '') || '/';
      const baseDomain = this.extractBaseDomain(hostname);

      return {
        raw: trimmed,
        scheme,
        hostname,
        port,
        pathname,
        baseDomain,
        isAppScheme: false,
        isValid: Boolean(hostname && baseDomain),
      };
    } catch {
      return {
        raw: trimmed,
        scheme: '',
        hostname: '',
        port: '',
        pathname: '',
        baseDomain: '',
        isAppScheme: false,
        isValid: false,
      };
    }
  }

  /**
   * Extract base domain (e.g., "login.github.com" -> "github.com", "sub.amazon.co.uk" -> "amazon.co.uk")
   */
  public static extractBaseDomain(hostname: string): string {
    if (!hostname) return '';
    const cleanHost = hostname.toLowerCase().replace(/^www\./, '');

    // If it's an IP address or localhost, return as-is
    if (/^(localhost|\d{1,3}(\.\d{1,3}){3}|\[[0-9a-fA-F:]+\])$/.test(cleanHost)) {
      return cleanHost;
    }

    const parts = cleanHost.split('.');
    if (parts.length <= 2) {
      return cleanHost;
    }

    // Check for multi-part TLDs (e.g. .co.uk)
    const lastTwoParts = parts.slice(-2).join('.');
    if (MULTI_PART_TLDS.has(lastTwoParts) && parts.length >= 3) {
      return parts.slice(-3).join('.');
    }

    return parts.slice(-2).join('.');
  }

  /**
   * Test whether a saved credential URI matches a requested target website/app URI
   */
  public static matches(
    savedUri: string,
    targetUri: string,
    matchType: UriMatchType = 'domain'
  ): boolean {
    const saved = this.parseUri(savedUri);
    const target = this.parseUri(targetUri);

    if (!saved.isValid || !target.isValid) {
      return false;
    }

    // Handle App Schemes
    if (saved.isAppScheme || target.isAppScheme) {
      if (saved.isAppScheme && target.isAppScheme) {
        return saved.appIdentifier === target.appIdentifier;
      }
      // If one is app and other is domain, check if app identifier contains the base domain
      const appId = saved.appIdentifier || target.appIdentifier || '';
      const domain = saved.isAppScheme ? target.baseDomain : saved.baseDomain;
      const domainSlug = domain.split('.')[0];
      return domainSlug.length > 2 && appId.includes(domainSlug);
    }

    switch (matchType) {
      case 'exact': {
        // Scheme, hostname, port, and path prefix must match
        const schemeMatch = saved.scheme === target.scheme;
        const hostMatch = saved.hostname === target.hostname;
        const portMatch = saved.port === target.port;
        const pathMatch =
          saved.pathname === '/' ||
          target.pathname === saved.pathname ||
          target.pathname.startsWith(saved.pathname + '/');

        return schemeMatch && hostMatch && portMatch && pathMatch;
      }

      case 'host': {
        // Exact hostname (including subdomains) and port must match
        const hostMatch = saved.hostname === target.hostname;
        const portMatch = saved.port === target.port;
        return hostMatch && portMatch;
      }

      case 'domain':
      default: {
        // Base domain must match exactly (e.g. github.com)
        // Subdomains of the same domain match, but completely different domains are rejected
        if (!saved.baseDomain || !target.baseDomain) {
          return false;
        }

        // Strict equality on baseDomain prevents "evil-github.com" or "github.com.attacker.com"
        return saved.baseDomain === target.baseDomain;
      }
    }
  }

  /**
   * Format and validate URL for platform browser opening
   */
  public static formatBrowserUrl(input?: string): { url: string; isValid: boolean; error?: string } {
    if (!input || !input.trim()) {
      return { url: '', isValid: false, error: 'This account does not have a valid website URL.' };
    }

    const parsed = this.parseUri(input);
    if (!parsed.isValid || parsed.isAppScheme) {
      return { url: '', isValid: false, error: 'Invalid or unsupported website URL format.' };
    }

    let url = parsed.raw.trim();
    if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//i.test(url)) {
      url = 'https://' + url;
    }

    return { url, isValid: true };
  }

  /**
   * Get user-friendly display name for domain / hostname
   */
  public static getDisplayHost(url?: string): string {
    if (!url) return '';
    const parsed = this.parseUri(url);
    if (!parsed.isValid) return url;
    const host = parsed.hostname.replace(/^www\./, '') || parsed.baseDomain || url;
    if (parsed.port && parsed.port !== '80' && parsed.port !== '443') {
      return `${host}:${parsed.port}`;
    }
    return host;
  }
}
