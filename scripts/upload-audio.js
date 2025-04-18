#!/usr/bin/env node

/**
 * Script to upload audio files from output_principles to Cloudflare R2
 * Usage: node upload-audio.js
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
const SOURCE_DIR = path.join(__dirname, 'output_principles');
const BUCKET_NAME = 'readwordly';
const DESTINATION_PREFIX = 'Principles/Audio/20250418/'; // Update date if needed

// Initialize S3 client with R2 configuration
const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

function getContentType(ext) {
  switch (ext.toLowerCase()) {
    case '.mp3': return 'audio/mpeg';
    case '.wav': return 'audio/wav';
    case '.ogg': return 'audio/ogg';
    case '.flac': return 'audio/flac';
    default: return 'application/octet-stream';
  }
}

async function uploadFile(filePath) {
  const relativePath = path.relative(SOURCE_DIR, filePath).replace(/\\/g, '/');
  const ext = path.extname(filePath);
  const contentType = getContentType(ext);
  const key = DESTINATION_PREFIX + relativePath;
  const body = fs.readFileSync(filePath);

  try {
    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
    }));
    console.log(`Uploaded ${relativePath} to ${key}`);
  } catch (err) {
    console.error(`Error uploading ${relativePath}:`, err);
  }
}

// Gather audio file paths recursively
function getAudioFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAudioFiles(fullPath));
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (['.mp3', '.wav', '.ogg', '.flac'].includes(ext)) {
        files.push(fullPath);
      }
    }
  }
  return files;
}

const BATCH_SIZE = 20;

// Batch upload with concurrency limit
(async () => {
  const files = getAudioFiles(SOURCE_DIR);
  console.log(`Found ${files.length} audio files.`);
  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(uploadFile));
  }
})();
