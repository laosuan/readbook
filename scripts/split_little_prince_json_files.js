const fs = require('fs');
const path = require('path');

// Paths to the JSON files
const bilingualDataPath = path.join(__dirname, '../app/data/little_prince_bilingual_data.json');
const vocabularyDataPath = path.join(__dirname, '../app/data/little_prince_vocabulary_data.json');

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
    "I": { chapter: 1 },
    "II": { chapter: 2 },
    "III": { chapter: 3 },
    "IV": { chapter: 4 },
    "V": { chapter: 5 },
    "VI": { chapter: 6 },
    "VII": { chapter: 7 },
    "VIII": { chapter: 8 },
    "IX": { chapter: 9 },
    "X": { chapter: 10 },
    "XI": { chapter: 11 },
    "XII": { chapter: 12 },
    "XIII": { chapter: 13 },
    "XIV": { chapter: 14 },
    "XV": { chapter: 15 },
    "XVI": { chapter: 16 },
    "XVII": { chapter: 17 },
    "XVIII": { chapter: 18 },
    "XIX": { chapter: 19 },
    "XX": { chapter: 20 },
    "XXI": { chapter: 21 },
    "XXII": { chapter: 22 },
    "XXIII": { chapter: 23 },
    "XXIV": { chapter: 24 },
    "XXV": { chapter: 25 },
    "XXVI": { chapter: 26 },
    "XXVII": { chapter: 27 }
  };

  // Initialize variables to track current chapter
  let currentChapter = 0;
  
  // Create a structure to hold paragraphs by chapter
  const characterData = {};
  
  // Process each paragraph
  bilingualData.paragraphs.forEach(paragraph => {
    // Debug output to see what's happening
    console.log(`Processing paragraph: ${paragraph.id}, Source: "${paragraph.source.substring(0, 30)}..."`);
    
    // Extract the first line or part of the source text
    const firstLine = paragraph.source.split('\n')[0].trim();
    
    // Check if this paragraph is a chapter marker
    // In Little Prince, chapter markers might be Roman numerals at the start
    if (chapterMarkers[firstLine]) {
      const marker = chapterMarkers[firstLine];
      if (marker.chapter) {
        currentChapter = marker.chapter;
        console.log(`Found chapter marker: ${firstLine}, Setting current chapter to: ${currentChapter}`);
      }
    } else if (paragraph.source.match(/^[IVX]+\n/)) { 
      // Check for chapter markers at the beginning followed by newline
      const romanNumeral = paragraph.source.match(/^([IVX]+)\n/)[1];
      if (chapterMarkers[romanNumeral]) {
        const marker = chapterMarkers[romanNumeral];
        if (marker.chapter) {
          currentChapter = marker.chapter;
          console.log(`Found chapter marker at beginning: ${romanNumeral}, Setting current chapter to: ${currentChapter}`);
        }
      }
    }
    
    // Skip if we haven't found a valid chapter yet
    if (currentChapter === 0) return;
    
    // Create the character key (e.g., "1" for Chapter 1)
    const characterKey = `${currentChapter}`;
    
    // Initialize the character data structure if it doesn't exist
    if (!characterData[characterKey]) {
      characterData[characterKey] = {
        title: bilingualData.title,
        author: bilingualData.author,
        language: bilingualData.language,
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
  // Create a mapping of paragraph IDs to chapter
  const paragraphToCharacter = {};
  
  // First, process bilingual data to create the mapping
  let currentChapter = 0;
  
  const chapterMarkers = {
    "I": { chapter: 1 },
    "II": { chapter: 2 },
    "III": { chapter: 3 },
    "IV": { chapter: 4 },
    "V": { chapter: 5 },
    "VI": { chapter: 6 },
    "VII": { chapter: 7 },
    "VIII": { chapter: 8 },
    "IX": { chapter: 9 },
    "X": { chapter: 10 },
    "XI": { chapter: 11 },
    "XII": { chapter: 12 },
    "XIII": { chapter: 13 },
    "XIV": { chapter: 14 },
    "XV": { chapter: 15 },
    "XVI": { chapter: 16 },
    "XVII": { chapter: 17 },
    "XVIII": { chapter: 18 },
    "XIX": { chapter: 19 },
    "XX": { chapter: 20 },
    "XXI": { chapter: 21 },
    "XXII": { chapter: 22 },
    "XXIII": { chapter: 23 },
    "XXIV": { chapter: 24 },
    "XXV": { chapter: 25 },
    "XXVI": { chapter: 26 },
    "XXVII": { chapter: 27 }
  };
  
  bilingualData.paragraphs.forEach(paragraph => {
    // Extract the first line or part of the source text
    const firstLine = paragraph.source.split('\n')[0].trim();
    
    // Check if this paragraph is a chapter marker
    // In Little Prince, chapter markers might be Roman numerals at the start
    if (chapterMarkers[firstLine]) {
      const marker = chapterMarkers[firstLine];
      if (marker.chapter) {
        currentChapter = marker.chapter;
      }
    } else if (paragraph.source.match(/^[IVX]+\n/)) { 
      // Check for chapter markers at the beginning followed by newline
      const romanNumeral = paragraph.source.match(/^([IVX]+)\n/)[1];
      if (chapterMarkers[romanNumeral]) {
        const marker = chapterMarkers[romanNumeral];
        if (marker.chapter) {
          currentChapter = marker.chapter;
        }
      }
    }
    
    // Skip if we haven't found a valid chapter yet
    if (currentChapter === 0) return;
    
    // Map paragraph ID to character key
    paragraphToCharacter[paragraph.id] = `${currentChapter}`;
  });
  
  // Create a structure to hold vocabulary by chapter
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
