// Script to generate text-to-speech audio using Replicate's kokoro-82m model
const Replicate = require("replicate");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
// Load environment variables from .env file
dotenv.config();

// Check if REPLICATE_API_TOKEN is set
if (!process.env.REPLICATE_API_TOKEN) {
  console.error("Error: REPLICATE_API_TOKEN environment variable is not set.");
  console.error("Please set it using: export REPLICATE_API_TOKEN=your_token_here");
  process.exit(1);
}

// Initialize the Replicate client
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

/**
 * Generate text-to-speech audio using Replicate's kokoro-82m model
 * @param {string} text - The text to convert to speech
 * @param {number} speed - The speech speed (default: 1)
 * @param {string} voice - The voice to use (default: "af_sarah")
 * @param {string} outputPath - Path to save the audio file (default: "./output.mp3")
 * @returns {Promise<string>} - Path to the saved audio file
 */
async function generateSpeech(text, { speed = 1, voice = "af_sarah", outputPath = "./output.mp3", maxRetries = 5 } = {}) {
  let retryCount = 0;
  let lastError = null;

  while (retryCount <= maxRetries) {
    try {
      if (retryCount > 0) {
        console.log(`Retry attempt ${retryCount}/${maxRetries}...`);
        // Add a small delay between retries (increases with each retry)
        await new Promise(resolve => setTimeout(resolve, retryCount * 1000));
      }

      console.log(`Generating speech for text: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);      console.log(`Using voice: ${voice}, speed: ${speed}`);
      
      // Ensure output directory exists
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      // Run the model
      const output = await replicate.run(
        "jaaari/kokoro-82m:f559560eb822dc509045f3921a1921234918b91739db4bf3daab2169b71c7a13",
        {
          input: {
            text,
            speed,
            voice
          }
        }
      );
      
      // Check if we have a valid URL
      if (!output) {
        throw new Error("No output received from Replicate API");
      }
      
      console.log(`Audio generated successfully. URL: ${output}`);
      
      // Download the file
      const response = await fetch(output);
      if (!response.ok) {
        throw new Error(`Failed to download audio file: ${response.statusText}`);
      }
      
      // Save the file
      const buffer = await response.arrayBuffer();
      fs.writeFileSync(outputPath, Buffer.from(buffer));
      
      console.log(`Audio saved to: ${outputPath}`);
      return outputPath;
    } catch (error) {
      lastError = error;
      console.error(`Error generating speech (attempt ${retryCount+1}/${maxRetries+1}):`, error.message);
      retryCount++;
      
      // If this was the last retry, throw the error
      if (retryCount > maxRetries) {
        console.error("All retry attempts failed.");
        throw lastError;
      }
    }
  }
}

// Example usage
async function main() {
  const sampleText = "Those principles that are most valuable come from our own experiences and our reflections on those experiences. Every time we face hard choices, we refine our principles by asking ourselves difficult questions.";
  
  try {
    // Generate speech with default parameters
    await generateSpeech(sampleText, {
      outputPath: "./output/sample-speech.mp3"
    });
    
    console.log("All speech generation tasks completed successfully!");
  } catch (error) {
    console.error("Failed to complete speech generation:", error);
  }
}

// Run the example if this script is executed directly
if (require.main === module) {
  main();
}

module.exports = generateSpeech;
