export type UriMatchType = 'domain' | 'host' | 'exact';

export interface CredentialUri {
  id?: string;
  uri: string;
  matchType?: UriMatchType;
}

export interface CustomField {
  id: string;
  label: string;
  value: string;
  isSecret?: boolean;
}

export interface Credential {
  id: string;
  title: string;
  username?: string;
  password: string;
  website?: string;
  uris?: CredentialUri[];
  notes?: string;
  categoryId?: string;
  categoryIds?: string[];
  favorite: boolean;
  tags?: string[];
  customFields?: CustomField[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Payload encrypted into SQLite
 * Plaintext password, username, website, URIs, notes, and custom fields
 * are sealed inside ciphertext with AES-256-GCM.
 */
export interface EncryptedCredentialPayload {
  username?: string;
  password: string;
  website?: string;
  uris?: CredentialUri[];
  notes?: string;
  tags?: string[];
  customFields?: CustomField[];
}

export interface EncryptedCredentialRow {
  id: string;
  title: string;
  category_id: string | null;
  favorite: number; // 0 or 1 in SQLite
  encrypted_payload: string; // Base64 encoded {iv, tag, ciphertext}
  created_at: string;
  updated_at: string;
}
