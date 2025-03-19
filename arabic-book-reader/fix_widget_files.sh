#!/bin/bash

# This script fixes the NextUpWidgetExtension target to avoid React Native imports

# Make the script executable
chmod +x fix_widget_files.sh

# Create a custom implementation of WidgetDataSharing.m for the widget extension
echo "// Custom implementation for widget extension - no React Native imports" > NextUpWidget/WidgetDataSharing_widget.m

# Check if WidgetDataSharing.m is included in the widget extension target
# This is a simplified approach - in a real scenario, you would need to parse the Xcode project file
# and update the file references, which is complicated via shell script

echo "Please open the Xcode project and do the following manually:"
echo "1. Select the NextUpWidgetExtension target"
echo "2. In Build Phases > Compile Sources, remove WidgetDataSharing.m"
echo "3. Add NextUpWidget/dummy.m to the compilation sources instead"
echo 
echo "Then run the build again" 