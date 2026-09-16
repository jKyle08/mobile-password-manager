import { UriMatcherService } from '../src/services/autofill/uri-matcher.service';

describe('UriMatcherService', () => {
  describe('parseUri and Base Domain Extraction', () => {
    it('should parse standard domains correctly', () => {
      const parsed = UriMatcherService.parseUri('https://github.com/login');
      expect(parsed.isValid).toBe(true);
      expect(parsed.hostname).toBe('github.com');
      expect(parsed.baseDomain).toBe('github.com');
    });

    it('should extract base domain from subdomains', () => {
      const parsed = UriMatcherService.parseUri('https://auth.api.github.com/oauth');
      expect(parsed.isValid).toBe(true);
      expect(parsed.hostname).toBe('auth.api.github.com');
      expect(parsed.baseDomain).toBe('github.com');
    });

    it('should properly handle multi-part public suffixes (co.uk, com.au, org.uk)', () => {
      const ukParsed = UriMatcherService.parseUri('https://login.service.gov.uk/dashboard');
      expect(ukParsed.isValid).toBe(true);
      expect(ukParsed.baseDomain).toBe('service.gov.uk');

      const bbcParsed = UriMatcherService.parseUri('https://news.bbc.co.uk/world');
      expect(bbcParsed.isValid).toBe(true);
      expect(bbcParsed.baseDomain).toBe('bbc.co.uk');

      const auParsed = UriMatcherService.parseUri('https://checkout.amazon.com.au');
      expect(auParsed.isValid).toBe(true);
      expect(auParsed.baseDomain).toBe('amazon.com.au');
    });

    it('should handle IP addresses and localhost correctly', () => {
      const localParsed = UriMatcherService.parseUri('http://localhost:8080/app');
      expect(localParsed.isValid).toBe(true);
      expect(localParsed.hostname).toBe('localhost');
      expect(localParsed.baseDomain).toBe('localhost');

      const ipParsed = UriMatcherService.parseUri('http://192.168.1.1:80');
      expect(ipParsed.isValid).toBe(true);
      expect(ipParsed.hostname).toBe('192.168.1.1');
      expect(ipParsed.baseDomain).toBe('192.168.1.1');
    });

    it('should parse mobile app URI schemes (android:// and ios://)', () => {
      const androidParsed = UriMatcherService.parseUri('android://com.spotify.music');
      expect(androidParsed.isValid).toBe(true);
      expect(androidParsed.scheme).toBe('android');
      expect(androidParsed.hostname).toBe('com.spotify.music');
      expect(androidParsed.baseDomain).toBe('com.spotify.music');

      const iosParsed = UriMatcherService.parseUri('ios://com.spotify.client');
      expect(iosParsed.isValid).toBe(true);
      expect(iosParsed.scheme).toBe('ios');
      expect(iosParsed.hostname).toBe('com.spotify.client');
    });
  });

  describe('Domain Matching Strategy (Default)', () => {
    it('should match same domain and subdomains', () => {
      expect(
        UriMatcherService.matches('github.com', 'https://github.com', 'domain')
      ).toBe(true);

      expect(
        UriMatcherService.matches('github.com', 'https://login.github.com', 'domain')
      ).toBe(true);

      expect(
        UriMatcherService.matches('https://api.github.com', 'https://auth.github.com', 'domain')
      ).toBe(true);
    });

    it('SECURITY CRITICAL: should reject spoofing, prefixes, and attacker-controlled subdomains', () => {
      // Must NOT match attacker with suffix
      expect(
        UriMatcherService.matches('github.com', 'https://evil-github.com', 'domain')
      ).toBe(false);

      // Must NOT match attacker prepending real domain as subdomain of their own domain
      expect(
        UriMatcherService.matches('github.com', 'https://github.com.attacker.com', 'domain')
      ).toBe(false);

      // Must NOT match similar prefix/suffix domain names
      expect(
        UriMatcherService.matches('google.com', 'https://google.com.phishing.io', 'domain')
      ).toBe(false);

      expect(
        UriMatcherService.matches('paypal.com', 'https://my-paypal.com', 'domain')
      ).toBe(false);
    });
  });

  describe('Host and Exact Matching Strategies', () => {
    it('Host match: should require exact hostname matching (including subdomains)', () => {
      // Same hostname passes
      expect(
        UriMatcherService.matches('https://login.example.com', 'https://login.example.com/path', 'host')
      ).toBe(true);

      // Different subdomain fails host match even if same base domain
      expect(
        UriMatcherService.matches('https://login.example.com', 'https://api.example.com', 'host')
      ).toBe(false);

      expect(
        UriMatcherService.matches('example.com', 'https://login.example.com', 'host')
      ).toBe(false);
    });

    it('Exact match: should require exact URL matching', () => {
      expect(
        UriMatcherService.matches('https://example.com/login', 'https://example.com/login', 'exact')
      ).toBe(true);

      expect(
        UriMatcherService.matches('https://example.com/login', 'https://example.com/dashboard', 'exact')
      ).toBe(false);
    });
  });

  describe('App Package Matching', () => {
    it('should match android and ios package IDs', () => {
      expect(
        UriMatcherService.matches('android://com.slack', 'android://com.slack', 'exact')
      ).toBe(true);

      expect(
        UriMatcherService.matches('android://com.slack', 'android://com.slack.enterprise', 'exact')
      ).toBe(false);
    });
  });

  describe('Browser URL formatting & Display', () => {
    it('should format clean browser URLs', () => {
      const res = UriMatcherService.formatBrowserUrl('github.com');
      expect(res.isValid).toBe(true);
      expect(res.url).toBe('https://github.com');

      const resHttp = UriMatcherService.formatBrowserUrl('http://insecure.internal');
      expect(resHttp.isValid).toBe(true);
      expect(resHttp.url).toBe('http://insecure.internal');
    });

    it('should return clean display host', () => {
      expect(UriMatcherService.getDisplayHost('https://www.google.com/search?q=test')).toBe('google.com');
      expect(UriMatcherService.getDisplayHost('https://sub.test.co.uk:8080/page')).toBe('sub.test.co.uk:8080');
    });
  });
});
