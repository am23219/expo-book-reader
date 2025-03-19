# NextUp Widget Setup Guide

This guide explains how to set up and test the NextUp Widget for the Barakat Makkiyyah iOS app.

## Overview

The NextUp Widget shows:
- Completion status of the current "next up" section
- Progress through the current section (page x of y)
- Congratulatory message when completed
- Aesthetic design with theme colors and glow effects

## Setup Instructions

### 1. Build the React Native App

First, make sure the React Native app builds correctly:

```bash
# Install dependencies if needed
npm install

# Build the iOS app
expo prebuild --platform ios
cd ios
pod install
```

### 2. Add the Widget Target in Xcode

1. Open the Xcode workspace:
   ```
   open BarakaatMakkiyyah.xcworkspace
   ```

2. Add a new Widget Extension target:
   - Go to File > New > Target
   - Choose "Widget Extension" template
   - Name it "NextUpWidget"
   - Make sure "Include Configuration Intent" is NOT checked
   - Click "Finish"
   - When asked if you want to activate the scheme, click "Activate"

3. Copy the widget files:
   - Replace the generated widget files with the ones we created:
     - `NextUpWidget.swift`
     - `NextUpWidgetBundle.swift`
     - `Info.plist`
     - `NextUpWidget.entitlements`

### 3. Configure App Groups

1. Set up App Group for the main app:
   - Select the main BarakaatMakkiyyah target
   - Go to "Signing & Capabilities" tab
   - Click "+" and add "App Groups"
   - Add a group with identifier "group.com.barakatmakkiyyah.app"

2. Set up App Group for the widget:
   - Select the NextUpWidget target
   - Go to "Signing & Capabilities" tab
   - Click "+" and add "App Groups"
   - Add the same group: "group.com.barakatmakkiyyah.app"

### 4. Add Native Module Files

1. Make sure the WidgetDataSharing files are in the main app:
   - `BarakaatMakkiyyah/WidgetDataSharing.swift`
   - `BarakaatMakkiyyah/WidgetDataSharing.m`

2. Add the files to the Xcode project:
   - If they're not already showing in Xcode, right-click on the BarakaatMakkiyyah folder
   - Choose "Add Files to BarakaatMakkiyyah"
   - Select the files and add them

3. Update the Bridging Header:
   - Open `BarakaatMakkiyyah-Bridging-Header.h`
   - Add: `#import <React/RCTBridgeModule.h>`

### 5. Update Build Settings

1. For the main app target:
   - Go to Build Settings
   - Search for "Swift Compiler - Language"
   - Set "Swift Language Version" to Swift 5

2. For the widget target:
   - Go to Build Settings
   - Search for "Swift Compiler - Language"
   - Set "Swift Language Version" to Swift 5

### 6. Build and Run

1. Select the main app target (not the widget)
2. Choose a simulator or device
3. Build and run the app

## Testing the Widget

1. Run the app on a device or simulator
2. Use the app for a while to generate "next up" data
3. Close the app
4. Add the widget to the home screen:
   - Long press on an empty area of the home screen
   - Tap the "+" icon in the top left
   - Search for "NextUp"
   - Choose the "NextUp Progress" widget
   - Select size (small or medium)
   - Add to home screen

5. The widget should display:
   - Progress in the current "next up" section
   - Page x of y information
   - Completion status

6. As you use the app, the widget should update:
   - When you change pages
   - When you complete sections

## Troubleshooting

If the widget doesn't appear:
- Make sure the widget extension target is included in the build
- Verify the app group is correctly set up for both targets

If the widget appears but doesn't update:
- Check that the WidgetDataSharing module is correctly implemented
- Verify the updateNextUpWidget function is being called
- Look for errors in the Xcode console

If you get a build error:
- Make sure all Swift files use the same Swift version
- Check that the bridging header is properly set up
- Ensure pod dependencies are installed correctly 