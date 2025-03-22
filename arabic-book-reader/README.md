# Barakat Makiyyah Arabic Book Reader

An elegant, Islamic-styled book reader app specifically designed for reading Arabic books with right-to-left swiping navigation.

## Features

- **Right-to-Left Navigation**: Optimized for Arabic books with proper text direction
- **Islamic Decorative Border**: Beautiful border design inspired by traditional Arabic books
- **Touch Gestures**: Smooth swipe gestures for turning pages
- **Elegant UI**: Clean interface with page progress indicator
- **Page Numbering**: Decorative page number badge
- **Zoom Controls**: Easily zoom in/out for comfortable reading

## Setup

1. Install dependencies:
```
npm install
```

2. Start the app:
```
npm start
```

## Image Files

This app is specifically designed to display the "Barakat Makiyyah" book as a series of page images. The page images should be placed in:
```
assets/images/pages/
```

## Dependencies

- react-native
- react-native-gesture-handler
- @expo/vector-icons
- expo-font
- expo-file-system

## Usage

The app automatically loads the Barakat Makiyyah page images. You can navigate through the book using:

- **Swipe Left/Right**: Turn pages
- **Tap Left/Right Edges**: Turn pages
- **Zoom Controls**: Buttons in the bottom-left corner
- **Progress Bar**: Shows your position in the book

## Customization

To use different images or change the styling:

1. Replace the image files in `assets/images/pages/`
2. Update the book title in `App.js`
3. Modify the colors in the styles section of `PDFReaderComponent.js`

## Credits

- Font: Amiri (https://github.com/alif-type/amiri)
- Icons: Feather Icons from @expo/vector-icons

## License

MIT
