# Presage AI SmartSpectra Integration Guide

## Overview
This guide will help you integrate Presage AI's SmartSpectra SDK into your StoryDrift app to monitor a child's vital signs (heart rate, breathing rate) and enhance the drift score calculations with real-time physiological data.

## Architecture
- **iOS App (Swift)**: Hosts the React web app in a WKWebView and runs SmartSpectra SDK
- **Bridge**: JavaScript bridge communicates vitals data from Swift to React
- **React App**: Receives vitals data and adjusts story pacing based on child's sleep state

---

## Part 1: Create iOS Xcode Project

### 1. Create New iOS App Project

1. Open Xcode
2. Click **File → New → Project**
3. Select **iOS → App** template
4. Configure your project:
   - Product Name: `StoryDrift`
   - Team: Select your Apple Developer team
   - Organization Identifier: `com.yourname.storydrift`
   - Interface: **SwiftUI**
   - Language: **Swift**
   - Storage: **None** (no Core Data needed)
5. Click **Create**

### 2. Add SmartSpectra SDK Package

1. In Xcode, go to **File → Add Package Dependencies...**
2. Enter repository URL: `https://github.com/Presage-Security/SmartSpectra`
3. Set **Dependency Rule** to **Branch: main**
4. Click **Add Package**
5. Select **SmartSpectraSwiftSDK** target and click **Add Package**

### 3. Configure Info.plist for Camera Permission

1. In Xcode project navigator, find `Info.plist`
2. Right-click and select **Open As → Source Code**
3. Add the following inside the `<dict>` tag:

```xml
<key>NSCameraUsageDescription</key>
<string>StoryDrift uses the camera to monitor your child's vitals during bedtime stories.</string>
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsLocalNetworking</key>
    <true/>
    <key>NSAllowsArbitraryLoadsInWebContent</key>
    <true/>
</dict>
```

### 4. Add Swift Files to Your Project

1. In Xcode, right-click your project folder
2. Select **New File → Swift File**
3. Create these three files (copy content from `/ios` folder):
   - `ContentView.swift` - Main view with WebView and SmartSpectra overlay
   - `SmartSpectraManager.swift` - Manages vitals monitoring and data
   - `WebViewBridge.swift` - Bridges Swift and JavaScript

