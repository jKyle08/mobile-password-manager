// Web Crypto API Zero-Knowledge encryption engine
const PBKDF2_ITERATIONS = 100000;
const KEY_LENGTH = 256;

// Convert buffer to Base64 string
export function bufferToBase64(buf) {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Convert Base64 string to ArrayBuffer
export function base64ToBuffer(base64) {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Generate random salt (16 bytes)
export function generateSalt() {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  return bufferToBase64(salt);
}

// Generate random IV (12 bytes for AES-GCM)
export function generateIv() {
  return window.crypto.getRandomValues(new Uint8Array(12));
}

// Derive AES-GCM 256-bit encryption key from Master Password & Salt using PBKDF2
export async function deriveKey(masterPassword, saltBase64) {
  const enc = new TextEncoder();
  const saltBuffer = base64ToBuffer(saltBase64);

  // Import raw password as key material
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(masterPassword),
    { name: 'PBKDF2' },
    false,
    ['deriveKey', 'deriveBits']
  );

  // Derive AES-GCM Key
  const derivedKey = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: new Uint8Array(saltBuffer),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );

  return derivedKey;
}

// Compute SHA-256 verification hash of the master password + salt (to verify unlock without storing password)
export async function computePasswordVerifier(masterPassword, saltBase64) {
  const enc = new TextEncoder();
  const saltBuffer = new Uint8Array(base64ToBuffer(saltBase64));
  const passwordBytes = enc.encode(masterPassword);

  const combined = new Uint8Array(passwordBytes.length + saltBuffer.length);
  combined.set(passwordBytes);
  combined.set(saltBuffer, passwordBytes.length);

  const hashBuffer = await window.crypto.subtle.digest('SHA-256', combined);
  return bufferToBase64(hashBuffer);
}

// Encrypt plaintext payload with AES-GCM
export async function encryptVaultData(plainObject, cryptoKey) {
  const enc = new TextEncoder();
  const plainText = JSON.stringify(plainObject);
  const encodedData = enc.encode(plainText);
  const iv = generateIv();

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    cryptoKey,
    encodedData
  );

  return {
    iv: bufferToBase64(iv),
    ciphertext: bufferToBase64(encryptedBuffer)
  };
}

// Decrypt ciphertext with AES-GCM
export async function decryptVaultData(encryptedPayload, cryptoKey) {
  try {
    const iv = new Uint8Array(base64ToBuffer(encryptedPayload.iv));
    const ciphertext = base64ToBuffer(encryptedPayload.ciphertext);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      cryptoKey,
      ciphertext
    );

    const dec = new TextDecoder();
    const jsonString = dec.decode(decryptedBuffer);
    return JSON.parse(jsonString);
  } catch (err) {
    console.error('Decryption failed:', err);
    throw new Error('Invalid master password or corrupted vault data.');
  }
}
