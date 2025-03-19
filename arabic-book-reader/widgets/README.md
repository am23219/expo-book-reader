# Widget Files for Drag and Drop

These files are ready to be dragged and dropped into your Xcode project after creating a new widget extension.

## Widget Extension Files

Located in `NextUpWidget/`:

- `NextUpWidget.swift`: Main widget implementation with UI
- `NextUpWidgetBundle.swift`: Widget entry point
- `Info.plist`: Widget configuration
- `NextUpWidget.entitlements`: Widget App Group permissions

## Native Module Files

Located in the root of this folder:

- `WidgetDataSharing.swift`: Native module implementation
- `WidgetDataSharing.m`: Objective-C bridge

## How to Use

1. Create a new Widget Extension in Xcode
2. Drag and drop these files to replace the generated ones
3. Configure App Groups in Xcode for both targets
4. Build and run

For detailed instructions, see the `NEXT_UP_WIDGET_SETUP.md` file in the project root. 