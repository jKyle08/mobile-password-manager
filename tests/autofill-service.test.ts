import { AutofillService } from '../src/services/autofill/autofill.service';
import { Credential } from '../src/models/credential.model';
import { DEFAULT_SETTINGS } from '../src/models/settings.model';

describe('AutofillService', () => {
  const sampleCredentials: Credential[] = [
    {
      id: 'cred-1',
      title: 'GitHub Personal',
      username: 'octocat',
      password: 'SuperSecretPassword123!',
      website: 'https://github.com',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      favorite: false,
    },
    {
      id: 'cred-2',
      title: 'GitHub Work',
      username: 'work-octocat',
      password: 'WorkSecretPassword456!',
      website: 'https://github.com/login',
      uris: [
        { uri: 'https://ghe.mycompany.internal', matchType: 'host' },
        { uri: 'android://com.github.android', matchType: 'exact' },
      ],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      favorite: true,
    },
    {
      id: 'cred-3',
      title: 'Slack',
      username: 'octo@team.com',
      password: 'SlackPassword789!',
      website: 'https://slack.com',
      uris: [{ uri: 'android://com.Slack', matchType: 'exact' }],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      favorite: false,
    },
    {
      id: 'cred-4',
      title: 'No Website Account',
      username: 'offline_user',
      password: 'OfflinePassword111!',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      favorite: false,
    },
  ];

  describe('validateWebsiteUrl', () => {
    it('returns error when website URL is missing or empty', () => {
      const emptyRes = AutofillService.validateWebsiteUrl('');
      expect(emptyRes.isValid).toBe(false);
      expect(emptyRes.error).toBe('This account does not have a valid website URL.');

      const undefinedRes = AutofillService.validateWebsiteUrl(undefined);
      expect(undefinedRes.isValid).toBe(false);
      expect(undefinedRes.error).toBe('This account does not have a valid website URL.');
    });

    it('validates and formats valid URLs', () => {
      const res = AutofillService.validateWebsiteUrl('github.com/settings');
      expect(res.isValid).toBe(true);
      expect(res.formattedUrl).toBe('https://github.com/settings');
      expect(res.displayHost).toBe('github.com');
    });
  });

  describe('openWebsite', () => {
    it('fails when URL is missing', async () => {
      const res = await AutofillService.openWebsite('');
      expect(res.success).toBe(false);
      expect(res.error).toBe('This account does not have a valid website URL.');
    });

    it('succeeds for valid web URLs', async () => {
      const res = await AutofillService.openWebsite('https://github.com');
      expect(res.success).toBe(true);
    });
  });

  describe('findMatchingCredentials', () => {
    it('finds all credentials matching target domain', () => {
      const matches = AutofillService.findMatchingCredentials('https://login.github.com', sampleCredentials);
      expect(matches.length).toBe(2);
      expect(matches.map((m) => m.id)).toEqual(['cred-1', 'cred-2']);
    });

    it('finds credentials via additional uris list', () => {
      const matchesInternal = AutofillService.findMatchingCredentials(
        'https://ghe.mycompany.internal',
        sampleCredentials
      );
      expect(matchesInternal.length).toBe(1);
      expect(matchesInternal[0].id).toBe('cred-2');
    });

    it('finds credentials by app package URI', () => {
      const matchesApp = AutofillService.findMatchingCredentials('android://com.Slack', sampleCredentials);
      expect(matchesApp.length).toBe(1);
      expect(matchesApp[0].id).toBe('cred-3');
    });

    it('does not match unrelated accounts', () => {
      const matches = AutofillService.findMatchingCredentials('https://gitlab.com', sampleCredentials);
      expect(matches.length).toBe(0);
    });
  });

  describe('executeOpenAndFill', () => {
    it('fails gracefully when website is missing', async () => {
      const noWebCred = sampleCredentials.find((c) => c.id === 'cred-4')!;
      const res = await AutofillService.executeOpenAndFill(noWebCred, DEFAULT_SETTINGS);
      expect(res.success).toBe(false);
      expect(res.error).toBe('This account does not have a valid website URL.');
    });

    it('successfully executes Open & Fill for valid account', async () => {
      const githubCred = sampleCredentials[0];
      const res = await AutofillService.executeOpenAndFill(githubCred, DEFAULT_SETTINGS);
      expect(res.success).toBe(true);
      expect(res.openedUrl).toBe('https://github.com');
      expect(res.copiedField).toBe('username');
    });
  });

  describe('executeAutofill', () => {
    it('safely copies password or username', async () => {
      const githubCred = sampleCredentials[0];
      const res = await AutofillService.executeAutofill(githubCred, DEFAULT_SETTINGS, 'password');
      expect(res.success).toBe(true);
      expect(res.copiedField).toBe('password');
    });
  });
});
