#!/bin/bash
# Script to convert PDF to images

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}==== PDF to Images Conversion Tool ====${NC}"

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Python 3 is not installed. Please install Python 3 first.${NC}"
    exit 1
fi

# Check if poppler-utils is installed
if ! command -v pdftoppm &> /dev/null; then
    echo -e "${YELLOW}Poppler utilities not found. Attempting to install...${NC}"
    
    # Check OS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            echo "Installing poppler via Homebrew..."
            brew install poppler
        else
            echo -e "${RED}Homebrew is not installed. Please install Homebrew first, then run:${NC}"
            echo -e "${YELLOW}brew install poppler${NC}"
            exit 1
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        echo "Installing poppler-utils via apt..."
        sudo apt update && sudo apt install -y poppler-utils
    else
        echo -e "${RED}Unsupported OS. Please install poppler manually.${NC}"
        echo "For Windows: Download from https://github.com/oschwartz10612/poppler-windows/releases"
        exit 1
    fi
fi

# Install required Python packages
echo -e "${YELLOW}Installing required Python packages...${NC}"
pip install pdf2image pillow

# Create output directory
mkdir -p assets/pdf_pages

# Run the conversion script
echo -e "${YELLOW}Converting PDF to images...${NC}"
python3 scripts/convert_pdf_to_images.py

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Conversion complete!${NC}"
    echo -e "${YELLOW}Images saved to assets/pdf_pages/${NC}"
    
    # Generate the pdfPages.ts file
    echo -e "${YELLOW}Generating pdfPages.ts file...${NC}"
    python3 scripts/generate_pdf_pages_list.py
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ pdfPages.ts file generated successfully!${NC}"
        echo -e "${GREEN}✅ PDF to images conversion process complete.${NC}"
    else
        echo -e "${RED}❌ Failed to generate pdfPages.ts file.${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ Conversion failed.${NC}"
    exit 1
fi 