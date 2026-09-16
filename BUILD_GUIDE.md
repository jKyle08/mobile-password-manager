# 📱 Mobile Build & APK Generation Guide for SecureVault

This guide provides step-by-step instructions for building installable **Android APK / AAB** and **iOS** packages for SecureVault.

---

## Table of Contents
1. [Prerequisites & Build Options](#1-prerequisites--build-options)
2. [Method 1: Cloud Build with EAS (Recommended - No SDK Setup Required)](#2-method-1-cloud-build-with-eas-recommended)
   - [Generating Android APK (Direct Phone Install)](#a-generating-android-apk-direct-phone-install)
   - [Generating Android AAB (Google Play Store)](#b-generating-android-aab-google-play-store)
   - [Generating iOS IPA / Simulator Build](#c-generating-ios-builds)
3. [Method 2: Local Android APK Build (Offline / On Your Machine)](#3-method-2-local-android-apk-build-offline)
4. [Method 3: Local iOS Build (macOS with Xcode)](#4-method-3-local-ios-build-macos-only)
5. [Installing the APK on Android Devices](#5-installing-the-apk-on-android-devices)
6. [Troubleshooting & FAQs](#6-troubleshooting--faqs)

---

## 1. Prerequisites & Build Options

| Method | Best For | Requirements |
| :--- | :--- | :--- |
| **EAS Cloud Build** *(Recommended)* | Quickest & easiest for everyone. Builds in cloud. | Free [Expo Account](https://expo.dev) |
| **Local Android Build** | Offline building on Windows/Linux/Mac. | JDK 17, Android Studio & SDK |
| **Local iOS Build** | Native iOS builds without cloud limits. | macOS with Xcode installed |

---

## 2. Method 1: Cloud Build with EAS (Recommended)

Expo Application Services (EAS) compiles the app in the cloud, requiring zero native SDK configuration on your PC.

### Step 1: Install / Use EAS CLI
EAS CLI is already set up via `npx`. You do not need to install anything globally:
```bash
npx eas-cli --version
```

### Step 2: Log into your Expo Account
If you don't have an Expo account yet, create one for free at [expo.dev/signup](https://expo.dev/signup).
```bash
npx eas-cli login
```

### Step 3: Link Project (First Time Only)
```bash
npx eas-cli project:init
```

---

### A. Generating Android APK (Direct Phone Install)
An **APK** file can be transferred to any Android device and installed directly.

Run:
```bash
npx eas-cli build -p android --profile preview
```

**What happens next:**
1. EAS will build the `.apk` in the cloud.
2. In the terminal, you will get a **direct download URL** and a **QR Code**.
3. Scan the QR code with your Android phone to download and install the APK immediately.

---

### B. Generating Android AAB (Google Play Store)
An **AAB** (Android App Bundle) is required when submitting to the Google Play Console:
```bash
npx eas-cli build -p android --profile production
```

---

### C. Generating iOS Builds

> **Note**: Apple requires an active Apple Developer account for physical device distribution.

* **For iOS Simulator testing (No Apple Developer account needed)**:
  ```bash
  npx eas-cli build -p ios --profile preview
  ```
* **For Physical iOS Device / Ad-Hoc / TestFlight**:
  ```bash
  npx eas-cli build -p ios --profile preview-device
  ```

---

## 3. Method 2: Local Android APK Build (Offline)

If you have **Android Studio** and **Java JDK 17** installed on your machine, you can build the APK locally without Expo cloud.

### Step 1: Verify Java & Android Environment
Ensure `JAVA_HOME` and `ANDROID_HOME` environment variables are set:
```bash
java -version
```

### Step 2: Generate Native Android Project
Run Expo prebuild to create the native `android/` directory:
```bash
npx expo prebuild --platform android
```

### Step 3: Compile Release APK

* **On Windows (PowerShell / Command Prompt)**:
  ```powershell
  cd android
  .\gradlew.bat assembleRelease
  ```

* **On macOS / Linux**:
  ```bash
  cd android
  ./gradlew assembleRelease
  ```

### Step 4: Locate Output APK
After the Gradle build completes, your standalone installable APK is located at:
```
android/app/build/outputs/apk/release/app-release.apk
```

---

## 4. Method 3: Local iOS Build (macOS Only)

1. Generate the native iOS project:
   ```bash
   npx expo prebuild --platform ios
   ```
2. Install CocoaPods:
   ```bash
   cd ios && pod install && cd ..
   ```
3. Open in Xcode or build via CLI:
   ```bash
   npx expo run:ios --configuration Release
   ```

---

## 5. Installing the APK on Android Devices

1. Transfer `app-release.apk` to your phone via USB, Google Drive, WhatsApp, or scan the EAS QR code.
2. Tap on the `.apk` file on your phone.
3. If prompted with *"For your security, your phone is not allowed to install unknown apps from this source"*:
   - Tap **Settings** ➔ Toggle on **"Allow from this source"**.
4. Tap **Install** ➔ Open **SecureVault**.
5. Set up your Master Password and Biometrics!

---

## 6. Troubleshooting & FAQs

### Q: Google Play Protect shows a warning when installing the APK?
> **Answer**: This is normal for newly built standalone APKs not yet registered with Google Play. Tap **"More details"** ➔ **"Install anyway"**.

### Q: How do I test the app immediately without building an APK?
> **Answer**:
> 1. Run `npx expo start` in your project folder.
> 2. Install **Expo Go** from Google Play Store or Apple App Store on your phone.
> 3. Scan the terminal QR code using Expo Go to open the live app instantly.

### Q: How do I clean and re-trigger a fresh build?
```bash
# Clean prebuild native folders
npx expo prebuild --clean

# Clear Metro cache
npx expo start -c
```
