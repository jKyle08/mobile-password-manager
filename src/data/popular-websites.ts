export interface PopularWebsite {
  id: string;
  name: string;
  url: string;
  domain: string;
  categoryHint?: string; // matches Category ID like 'cat-personal', 'cat-work', etc.
  tags: string[];
}

export const POPULAR_WEBSITES: PopularWebsite[] = [
  {
    id: 'gmail',
    name: 'Gmail / Google',
    url: 'https://mail.google.com',
    domain: 'google.com',
    categoryHint: 'cat-personal',
    tags: ['gmail', 'google', 'mail', 'email', 'inbox', 'alphabet'],
  },
  {
    id: 'yahoo',
    name: 'Yahoo Mail',
    url: 'https://mail.yahoo.com',
    domain: 'yahoo.com',
    categoryHint: 'cat-personal',
    tags: ['yahoo', 'mail', 'email', 'inbox', 'ymail'],
  },
  {
    id: 'github',
    name: 'GitHub',
    url: 'https://github.com',
    domain: 'github.com',
    categoryHint: 'cat-development',
    tags: ['github', 'git', 'code', 'repo', 'dev', 'developer', 'microsoft'],
  },
  {
    id: 'facebook',
    name: 'Facebook',
    url: 'https://facebook.com',
    domain: 'facebook.com',
    categoryHint: 'cat-social',
    tags: ['facebook', 'fb', 'meta', 'social'],
  },
  {
    id: 'outlook',
    name: 'Microsoft / Outlook',
    url: 'https://outlook.live.com',
    domain: 'outlook.com',
    categoryHint: 'cat-work',
    tags: ['microsoft', 'outlook', 'office', 'hotmail', 'live', 'email', 'mail', 'msft'],
  },
  {
    id: 'apple',
    name: 'Apple ID / iCloud',
    url: 'https://appleid.apple.com',
    domain: 'apple.com',
    categoryHint: 'cat-personal',
    tags: ['apple', 'icloud', 'ios', 'mac', 'appleid'],
  },
  {
    id: 'amazon',
    name: 'Amazon',
    url: 'https://amazon.com',
    domain: 'amazon.com',
    categoryHint: 'cat-shopping',
    tags: ['amazon', 'shopping', 'store', 'aws', 'prime'],
  },
  {
    id: 'netflix',
    name: 'Netflix',
    url: 'https://netflix.com',
    domain: 'netflix.com',
    categoryHint: 'cat-other',
    tags: ['netflix', 'movies', 'stream', 'entertainment', 'tv'],
  },
  {
    id: 'twitter',
    name: 'X (Twitter)',
    url: 'https://x.com',
    domain: 'x.com',
    categoryHint: 'cat-social',
    tags: ['twitter', 'x', 'tweet', 'social', 'elon'],
  },
  {
    id: 'instagram',
    name: 'Instagram',
    url: 'https://instagram.com',
    domain: 'instagram.com',
    categoryHint: 'cat-social',
    tags: ['instagram', 'ig', 'meta', 'photo', 'social'],
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    url: 'https://linkedin.com',
    domain: 'linkedin.com',
    categoryHint: 'cat-work',
    tags: ['linkedin', 'job', 'work', 'career', 'professional', 'social'],
  },
  {
    id: 'reddit',
    name: 'Reddit',
    url: 'https://reddit.com',
    domain: 'reddit.com',
    categoryHint: 'cat-social',
    tags: ['reddit', 'forum', 'community', 'social'],
  },
  {
    id: 'discord',
    name: 'Discord',
    url: 'https://discord.com',
    domain: 'discord.com',
    categoryHint: 'cat-social',
    tags: ['discord', 'chat', 'gaming', 'voice', 'community'],
  },
  {
    id: 'spotify',
    name: 'Spotify',
    url: 'https://spotify.com',
    domain: 'spotify.com',
    categoryHint: 'cat-other',
    tags: ['spotify', 'music', 'audio', 'podcast', 'streaming'],
  },
  {
    id: 'paypal',
    name: 'PayPal',
    url: 'https://paypal.com',
    domain: 'paypal.com',
    categoryHint: 'cat-finance',
    tags: ['paypal', 'payment', 'money', 'finance', 'wallet', 'bank'],
  },
  {
    id: 'chatgpt',
    name: 'OpenAI / ChatGPT',
    url: 'https://chatgpt.com',
    domain: 'chatgpt.com',
    categoryHint: 'cat-development',
    tags: ['openai', 'chatgpt', 'gpt', 'ai', 'anthropic'],
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    url: 'https://dropbox.com',
    domain: 'dropbox.com',
    categoryHint: 'cat-work',
    tags: ['dropbox', 'cloud', 'storage', 'files', 'drive'],
  },
  {
    id: 'slack',
    name: 'Slack',
    url: 'https://slack.com',
    domain: 'slack.com',
    categoryHint: 'cat-work',
    tags: ['slack', 'chat', 'work', 'teams', 'collaboration'],
  },
  {
    id: 'zoom',
    name: 'Zoom',
    url: 'https://zoom.us',
    domain: 'zoom.us',
    categoryHint: 'cat-work',
    tags: ['zoom', 'meeting', 'video', 'call', 'work'],
  },
  {
    id: 'protonmail',
    name: 'Proton Mail',
    url: 'https://mail.proton.me',
    domain: 'proton.me',
    categoryHint: 'cat-personal',
    tags: ['proton', 'protonmail', 'privacy', 'encrypted', 'email', 'mail'],
  },
  {
    id: 'gitlab',
    name: 'GitLab',
    url: 'https://gitlab.com',
    domain: 'gitlab.com',
    categoryHint: 'cat-development',
    tags: ['gitlab', 'git', 'dev', 'code', 'repository', 'ci'],
  },
  {
    id: 'figma',
    name: 'Figma',
    url: 'https://figma.com',
    domain: 'figma.com',
    categoryHint: 'cat-work',
    tags: ['figma', 'design', 'ui', 'ux', 'product'],
  },
  {
    id: 'steam',
    name: 'Steam',
    url: 'https://steampowered.com',
    domain: 'steampowered.com',
    categoryHint: 'cat-other',
    tags: ['steam', 'valve', 'gaming', 'games'],
  },
  {
    id: 'twitch',
    name: 'Twitch',
    url: 'https://twitch.tv',
    domain: 'twitch.tv',
    categoryHint: 'cat-social',
    tags: ['twitch', 'stream', 'gaming', 'video', 'live'],
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    url: 'https://tiktok.com',
    domain: 'tiktok.com',
    categoryHint: 'cat-social',
    tags: ['tiktok', 'video', 'social'],
  },
  {
    id: 'ebay',
    name: 'eBay',
    url: 'https://ebay.com',
    domain: 'ebay.com',
    categoryHint: 'cat-shopping',
    tags: ['ebay', 'shop', 'auction', 'shopping', 'store'],
  },
  {
    id: 'notion',
    name: 'Notion',
    url: 'https://notion.so',
    domain: 'notion.so',
    categoryHint: 'cat-work',
    tags: ['notion', 'notes', 'docs', 'workspace', 'wiki'],
  },
];

/**
 * Filter popular websites based on user input (matching name, domain, URL, or tags)
 */
export function filterWebsiteSuggestions(query: string): PopularWebsite[] {
  if (!query || !query.trim()) return [];
  const normalized = query.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '');
  
  return POPULAR_WEBSITES.filter((site) => {
    return (
      site.name.toLowerCase().includes(normalized) ||
      site.domain.toLowerCase().includes(normalized) ||
      site.url.toLowerCase().includes(normalized) ||
      site.tags.some((tag) => tag.toLowerCase().includes(normalized))
    );
  }).slice(0, 6);
}
