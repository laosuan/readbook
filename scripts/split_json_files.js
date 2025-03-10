const fs = require('fs');
const path = require('path');

// Paths to the JSON files
const bilingualDataPath = path.join(__dirname, '../app/data/MadameBovary_translate_bilingual_data_20250310.json');
const vocabularyDataPath = path.join(__dirname, '../app/data/vocabulary_data_20250310.json');

// Output directory
const outputDir = path.join(__dirname, '../app/data/characters');

// Ensure the output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Read the JSON files
const bilingualData = JSON.parse(fs.readFileSync(bilingualDataPath, 'utf8'));
const vocabularyData = JSON.parse(fs.readFileSync(vocabularyDataPath, 'utf8'));

// Function to split bilingual data by character
function splitBilingualData() {
  // Create a mapping of chapter markers to help identify chapters
  const chapterMarkers = {
    "Part I": { part: 1, chapter: 0 },
    "Part II": { part: 2, chapter: 0 },
    "Part III": { part: 3, chapter: 0 },
    "Chapter One": { chapter: 1 },
    "Chapter Two": { chapter: 2 },
    "Chapter Three": { chapter: 3 },
    "Chapter Four": { chapter: 4 },
    "Chapter Five": { chapter: 5 },
    "Chapter Six": { chapter: 6 },
    "Chapter Seven": { chapter: 7 },
    "Chapter Eight": { chapter: 8 },
    "Chapter Nine": { chapter: 9 },
    "Chapter Ten": { chapter: 10 },
    "Chapter Eleven": { chapter: 11 },
    "Chapter Twelve": { chapter: 12 },
    "Chapter Thirteen": { chapter: 13 },
    "Chapter Fourteen": { chapter: 14 },
    "Chapter Fifteen": { chapter: 15 }
  };

  // Initialize variables to track current part and chapter
  let currentPart = 0;
  let currentChapter = 0;
  
  // Create a structure to hold paragraphs by part and chapter
  const characterData = {};
  
  // Process each paragraph
  bilingualData.paragraphs.forEach(paragraph => {
    // Check if this paragraph is a part or chapter marker
    if (chapterMarkers[paragraph.source]) {
      const marker = chapterMarkers[paragraph.source];
      if (marker.part) {
        currentPart = marker.part;
        currentChapter = 0; // Reset chapter when part changes
      }
      if (marker.chapter) {
        currentChapter = marker.chapter;
      }
    }
    
    // Skip if we haven't found a valid part/chapter yet
    if (currentPart === 0) return;
    
    // Create the character key (e.g., "1-1" for Part 1, Chapter 1)
    const characterKey = `${currentPart}-${currentChapter}`;
    
    // Initialize the character data structure if it doesn't exist
    if (!characterData[characterKey]) {
      characterData[characterKey] = {
        title: bilingualData.title,
        author: bilingualData.author,
        language: bilingualData.language,
        part: currentPart,
        chapter: currentChapter,
        paragraphs: []
      };
    }
    
    // Add the paragraph to the current character
    characterData[characterKey].paragraphs.push(paragraph);
  });
  
  // Write each character's data to a separate file
  Object.keys(characterData).forEach(characterKey => {
    const filePath = path.join(outputDir, `bilingual_${characterKey}.json`);
    fs.writeFileSync(filePath, JSON.stringify(characterData[characterKey], null, 2));
    console.log(`Created ${filePath}`);
  });
}

// Function to split vocabulary data by character
function splitVocabularyData() {
  // Create a mapping of paragraph IDs to part-chapter
  const paragraphToCharacter = {};
  
  // First, process bilingual data to create the mapping
  let currentPart = 0;
  let currentChapter = 0;
  
  const chapterMarkers = {
    "Part I": { part: 1, chapter: 0 },
    "Part II": { part: 2, chapter: 0 },
    "Part III": { part: 3, chapter: 0 },
    "Chapter One": { chapter: 1 },
    "Chapter Two": { chapter: 2 },
    "Chapter Three": { chapter: 3 },
    "Chapter Four": { chapter: 4 },
    "Chapter Five": { chapter: 5 },
    "Chapter Six": { chapter: 6 },
    "Chapter Seven": { chapter: 7 },
    "Chapter Eight": { chapter: 8 },
    "Chapter Nine": { chapter: 9 },
    "Chapter Ten": { chapter: 10 },
    "Chapter Eleven": { chapter: 11 },
    "Chapter Twelve": { chapter: 12 },
    "Chapter Thirteen": { chapter: 13 },
    "Chapter Fourteen": { chapter: 14 },
    "Chapter Fifteen": { chapter: 15 }
  };
  
  bilingualData.paragraphs.forEach(paragraph => {
    // Check if this paragraph is a part or chapter marker
    if (chapterMarkers[paragraph.source]) {
      const marker = chapterMarkers[paragraph.source];
      if (marker.part) {
        currentPart = marker.part;
        currentChapter = 0; // Reset chapter when part changes
      }
      if (marker.chapter) {
        currentChapter = marker.chapter;
      }
    }
    
    // Skip if we haven't found a valid part/chapter yet
    if (currentPart === 0) return;
    
    // Map paragraph ID to character key
    paragraphToCharacter[paragraph.id] = `${currentPart}-${currentChapter}`;
  });
  
  // Create a structure to hold vocabulary by part and chapter
  const characterVocabulary = {};
  
  // Process each vocabulary item
  vocabularyData.vocabulary.forEach(vocabItem => {
    const paragraphId = vocabItem.id;
    const characterKey = paragraphToCharacter[paragraphId];
    
    // Skip if we don't have a mapping for this paragraph
    if (!characterKey) return;
    
    // Initialize the character vocabulary structure if it doesn't exist
    if (!characterVocabulary[characterKey]) {
      characterVocabulary[characterKey] = {
        title: vocabularyData.title,
        author: vocabularyData.author,
        language: vocabularyData.language,
        vocabulary: []
      };
    }
    
    // Add the vocabulary item to the current character
    characterVocabulary[characterKey].vocabulary.push(vocabItem);
  });
  
  // Write each character's vocabulary to a separate file
  Object.keys(characterVocabulary).forEach(characterKey => {
    const filePath = path.join(outputDir, `vocabulary_${characterKey}.json`);
    fs.writeFileSync(filePath, JSON.stringify(characterVocabulary[characterKey], null, 2));
    console.log(`Created ${filePath}`);
  });
}

// Run the split functions
splitBilingualData();
splitVocabularyData();

console.log('Splitting complete!');
