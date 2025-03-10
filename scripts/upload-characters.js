#!/usr/bin/env node

/**
 * Script to upload character files to Cloudflare R2
 * Usage: node upload-characters.js
 * 
 * Environment variables required:
 * - R2_ACCESS_KEY_ID: Your Cloudflare R2 access key ID
 * - R2_SECRET_ACCESS_KEY: Your Cloudflare R2 secret access key
 * - R2_ENDPOINT: Your Cloudflare R2 endpoint URL
 */

const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// Configuration
const SOURCE_DIR = path.join(__dirname, '../app/data/characters2');
const BUCKET_NAME = 'readwordly';
const DESTINATION_PREFIX = 'MadameBovary/20250310/';
const CONTENT_TYPE = 'application/json';

// Initialize S3 client with R2 configuration
const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

async function uploadFile(filePath, fileName) {
  const fileContent = fs.readFileSync(filePath);
  const key = `${DESTINATION_PREFIX}${fileName}`;
  
  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
    Body: fileContent,
    ContentType: CONTENT_TYPE,
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

async function uploadAllFiles() {
  console.log(`Starting upload of character files to ${DESTINATION_PREFIX}`);
  
  try {
    const files = fs.readdirSync(SOURCE_DIR);
    
    console.log(`Found ${files.length} files to upload`);
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(SOURCE_DIR, file);
        await uploadFile(filePath, file);
      }
    }
    
    console.log('All files uploaded successfully!');
    console.log(`Files are available at: https://cdn.readwordly.com/${DESTINATION_PREFIX}`);
  } catch (error) {
    console.error('Error during upload process:', error);
    process.exit(1);
  }
}

uploadAllFiles();
