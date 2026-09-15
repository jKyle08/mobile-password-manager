// Password generator and strength evaluation utility

export const CHAR_SETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  ambiguous: 'il1Lo0O'
};

export const WORD_LIST = [
  'amber', 'azure', 'beacon', 'breeze', 'cascade', 'cipher', 'cobalt', 'comet',
  'crystal', 'delta', 'drift', 'echo', 'ember', 'falcon', 'fathom', 'flame',
  'frost', 'galaxy', 'glacier', 'haven', 'horizon', 'indigo', 'javelin', 'lagoon',
  'lunar', 'matrix', 'meadow', 'nebula', 'nexus', 'nova', 'oasis', 'ocean',
  'orbit', 'panther', 'phantom', 'phoenix', 'polar', 'prism', 'pulse', 'quantum',
  'quest', 'radiant', 'raptor', 'relic', 'ridge', 'rift', 'sable', 'shadow',
  'shield', 'siren', 'solar', 'spark', 'spectra', 'spiral', 'storm', 'stride',
  'summit', 'tempest', 'timber', 'titan', 'trace', 'typhoon', 'valley', 'vault',
  'vector', 'velvet', 'vertex', 'vessel', 'viper', 'vortex', 'voyage', 'zenith'
];

export function generatePassword(options = {}) {
  const {
    length = 16,
    useUppercase = true,
    useLowercase = true,
    useNumbers = true,
    useSymbols = true,
    avoidAmbiguous = false,
    mode = 'characters', // 'characters' or 'passphrase'
    wordCount = 4,
    separator = '-'
  } = options;

  if (mode === 'passphrase') {
    const selectedWords = [];
    const cryptoArray = new Uint32Array(wordCount);
    window.crypto.getRandomValues(cryptoArray);

    for (let i = 0; i < wordCount; i++) {
      const index = cryptoArray[i] % WORD_LIST.length;
      let word = WORD_LIST[index];
      if (useUppercase && i % 2 === 0) {
        word = word.charAt(0).toUpperCase() + word.slice(1);
      }
      selectedWords.push(word);
    }
    let phrase = selectedWords.join(separator);
    if (useNumbers) {
      const randomNum = (window.crypto.getRandomValues(new Uint8Array(1))[0] % 90) + 10;
      phrase += separator + randomNum;
    }
    return phrase;
  }

  let charset = '';
  if (useUppercase) charset += CHAR_SETS.uppercase;
  if (useLowercase) charset += CHAR_SETS.lowercase;
  if (useNumbers) charset += CHAR_SETS.numbers;
  if (useSymbols) charset += CHAR_SETS.symbols;

  if (avoidAmbiguous) {
    charset = charset.split('').filter(c => !CHAR_SETS.ambiguous.includes(c)).join('');
  }

  if (!charset) {
    charset = CHAR_SETS.lowercase + CHAR_SETS.numbers;
  }

  const randomValues = new Uint32Array(length);
  window.crypto.getRandomValues(randomValues);

  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset[randomValues[i] % charset.length];
  }

  return password;
}

export function evaluatePasswordStrength(password) {
  if (!password) {
    return {
      score: 0,
      label: 'Empty',
      color: '#64748b',
      entropy: 0,
      crackTime: 'Instant',
      feedback: ['Enter a password']
    };
  }

  let poolSize = 0;
  if (/[a-z]/.test(password)) poolSize += 26;
  if (/[A-Z]/.test(password)) poolSize += 26;
  if (/[0-9]/.test(password)) poolSize += 10;
  if (/[^a-zA-Z0-9]/.test(password)) poolSize += 32;

  const entropy = Math.round(password.length * Math.log2(Math.max(poolSize, 1)));
  const feedback = [];

  if (password.length < 8) feedback.push('Very short (minimum 12 recommended)');
  else if (password.length < 12) feedback.push('Moderate length (14+ recommended)');

  if (!/[A-Z]/.test(password)) feedback.push('Add uppercase letters');
  if (!/[a-z]/.test(password)) feedback.push('Add lowercase letters');
  if (!/[0-9]/.test(password)) feedback.push('Add numbers');
  if (!/[^a-zA-Z0-9]/.test(password)) feedback.push('Add symbols ($!%*#?&)');

  let score = 0;
  let label = 'Very Weak';
  let color = '#ef4444';
  let crackTime = 'A few seconds';

  if (entropy < 30) {
    score = 15;
    label = 'Very Weak';
    color = '#ef4444';
    crackTime = '< 1 minute';
  } else if (entropy < 50) {
    score = 38;
    label = 'Weak';
    color = '#f97316';
    crackTime = 'A few hours';
  } else if (entropy < 65) {
    score = 65;
    label = 'Fair';
    color = '#eab308';
    crackTime = 'Months to Years';
  } else if (entropy < 85) {
    score = 85;
    label = 'Strong';
    color = '#10b981';
    crackTime = 'Centuries';
  } else {
    score = 100;
    label = 'Very Strong';
    color = '#06b6d4';
    crackTime = 'Millions of years';
  }

  return {
    score,
    label,
    color,
    entropy,
    crackTime,
    feedback: feedback.length > 0 ? feedback : ['Optimal high-entropy password!']
  };
}
