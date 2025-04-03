#!/bin/bash

# Script to extract images from EPUB books and upload them to Cloudflare R2
# Usage: ./extract-epub-images.sh /path/to/book.epub [destination-prefix]

# Set your Cloudflare R2 credentials here or export them before running the script
export R2_ACCESS_KEY_ID="7a064bcd53f8eec5badd57b2cc86139d"
export R2_SECRET_ACCESS_KEY="2d27cec8c7f925cfaa0cf63103200d94ea2f15ea8cd6cfb982914b3b39323d7d"
export R2_ENDPOINT="https://14b53d342af30bc98a35505e227b37aa.r2.cloudflarestorage.com"

# Check if EPUB path is provided
if [ -z "$1" ]; then
  echo "Usage: ./extract-epub-images.sh /path/to/book.epub [destination-prefix]"
  exit 1
fi

# Install dependencies if needed
if [ ! -d "../node_modules/@aws-sdk/client-s3" ]; then
  echo "Installing required dependencies..."
  cd ..
  npm install @aws-sdk/client-s3
  cd scripts
fi

# Run the EPUB extraction and upload script
node extract-epub-images.js "$@"

echo "Script completed!" 