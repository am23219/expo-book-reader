# Barakat Makiyyah Arabic Book Reader

An elegant, Islamic-styled PDF reader app specifically designed for reading Arabic books with right-to-left swiping navigation.

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

## PDF File

This app is specifically designed to display the "Barakat Makiyyah" PDF. The PDF file should be placed in:
```
assets/pdf/Barakaat_Makiyyah.pdf
```

## Dependencies

- react-native
- react-native-pdf
- react-native-gesture-handler
- @expo/vector-icons
- expo-font
- expo-file-system

## Usage

The app automatically loads the Barakat Makiyyah PDF. You can navigate through the book using:

- **Swipe Left/Right**: Turn pages
- **Tap Left/Right Edges**: Turn pages
- **Zoom Controls**: Buttons in the bottom-left corner
- **Progress Bar**: Shows your position in the book

## Customization

To use a different PDF or change the styling:

1. Replace the PDF file in `assets/pdf/`
2. Update the book title in `App.js`
3. Modify the colors in the styles section of `PDFReaderComponent.js`

## Credits

- Font: Amiri (https://github.com/alif-type/amiri)
- Icons: Feather Icons from @expo/vector-icons

## License

MIT
