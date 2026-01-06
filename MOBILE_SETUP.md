# 📱 Mobile App Setup Guide (Capacitor)

This guide explains how to build the native Android and iOS applications aka "Grow Your Need Vision" for mobile.

## 📋 Prerequisites

- **Node.js**: 18+ (You already have this)
- **Android Studio**: For building the Android app (Download from [developer.android.com](https://developer.android.com/studio))
- **Xcode**: For building the iOS app (Mac only, download from App Store)

## 🚀 Quick Start

The project is already initialized with Capacitor.

### 1. Sync Web Assets
Whenever you make changes to the React code (`src/**`), you must rebuild and sync:

```bash
pnpm build
npx cap sync
```

### 2. Run on Android Emulator/Device

1.  Open the `android` folder in Android Studio:
    ```bash
    npx cap open android
    ```
2.  Wait for Gradle sync to complete.
3.  Click the "Run" button (Green arrow) to launch on an emulator or connected device.

### 3. Run on iOS Simulator/Device (Mac Only)

1.  Open the `ios` folder in Xcode:
    ```bash
    npx cap open ios
    ```
2.  Select a Simulator (e.g., iPhone 15).
3.  Click the "Play" button to build and run.

## 🛠 Troubleshooting

### "Web View is Empty"
- This usually means the `dist` folder wasn't synced. Run `npx cap copy`.
- Or, your routing configuration might need hash routing if standard history API fails (rare in modern Capacitor).

### "Gradle Sync Failed"
- Ensure you have the compatible Java JDK installed (usually JDK 17).
- Update Android Studio to the latest version.

## 📱 Features

- **PWA Install Prompt**: Users can install the web version directly.
- **Native Plugins**:
    - **Camera**: For scanning documents/QR codes (Coming soon)
    - **Push Notifications**: For alerts (Coming soon)
    - **Haptics**: For vibration feedback (Coming soon)
