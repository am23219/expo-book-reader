#!/usr/bin/env python3
"""
Script to auto-generate the pdfPages.ts file from actual image files
"""
import os
import re

# Path to the images folder
PDF_PAGES_DIR = "assets/pdf_pages"

# Output file
OUTPUT_FILE = "constants/pdfPages.ts"

def main():
    # Check if directory exists
    if not os.path.exists(PDF_PAGES_DIR):
        print(f"Error: Directory {PDF_PAGES_DIR} does not exist.")
        return False
    
    # Get all PNG files
    image_files = [f for f in os.listdir(PDF_PAGES_DIR) if f.endswith('.png')]
    
    if not image_files:
        print(f"Error: No PNG files found in {PDF_PAGES_DIR}.")
        return False
    
    # Sort files numerically
    image_files.sort(key=lambda x: int(re.search(r'page_(\d+)\.png', x).group(1)))
    
    # Create the TypeScript file content
    ts_content = "export const pdfPages = [\n"
    
    # Add each file as a require statement
    for image_file in image_files:
        ts_content += f'  require("../assets/pdf_pages/{image_file}"),\n'
    
    # Close the array
    ts_content += "];\n"
    
    # Write to file
    with open(OUTPUT_FILE, 'w') as f:
        f.write(ts_content)
    
    print(f"✅ Successfully generated {OUTPUT_FILE} with {len(image_files)} pages.")
    return True

if __name__ == "__main__":
    main() 