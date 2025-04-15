const fs = require('fs');
const path = require('path');

// Paths to the JSON files for the "Principles" book
const bilingualDataPath = path.join(__dirname, '../app/data/bilingual_data.json');
const vocabularyDataPath = path.join(__dirname, '../app/data/vocabulary_data.json');

// Output directory for split files
const outputDir = path.join(__dirname, '../app/data/principles_chapters');

// Define the structure based on paragraph IDs
const principlesStructure = [
  { title: "Introduction", startId: 0, endId: 31 }, // Adjusted startId to 0 based on data inspection
  { title: "Part 1: The Importance of Principles", startId: 32, endId: 54 },
  { title: "Part 2: My Most Fundamental Life Principles", startId: 55, endId: 308 },
  { title: "Part 3: My Management Principles", startId: 309, endId: 99999 } // Use a large number to include all remaining paragraphs
];

// Ensure the output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Read the JSON files
let bilingualData;
let vocabularyData;
try {
  bilingualData = JSON.parse(fs.readFileSync(bilingualDataPath, 'utf8'));
  vocabularyData = JSON.parse(fs.readFileSync(vocabularyDataPath, 'utf8'));
} catch (error) {
  console.error(`Error reading input JSON files: ${error.message}`);
  process.exit(1); // Exit if files cannot be read
}

// Function to find which part a paragraph belongs to based on ID
function findPartIndexForParagraph(paragraphId) {
    for (let i = 0; i < principlesStructure.length; i++) {
        const part = principlesStructure[i];
        if (paragraphId >= part.startId && paragraphId <= part.endId) {
            return i; // Return the index of the part
        }
    }
    // console.warn(`Paragraph ID ${paragraphId} does not fall into any defined part range.`);
    return -1; // Not found in any part
}

// Function to split bilingual data based on ID ranges
function splitBilingualData() {
  // Create a structure to hold paragraphs by part index
  const partData = {};

  // Initialize the structure for each part defined
  principlesStructure.forEach((partInfo, index) => {
      partData[index] = {
        title: partInfo.title,
        original_book_title: bilingualData.title || "Principles",
        author: bilingualData.author || "Unknown",
        language: bilingualData.language,
        part_index: index,
        paragraphs: []
      };
  });

  // Process each paragraph and assign it to the correct part
  bilingualData.paragraphs.forEach(paragraph => {
    const partIndex = findPartIndexForParagraph(paragraph.id);
    if (partIndex !== -1 && partData[partIndex]) {
        // Exclude the paragraphs that might be the title markers themselves if needed
        // (e.g., if paragraph.id 32's source is exactly "Part 1: The Importance of Principles")
        // For now, including all paragraphs within the ID range.
        partData[partIndex].paragraphs.push(paragraph);
    } else if (partIndex === -1) {
         console.warn(`Bilingual paragraph ID ${paragraph.id} ('${paragraph.source.substring(0,30)}...') not assigned to any part.`);
    }
  });

  // Write each part's data to a separate file
  Object.keys(partData).forEach(partIndex => {
    // Only write files if the part actually contains paragraphs
    if (partData[partIndex].paragraphs.length > 0) {
        const filePath = path.join(outputDir, `bilingual_${partIndex}.json`);
        try {
            fs.writeFileSync(filePath, JSON.stringify(partData[partIndex], null, 2));
            console.log(`Created ${filePath}`);
        } catch (error) {
            console.error(`Error writing file ${filePath}: ${error.message}`);
        }
    } else {
         console.log(`Skipping empty part index ${partIndex} for bilingual data.`);
    }
  });
}

// Function to split vocabulary data based on ID ranges
function splitVocabularyData() {
  // Create a mapping of paragraph IDs to part index
  const paragraphToPartIndex = {};
  bilingualData.paragraphs.forEach(paragraph => {
      const partIndex = findPartIndexForParagraph(paragraph.id);
      if (partIndex !== -1) {
          paragraphToPartIndex[paragraph.id] = partIndex;
      }
  });

  // Create a structure to hold vocabulary by part index
  const partVocabulary = {};

  // Initialize the structure for each part defined
  principlesStructure.forEach((partInfo, index) => {
      partVocabulary[index] = {
        title: partInfo.title + " Vocabulary",
        original_book_title: vocabularyData.title || "Principles Vocabulary",
        author: vocabularyData.author || "Unknown",
        language: vocabularyData.language,
        part_index: index,
        vocabulary: []
      };
  });

  // Process each vocabulary item and assign it to the correct part
  vocabularyData.vocabulary.forEach(vocabItem => {
    const paragraphId = vocabItem.id; // Assuming vocabItem.id maps to paragraph.id
    const partIndex = paragraphToPartIndex[paragraphId];

    if (partIndex !== undefined && partVocabulary[partIndex]) {
      partVocabulary[partIndex].vocabulary.push(vocabItem);
    } else {
        // Warning if a vocab item belongs to a paragraph not mapped to a part
        console.warn(`Vocabulary item for paragraph ID ${paragraphId} could not be assigned to a part.`);
    }
  });

  // Write each part's vocabulary to a separate file
  Object.keys(partVocabulary).forEach(partIndex => {
     // Only write files if the part actually contains vocabulary
    if (partVocabulary[partIndex].vocabulary.length > 0) {
        const filePath = path.join(outputDir, `vocabulary_${partIndex}.json`);
        try {
            fs.writeFileSync(filePath, JSON.stringify(partVocabulary[partIndex], null, 2));
            console.log(`Created ${filePath}`);
        } catch (error) {
            console.error(`Error writing file ${filePath}: ${error.message}`);
        }
    } else {
        console.log(`Skipping empty part index ${partIndex} for vocabulary data.`);
    }
  });
}

// --- Execution ---
if (!bilingualData || !vocabularyData) {
    console.error("Input data not loaded. Exiting.");
    process.exit(1);
}

console.log("Starting bilingual data split based on ID ranges...");
splitBilingualData();
console.log("Bilingual data split finished.");

console.log("Starting vocabulary data split based on ID ranges...");
splitVocabularyData();
console.log("Vocabulary data split finished.");

console.log('Splitting complete!'); 