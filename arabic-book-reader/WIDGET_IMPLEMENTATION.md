# Barakat Makkiyyah iOS Widget Implementation Guide

This guide explains how to implement the iOS widget that displays the book name and reading progress from the past 7 days.

## Overview

The widget implementation consists of:

1. A widget extension for iOS (WidgetKit)
2. A native module for sharing data between the app and widget
3. JavaScript utilities for updating the widget data

## Files Created

### Widget Extension Files

- `ios/BarakatMakkiyyahWidget/BarakatMakkiyyahWidget.swift`: Main widget implementation
- `ios/BarakatMakkiyyahWidget/BarakatMakkiyyahWidgetBundle.swift`: Widget entry point
- `ios/BarakatMakkiyyahWidget/Info.plist`: Widget configuration
- `ios/BarakatMakkiyyahWidget/README.md`: Widget setup instructions

### Native Module Files

- `ios/BarakatMakkiyyah/WidgetDataSharing.swift`: Native module implementation
- `ios/BarakatMakkiyyah/WidgetDataSharing.m`: Objective-C bridge

### JavaScript Utilities

- `utils/widgetSharing.ts`: Utilities for updating widget data

## Implementation Details

### 1. Widget Extension

The widget extension uses WidgetKit to create a home screen widget that displays:

- The current book title
- Reading progress for the past 7 days (visualized as dots)
- Current and longest reading streaks

The widget comes in two sizes:
- Small: Compact view with just the book title and progress dots
- Medium: Expanded view with day labels and streak information

### 2. Data Sharing

Data is shared between the app and widget using:

1. A shared App Group (configured in app.config.js)
2. UserDefaults to store the data in a shared container
3. A native module to handle the data transfer

### 3. Integration with Reading Streak

The widget automatically updates when:
- The user completes a reading session
- The reading streak is updated
- The current book changes

## Setup in Xcode

After running `expo prebuild` or `expo run:ios`, you'll need to:

1. Open the Xcode project
2. Add the Widget Extension target
3. Configure App Groups for both targets
4. Add the widget files to the extension
5. Build and run

Detailed instructions are in `ios/BarakatMakkiyyahWidget/README.md`.

## Usage in React Native

The widget data is automatically updated when the reading streak is updated. The `updateWidgetWithReadingProgress` function is called in the `updateReadingStreak` function in the `useReadingStreak` hook.

If you need to manually update the widget data, you can use:

```typescript
import { updateWidgetWithReadingProgress } from '../utils/widgetSharing';

// Update widget data
await updateWidgetWithReadingProgress(
  bookTitle,
  readingDays,
  currentStreak,
  longestStreak
);
```

## Testing

To test the widget:

1. Build and run the app on a real device or simulator
2. Add the widget to the home screen
3. Use the app to read and complete sections
4. Verify that the widget updates with your reading progress

## Troubleshooting

- If the widget doesn't update, check that the App Group is correctly configured
- Make sure the native module is properly linked
- Verify that the widget data is being saved correctly in the shared UserDefaults

## Future Improvements

- Add more widget sizes (large)
- Add widget configuration options
- Add deep linking from the widget to the app
- Add more visual customization options 