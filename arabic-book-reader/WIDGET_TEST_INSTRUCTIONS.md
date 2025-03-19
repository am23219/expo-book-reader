# NextUp Widget Testing Instructions

This document provides instructions for testing the enhanced NextUp Widget for the Barakat Makkiyyah app.

## Overview of Implemented Features

The NextUp Widget has been enhanced with the following features:

1. **Book Title Display**
   - Shows the name of the book at the top in a prominent font

2. **Daily Section Status Check**
   - Indicates if the user has checked their section today
   - Displays "Today's section is pending" if not checked today
   - Shows "In Progress" if the user has interacted with the section today

3. **Enhanced Progress Display**
   - Page count: "Page X of Y"
   - Horizontal progress bar with theme colors and glow effect
   - Percentage display showing completion (e.g., "75% Complete")
   - Congratulatory message when a section is completed

4. **UI Improvements**
   - Modern aesthetic with theme colors
   - Smooth animations in the progress bar
   - Optimized layout for both small and medium widget sizes

## Testing Procedure

### 1. Building and Installing the Widget

1. Build the iOS app with the latest widget code:
   ```bash
   cd ios
   pod install
   cd ..
   npm run ios
   ```

2. After installing the app on a device or simulator, add the widget to the home screen:
   - Long press on an empty area of the home screen
   - Tap the "+" icon in the top left
   - Search for "NextUp"
   - Choose the "Next Up Progress" widget
   - Select size (small or medium)
   - Add to home screen

### 2. Testing Different States

#### Book Title Display
- The widget should display "Barakaat Makkiyyah" or the title of the current book
- Verify that the title is visible at the top of the widget

#### Not Started (Pending) State
- To test this state, install the app but don't open it for a full day
- The widget should display "Today's section is pending"
- Progress bar should show the last saved progress

#### In Progress State
- Open the app and navigate through some pages
- The widget should update to show:
  - "In Progress" status
  - Current page number (e.g., "Page 3 of 10")
  - Progress bar filled proportionally
  - Percentage completion

#### Completed State
- Complete a section in the app
- The widget should display:
  - "Congrats!"
  - "You've completed your next up section!"
  - "Keep going to read more!"

### 3. Testing Widget Updates

- Change pages in the app and verify the widget updates
- Complete a section and verify the completion message appears
- Close and reopen the app to verify persistence
- Test on both small and medium widget sizes

## Verification Checklist

- [ ] Book title is displayed correctly
- [ ] Daily status shows appropriate messages (pending/in progress)
- [ ] Progress bar is visually appealing with glow effect
- [ ] Progress percentage is accurate
- [ ] Completed state shows congratulatory message
- [ ] Widget updates promptly when app state changes
- [ ] Layout works well on both small and medium sizes
- [ ] Animations are smooth and appealing
- [ ] All text is legible and properly sized

## Troubleshooting

If the widget doesn't update:
- Ensure the app has the appropriate App Group entitlements
- Verify the Widget Extension target is properly configured
- Check Xcode console for any widget-related errors
- Try removing and adding the widget again

For any persistent issues, check the logs for error messages related to widget updating or data sharing. 