#!/bin/bash
set -e

echo "Building Lambda Layer for Playwright..."

# Create layer directory structure
mkdir -p layer/python

# Install dependencies to layer
pip install playwright beautifulsoup4 soupsieve -t layer/python/ --upgrade --no-cache-dir

# Install Playwright browsers
cd layer/python
PLAYWRIGHT_BROWSERS_PATH=. python -m playwright install chromium --with-deps
cd ../..

# Package layer
cd layer
zip -r9 ../playwright-layer.zip . -x "*.pyc" -x "*__pycache__*" -x "*.dist-info*"
cd ..

echo "Layer built: playwright-layer.zip"
ls -lh playwright-layer.zip
