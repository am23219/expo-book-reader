#!/bin/bash

# Remove the ReactCommon modulemap file in Headers/Public which is causing the duplicate
rm -f ios/Pods/Headers/Public/ReactCommon/ReactCommon.modulemap

# Create a backup of the original podfile
cp ios/Podfile ios/Podfile.backup

# Clean build artifacts
rm -rf ios/build
rm -rf ios/Pods

# Reinstall pods with the fixed configuration
cd ios && pod install && cd ..

echo "ReactCommon modulemap issue fixed. You can now try building the app." 