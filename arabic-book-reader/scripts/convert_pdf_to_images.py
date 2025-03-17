import os
from pdf2image import convert_from_path

# Path to the PDF inside your assets folder
PDF_PATH = "assets/pdf/Barakaat_Makiyyah.pdf"

# Output folder for images
OUTPUT_FOLDER = "assets/pdf_pages"
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

# Convert PDF to images (300 DPI for good quality)
images = convert_from_path(PDF_PATH, dpi=300)

# Save each page as a PNG
for i, image in enumerate(images):
    output_path = os.path.join(OUTPUT_FOLDER, f"page_{i+1}.png")
    image.save(output_path, "PNG")
    print(f"Saved: {output_path}")

print("✅ PDF converted successfully!") 