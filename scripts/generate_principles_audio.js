/**
 * Script to generate audio for paragraphs in bilingual JSON files under scripts/data/Principles.
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const generateSpeech = require('./tts-replicate');

// Load environment variables
dotenv.config();

async function main() {
  const principlesDir = path.join(__dirname, 'data', 'Principles');
  const outputDir = path.join(__dirname, 'output_principles');

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Read JSON files and collect all paragraphs
  const files = fs.readdirSync(principlesDir).filter(f => f.endsWith('.json'));
  const jobs = [];
  for (const file of files) {
    const filePath = path.join(principlesDir, file);
    try {
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const paragraphs = content.paragraphs || [];
      for (const para of paragraphs) {
        const { id, source: text } = para;
        if (!id || !text) {
          console.warn(`Skipping paragraph without id or source in ${file}`);
          continue;
        }
        jobs.push({ id, text: text.replace(/\n/g, '') });
      }
    } catch (err) {
      console.error(`Failed to parse JSON file ${file}:`, err);
    }
  }
  console.log(`Total paragraphs to process: ${jobs.length}`);

  // Process in batches of 30
  const batchSize = 12;
  for (let i = 0; i < jobs.length; i += batchSize) {
    const batch = jobs.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1} (${batch.length} items)...`);
    await Promise.all(batch.map(async ({ id, text }) => {
      const outputPath = path.join(outputDir, `${id}.mp3`);
      if (fs.existsSync(outputPath)) {
        console.log(`Skipping paragraph id=${id}, file already exists.`);
        return;
      }
      console.log(`Generating audio for paragraph id=${id}...`);
      try {
        await generateSpeech(text, { outputPath });
      } catch (err) {
        console.error(`Failed for id=${id}:`, err);
      }
    }));
    // Rate limit: ensure max 600 requests per minute by waiting between batches
    const waitMs = (batch.length * 60000) / 300;
    if (i + batchSize < jobs.length) {
      console.log(`Waiting ${waitMs / 1000}s to respect rate limit...`);
      await new Promise(resolve => setTimeout(resolve, waitMs));
    }
  }
}

if (require.main === module) {
  main();
}

module.exports = main;
