# PDF to Images Conversion

This project uses image-based rendering for PDFs to ensure smooth performance in React Native. Follow these steps to convert the PDF into images:

## Prerequisites

1. Install Python (3.6 or higher)
2. Install Poppler utilities (required for PDF to image conversion):
   
   **Mac**:
   ```
   brew install poppler
   ```
   
   **Linux (Ubuntu/Debian)**:
   ```
   sudo apt install poppler-utils
   ```
   
   **Windows**: 
   Download [Poppler for Windows](https://github.com/oschwartz10612/poppler-windows/releases) and add it to your system path.

3. Install required Python packages:
   ```
   pip install pdf2image pillow
   ```

## Converting PDF to Images

Run the conversion script:

```
python scripts/convert_pdf_to_images.py
```

This will:
1. Read the PDF from `assets/pdf/Barakaat_Makiyyah.pdf`
2. Convert each page to a PNG image (300 DPI for good quality)
3. Save the images to `assets/pdf_pages/` as `page_1.png`, `page_2.png`, etc.

## Updating the Pages List

After conversion, you may need to update the list of pages in `constants/pdfPages.ts` to include all pages.

## Performance Considerations

- Images are loaded with higher performance than PDFs in React Native
- The FlatList component with inverted layout ensures right-to-left navigation
- Navigation controls and page indicators are preserved from the PDF viewer 