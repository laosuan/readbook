#!/usr/bin/env node

/**
 * Script to extract images from EPUB books and upload them to Cloudflare R2
 * Usage: node extract-epub-images.js /path/to/book.epub [destination-prefix]
 * 
 * Environment variables required:
 * - R2_ACCESS_KEY_ID: Your Cloudflare R2 access key ID
 * - R2_SECRET_ACCESS_KEY: Your Cloudflare R2 secret access key
 * - R2_ENDPOINT: Your Cloudflare R2 endpoint URL
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const util = require('util');
const execPromise = util.promisify(exec);

// Configuration
const TEMP_DIR = path.join(__dirname, '../temp-epub-extract');
const BUCKET_NAME = 'readwordly';
const DEFAULT_PREFIX = 'bookimages/';

// Initialize S3 client with R2 configuration
const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// Ensure temporary directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

function getContentType(fileName) {
  const extension = path.extname(fileName).toLowerCase();
  switch (extension) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.gif':
      return 'image/gif';
    case '.svg':
      return 'image/svg+xml';
    case '.webp':
      return 'image/webp';
    default:
      return 'application/octet-stream';
  }
}

async function extractEpub(epubPath) {
  console.log(`Extracting EPUB: ${epubPath}`);
  
  // Clean temp directory
  fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  fs.mkdirSync(TEMP_DIR, { recursive: true });
  
  try {
    // Extract EPUB using unzip
    await execPromise(`unzip -o "${epubPath}" -d "${TEMP_DIR}"`);
    console.log('EPUB extracted successfully');
    
    // Find all image files
    const imageFiles = [];
    function findImagesRecursively(dir) {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          findImagesRecursively(filePath);
        } else {
          const ext = path.extname(file).toLowerCase();
          if (['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'].includes(ext)) {
            imageFiles.push(filePath);
          }
        }
      }
    }
    
    findImagesRecursively(TEMP_DIR);
    console.log(`Found ${imageFiles.length} images in EPUB`);
    
    return imageFiles;
  } catch (error) {
    console.error('Error extracting EPUB:', error);
    throw error;
  }
}

async function uploadFile(filePath, destinationPrefix) {
  const fileName = path.basename(filePath);
  const key = `${destinationPrefix}${fileName}`;
  const fileContent = fs.readFileSync(filePath);
  
  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
    Body: fileContent,
    ContentType: getContentType(fileName),
  };

  try {
    const command = new PutObjectCommand(params);
    const response = await s3Client.send(command);
    console.log(`✅ Successfully uploaded: ${fileName} to ${key}`);
    return response;
  } catch (error) {
    console.error(`❌ Error uploading ${fileName}:`, error);
    throw error;
  }
}

async function main() {
  try {
    // Get command line arguments
    const args = process.argv.slice(2);
    if (args.length < 1) {
      console.error('Usage: node extract-epub-images.js /path/to/book.epub [destination-prefix]');
      process.exit(1);
    }
    
    const epubPath = args[0];
    const bookName = path.basename(epubPath, path.extname(epubPath));
    // Use provided prefix or create one based on book name
    const destinationPrefix = args[1] || `${DEFAULT_PREFIX}${bookName}/`;
    
    console.log(`Processing book: ${bookName}`);
    console.log(`Destination prefix: ${destinationPrefix}`);
    
    // Extract EPUB
    const imageFiles = await extractEpub(epubPath);
    
    // Upload images
    console.log(`Starting upload of ${imageFiles.length} images to R2...`);
    for (const filePath of imageFiles) {
      await uploadFile(filePath, destinationPrefix);
    }
    
    console.log('All images uploaded successfully!');
    console.log(`Images are available at: https://cdn.readwordly.com/${destinationPrefix}`);
    
    // Clean up
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    console.log('Temporary files cleaned up');
    
  } catch (error) {
    console.error('Error during processing:', error);
    process.exit(1);
  }
}

main(); 