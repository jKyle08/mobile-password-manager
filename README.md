# SecureVault — Secure Personal Password Manager Mobile App

A modern, production-ready, offline-first personal password manager mobile app built with **React Native + Expo + TypeScript + Expo Router + Zustand + SQLite**.

Designed with **Zero-Knowledge Architecture** and robust cryptographic standards for **Android** and **iOS**.

---

## 🔐 Security Architecture

1. **Zero-Knowledge Guarantee**: Master passwords and plaintext secrets are **never stored** in SQLite, logs, or unencrypted storage.
2. **Authenticated Encryption (AES-256-GCM)**: All credentials, notes, usernames, and URLs are encrypted using standard 256-bit AES in Galois/Counter Mode with 96-bit unique random nonces/IVs and 128-bit authentication tags.
3. **Key Derivation (PBKDF2-HMAC-SHA256 / Argon2)**: Derived from the master password using 100,000+ rounds with CSPRNG 128-bit random salts.
4. **Sentinel Verification**: Validates unlock attempts using a cryptographic sentinel block without leaking credential contents or timing.
5. **Memory Protection & Auto-Lock**: When locked (manually or via auto-lock timer/backgrounding), all decrypted credentials and keys are zeroed out and purged from in-memory state.
6. **Platform Hardware Keystore & Biometrics**: Biometric unlock uses `expo-local-authentication` and `expo-secure-store` (Android Keystore / iOS Keychain) to wrap the session key with hardware-backed security.
7. **Encrypted Backup & Restore**: Exports/imports AES-256-GCM authenticated payloads with password verification. Plaintext CSVs are strictly prohibited.
8. **Clipboard Auto-Clear**: Automatically wipes copied passwords from the clipboard after 30 seconds.

---

## 📱 Features

- **Master Password Creation & Unlock**: Real-time strength meter (entropy bits, character variety, feedback).
- **Biometric Unlock**: Face ID, Touch ID, and Android Fingerprint with master password fallback.
- **Account Management**: Full CRUD for accounts (Title, Username/Email, Password, Website, Category, Notes, Favorites).
- **Search & Filter**: Real-time local search across account names, usernames, and URLs with category chips and favorites tab.
- **Password Generator**: Cryptographically secure RNG (CSPRNG) with configurable length (8–64) and character set toggles (Uppercase, Lowercase, Numbers, Symbols).
- **Auto-Lock**: Configurable timeouts (Immediately, 1m, 5m, 15m, 30m, Never) and background detection via `AppState`.
- **Master Password Rotation**: Secure wizard that re-encrypts the entire vault and updates metadata in an atomic transaction.
- **Encrypted Backup & Import**: Tamper-evident AES-256-GCM encrypted backup files.
- **Design & Themes**: Polished Dark Mode, Light Mode, and System Default with glassmorphism touches.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (>= 18)
- npm or yarn

### Installation
```bash
# Install dependencies
npm install
```

### Running Locally
```bash
# Start Expo development server
npm start

# Run on Web browser preview
npm run web

# Run on Android emulator / device
npm run android

# Run on iOS simulator / device
npm run ios
```

### Running Automated & Security Tests
```bash
# Run Jest unit and security tests
npm test
```

---

## 🧪 Test Suite Overview

- `tests/encryption.test.ts`: AES-256-GCM encryption/decryption, PBKDF2 key derivation, nonce uniqueness, tamper detection.
- `tests/password-generator.test.ts`: CSPRNG randomness, character set coverage, entropy calculations.
- `tests/credential-repository.test.ts`: Raw SQLite record validation (verifies zero plaintext passwords stored), CRUD, and re-encryption.
- `tests/backup.test.ts`: Encrypted backup export/import validation, tampering rejection, wrong password detection.
- `tests/security-checks.test.ts`: Master password non-storage verification, sentinel validation, error message sanitization.

---

## 📂 Project Structure

```text
├── app/                                    # Expo Router navigation routes
│   ├── _layout.tsx                         # Root layout with ThemeProvider, AuthGuard & AutoLock
│   ├── index.tsx                           # Initial route orchestrator
│   ├── welcome.tsx                         # Onboarding screen
│   ├── setup.tsx                           # Master password setup & strength meter
│   ├── unlock.tsx                          # Vault unlock (Password + Biometrics)
│   └── (authenticated)/                    # Protected routes
│       ├── _layout.tsx                     # Authenticated guard layout
│       ├── vault.tsx                       # Main vault list (search, categories, favorites)
│       ├── credentials/
│       │   ├── add.tsx                     # Add account
│       │   ├── [id].tsx                    # View account & auto-hide timer
│       │   └── edit.tsx                    # Edit account
│       ├── generator.tsx                   # Standalone password generator
│       ├── categories.tsx                  # Manage categories
│       └── settings/
│           ├── index.tsx                   # Settings overview
│           ├── security.tsx                # Password change, biometrics, auto-lock
│           ├── backup.tsx                  # Encrypted backup & restore
│           └── appearance.tsx              # Theme switcher
│
├── src/
│   ├── security/                           # Cryptography & Security layer
│   │   ├── encryption.service.ts           # AES-256-GCM & PBKDF2
│   │   ├── key-manager.service.ts          # Master key lifecycle & sentinel
│   │   ├── biometrics.service.ts           # LocalAuthentication + SecureStore
│   │   ├── clipboard.service.ts            # Auto-clearing clipboard
│   │   └── password-strength.ts            # Entropy & strength evaluator
│   │
│   ├── database/                           # SQLite Persistence layer
│   │   ├── database.service.ts             # Cross-platform SQLite adapter
│   │   ├── migrations.ts                   # Schema migrations & category seeding
│   │   └── repositories/
│   │       ├── credential.repository.ts    # Encrypted credential CRUD
│   │       ├── category.repository.ts      # Categories CRUD
│   │       └── vault.repository.ts         # Metadata & initialization checks
│   │
│   ├── features/
│   │   ├── generator/                      # CSPRNG password generator
│   │   └── backup/                         # Encrypted backup export/import
│   │
│   ├── store/                              # Zustand state stores
│   │   ├── auth.store.ts                   # Auth session & key memory zeroing
│   │   ├── vault.store.ts                  # In-memory credentials
│   │   ├── settings.store.ts               # App preferences
│   │   └── category.store.ts               # Categories
│   │
│   ├── theme/                              # Design tokens (Dark/Light colors, Typography)
│   └── components/                         # UI Atoms, Inputs, Cards, Modals, Toasts
│
└── tests/                                  # Jest unit & security test suite
```
