#!/bin/bash

# Script to upload character files to Cloudflare R2
# Usage: ./upload-to-r2.sh

# Set your Cloudflare R2 credentials here or export them before running the script
export R2_ACCESS_KEY_ID="7a064bcd53f8eec5badd57b2cc86139d"
export R2_SECRET_ACCESS_KEY="2d27cec8c7f925cfaa0cf63103200d94ea2f15ea8cd6cfb982914b3b39323d7d"
export R2_ENDPOINT="https://14b53d342af30bc98a35505e227b37aa.r2.cloudflarestorage.com"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Run the upload script
node upload-characters.js