4. **IMPORTANT**: Replace `YOUR_PRESAGE_API_KEY_HERE` in `ContentView.swift` line 11 with your actual Presage API key from [Presage Developer Portal](https://developer.presagetech.com)

### 5. Update App Entry Point

1. Find your main app file (e.g., `StoryDriftApp.swift`)
2. Update it to use ContentView:

```swift
import SwiftUI

@main
struct StoryDriftApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}
```

### 6. Build Settings

1. Select your project in the navigator
2. Select your app target
3. Go to **Signing & Capabilities** tab
4. Select your development team
5. Go to **General** tab
6. Set **Minimum Deployments** to **iOS 15.0**
7. Under **Frameworks, Libraries, and Embedded Content**, verify `SmartSpectraSwiftSDK` is listed

---

## Part 2: Test iOS App

### 1. Connect Physical Device

**IMPORTANT**: SmartSpectra SDK requires a physical iOS device. It will NOT work in the simulator.

1. Connect your iPhone/iPad via USB
2. In Xcode, select your device from the device dropdown (top toolbar)
3. Trust the device if prompted

### 2. Run the App

1. Click the **Play** button (▶) in Xcode toolbar
2. The app will:
   - Build and install on your device
   - Request camera permission (tap **Allow**)
   - Load your React app from `http://localhost:5174`
   - Show SmartSpectra camera view in bottom-right corner

### 3. Development Mode Setup

For local development, ensure your React dev server is running:

```bash
cd /Users/catherinesusilo/HackCanada2026
npm run dev
```

Make sure your iPhone and Mac are on the **same Wi-Fi network** so the iOS app can access `http://localhost:5174`.

---

## Part 3: React App Integration (Already Complete!)

The following files have been updated in your React app:

### Files Modified:
1. **`src/app/components/VitalsMonitor.tsx`** (new)
   - Displays heart rate, breathing rate, signal quality
   - Shows sleep status indicator
   - Listens for vitals data from iOS bridge

2. **`src/app/components/StoryScreen.tsx`** (updated)
   - Imports and displays VitalsMonitor in info panel
   - Blends vitals-based sleepiness (40%) with time-based drift (60%)
   - Auto-completes story when child is detected as asleep

### How It Works:

1. **iOS sends vitals data** → Swift calls `window.receiveVitalsData(data)`
2. **React receives data** → VitalsMonitor component listens for `vitalsUpdate` event
3. **Drift score adjusts** → Story pacing changes based on actual sleep state
4. **Visual feedback** → VitalsMonitor shows color-coded status (orange → yellow → blue → green)

---

## Part 4: Testing the Full Integration

### 1. Start Backend Server
```bash
npm run server
```
(Should show "Server running on port 3001")

### 2. Start React Dev Server
```bash
npm run dev
```
(Should show "Local: http://localhost:5174")

### 3. Run iOS App in Xcode
- Connect physical iOS device
- Click Play (▶) in Xcode
- Allow camera permission

### 4. Test the Flow

1. In the iOS app, fill out the story setup form
2. Click "Begin Tonight's Story"
3. **Check Info Panel** (tap Info button in top-right):
   - Should show VitalsMonitor card
   - Status should show "Waiting for data..." then update
4. **Position face in camera** (small view in bottom-right)
5. **Watch vitals update**:
   - Heart rate updates every few seconds
   - Breathing rate appears
   - Signal quality bar shows green when good
6. **Observe drift score**:
   - Score accelerates if vitals show sleepiness
   - Story completes faster when child is detected as asleep

### 5. Expected Behavior

- **Awake child**: Orange/yellow status, drift increases slowly
- **Getting sleepy**: Blue status, drift increases moderately
- **Asleep**: Green status, drift jumps to 85+, story completes

---

## Part 5: Production Build

When ready to deploy:

### 1. Build React App for Production
```bash
npm run build
```
This creates a `dist/` folder with optimized files.

### 2. Add Build Output to Xcode

1. In Finder, drag the `dist` folder into your Xcode project
2. Check **Copy items if needed**
3. Check **Create folder references** (not groups)
4. Add to your app target

### 3. Update WebViewBridge.swift

In `WebViewBridge.swift`, the code already handles this:
- **DEBUG mode**: Loads from `http://localhost:5174`
- **Release mode**: Loads from bundled `dist/index.html`

### 4. Build for Release

1. In Xcode: **Product → Archive**
2. Submit to App Store or distribute via TestFlight

---

## Troubleshooting

### Camera Not Working
- Verify you're using a **physical device** (not simulator)
- Check camera permission in iOS Settings → StoryDrift
- Ensure good lighting for best signal quality

### Web App Not Loading
- Verify React dev server is running (`npm run dev`)
- Check iPhone and Mac are on same Wi-Fi network
- Try accessing `http://YOUR_MAC_IP:5174` in Safari on iPhone first
- Check Xcode console for error messages

### No Vitals Data in React
- Open Safari Web Inspector: Safari → Develop → [Your iPhone] → localhost
- Check JavaScript console for errors
- Verify `window.storyDriftBridge` exists in console
- Check that `vitalsUpdate` events are firing

### Signal Quality Low
- Ensure good lighting (not too bright, not too dark)
- Hold camera steady
- Make sure face is fully visible
- Remove glasses if causing glare

---

## API Key Management

### Get Your Presage API Key

1. Go to [Presage Developer Portal](https://developer.presagetech.com)
2. Sign up or log in
3. Create a new project
4. Copy your API key
5. Paste in `ContentView.swift` line 11

### Security Note

The API key is embedded in the iOS app (native Swift), not in the web code, so it remains secure.

---

## Files Reference

### iOS Files (in `/ios` folder):
- `ContentView.swift` - Main SwiftUI view
- `SmartSpectraManager.swift` - Vitals monitoring logic
- `WebViewBridge.swift` - Swift ↔ JavaScript communication

### React Files (updated):
- `src/app/components/VitalsMonitor.tsx` - Vitals display component
- `src/app/components/StoryScreen.tsx` - Integrated vitals into story screen

---

## Next Steps

1. ✅ Get Presage API key from developer portal
2. ✅ Create Xcode project and add Swift files
3. ✅ Configure Info.plist permissions
4. ✅ Test on physical device
5. ✅ Monitor vitals during story playback
6. 🎉 Demo your app!

---

## Support

- **Presage Documentation**: https://docs.presagetech.com
- **SmartSpectra GitHub**: https://github.com/Presage-Security/SmartSpectra
- **Issues**: Check Xcode console and browser DevTools console

---

**Ready to test!** Run your iOS app, start a bedtime story, and watch the vitals monitor track your child's journey to sleep. 🌙
