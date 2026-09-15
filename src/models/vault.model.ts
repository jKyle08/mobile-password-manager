export interface VaultMetadata {
  id: number;
  salt: string; // Base64 encoded 16+ byte salt
  sentinel: string; // Encrypted known verification token to validate password without leaking data
  kdfIterations: number;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface EncryptedBackupPayload {
  format: 'securevault_backup';
  version: 1;
  kdf: 'PBKDF2-SHA256' | 'Argon2id';
  iterations: number;
  encryption: 'AES-256-GCM';
  salt: string; // Base64
  nonce: string; // Base64 IV
  tag: string; // Base64 auth tag
  ciphertext: string; // Base64
  exportedAt: string;
}

export interface VaultExportData {
  exportedAt: string;
  version: number;
  categories: Array<{
    id: string;
    name: string;
    icon?: string;
    isDefault?: boolean;
    createdAt: string;
  }>;
  credentials: Array<{
    id: string;
    title: string;
    username?: string;
    password: string;
    website?: string;
    notes?: string;
    categoryId?: string;
    categoryIds?: string[];
    favorite: boolean;
    tags?: string[];
    createdAt: string;
    updatedAt: string;
  }>;
}
