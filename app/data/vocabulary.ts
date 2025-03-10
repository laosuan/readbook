// Define CDN base URL for vocabulary files
const CDN_BASE_URL = 'https://cdn.readwordly.com/MadameBovary/20250310/';
import React, { ReactNode } from 'react';

export interface KeyWord {
  raw_en: string;
  en: string;
  cn: string;
  raw_cn: string;
}

export interface VocabularyItem {
  id: number;
  key_words: KeyWord[];
}

export interface VocabularyData {
  title: string;
  author: string;
  language: {
    source: string;
    target: string;
  };
  vocabulary: VocabularyItem[];
}

// Default empty vocabulary data structure
const emptyVocabularyData: VocabularyData = {
  title: 'Madame Bovary',
  author: 'Gustave Flaubert',
  language: {
    source: 'English',
    target: 'Chinese'
  },
  vocabulary: []
};

// Function to get vocabulary data for a specific book
// This function now only returns the empty structure since we're only using split files
export async function getVocabularyData(): Promise<VocabularyData> {
  return emptyVocabularyData;
}

// Cache for part-chapter vocabulary data
const vocabularyCache: Record<string, VocabularyItem[]> = {};

// Cache to track failed vocabulary requests to avoid repeated attempts
const failedVocabularyRequests: Set<string> = new Set();

// Function to get vocabulary for a specific paragraph by ID
export async function getVocabularyForParagraph(paragraphId: string): Promise<KeyWord[]> {
  console.log(`Getting vocabulary for paragraph: ${paragraphId}`);
  try {
    // Extract parts from the paragraph ID (format: bookId-part-chapter-paragraphId)
    const idParts = paragraphId.split('-');
    
    // Check if we have enough parts to determine part and chapter
    if (idParts.length >= 4) {
      const part = idParts[1];
      const chapter = idParts[2];
      const numericId = parseInt(idParts[3], 10);
      
      // Create a cache key for this part-chapter combination
      const cacheKey = `${part}-${chapter}`;
      
      // If we've already tried and failed to fetch this vocabulary, don't try again
      if (failedVocabularyRequests.has(cacheKey)) {
        return [];
      }
      
      // Check if we have this part-chapter data in cache
      if (!vocabularyCache[cacheKey]) {
        try {
          // Try to fetch the vocabulary data for this part-chapter from CDN
          // The file naming pattern is vocabulary_part-chapter.json
          const url = `${CDN_BASE_URL}vocabulary_${part}-${chapter}.json`;
          console.log(`Fetching vocabulary data from: ${url}`);
          
          // Implement retry logic with a maximum of 1 retry
          let retries = 0;
          const maxRetries = 1;
          
          while (retries <= maxRetries) {
            try {
              const response = await fetch(url);
              
              if (response.ok) {
                const data = await response.json();
                if (data && data.vocabulary) {
                  vocabularyCache[cacheKey] = data.vocabulary;
                  break; // Success, exit the retry loop
                } else {
                  console.warn(`Invalid vocabulary data format for ${part}-${chapter}`);
                  vocabularyCache[cacheKey] = [];
                  failedVocabularyRequests.add(cacheKey);
                  break;
                }
              } else {
                // If not found (404), mark as failed and don't retry
                if (response.status === 404) {
                  console.warn(`Vocabulary data not found for ${part}-${chapter}`);
                  vocabularyCache[cacheKey] = [];
                  failedVocabularyRequests.add(cacheKey);
                  break;
                }
                
                // For other errors, retry if we haven't reached max retries
                if (retries === maxRetries) {
                  console.warn(`Failed to fetch vocabulary data for ${part}-${chapter} after ${maxRetries} retries`);
                  vocabularyCache[cacheKey] = [];
                  failedVocabularyRequests.add(cacheKey);
                  break;
                }
                
                console.warn(`Retry ${retries + 1}/${maxRetries} for vocabulary ${part}-${chapter}`);
                retries++;
                // Add a short delay before retrying
                await new Promise(resolve => setTimeout(resolve, 500));
              }
            } catch (error) {
              // For network errors, retry if we haven't reached max retries
              if (retries === maxRetries) {
                console.error(`Error fetching vocabulary data for ${part}-${chapter} after ${maxRetries} retries:`, error);
                vocabularyCache[cacheKey] = [];
                failedVocabularyRequests.add(cacheKey);
                break;
              }
              
              console.warn(`Retry ${retries + 1}/${maxRetries} after error for vocabulary ${part}-${chapter}`);
              retries++;
              // Add a short delay before retrying
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }
        } catch (error) {
          console.error(`Unexpected error fetching vocabulary data for ${part}-${chapter}:`, error);
          vocabularyCache[cacheKey] = [];
          failedVocabularyRequests.add(cacheKey);
        }
      }
      
      // Find the vocabulary item with the matching ID in the cached data
      const vocabItem = vocabularyCache[cacheKey]?.find(item => item.id === numericId);
      const result = vocabItem?.key_words || [];
      console.log(`Found ${result.length} vocabulary items for paragraph ${paragraphId} with ID ${numericId}:`, result);
      return result;
    } else {
      // For old format IDs, we won't attempt to load from the full vocabulary file
      console.warn(`Invalid paragraph ID format: ${paragraphId}`);
      return [];
    }
  } catch (error) {
    console.error('Error getting vocabulary for paragraph:', error);
    return [];
  }
}

// Function to highlight text with vocabulary words
export function highlightText(text: string, keywords: KeyWord[], isEnglish: boolean): ReactNode {
  // Debug information
  console.log(`Highlighting ${isEnglish ? 'English' : 'Chinese'} text with ${keywords.length} keywords:`, keywords.map(k => isEnglish ? k.raw_en : k.raw_cn));
  
  if (!keywords || keywords.length === 0 || !text) {
    return text;
  }

  // Note: Original text storage removed (was unused)
  
  // Create a map of positions to keywords
  // This approach handles overlapping keywords by prioritizing based on position and length
  interface Match {
    start: number;
    end: number;
    keyword: KeyWord;
    text: string;
  }
  
  const matches: Match[] = [];
  
  // Process each keyword to find all occurrences in the text
  for (const keyword of keywords) {
    const rawText = isEnglish ? keyword.raw_en : keyword.raw_cn;
    if (!rawText || rawText.trim() === '') {
      console.log('Skipping empty keyword:', keyword);
      continue;
    }
    
    console.log(`Finding matches for keyword: '${rawText}'`);
    
    // Create the appropriate regex based on language and word type
    let regex: RegExp;
    if (isEnglish) {
      // Handle English words appropriately
      if (/^[a-zA-Z]+$/.test(rawText)) {
        // Pure alphabetical words - use word boundaries
        regex = new RegExp(`\\b${escapeRegExp(rawText)}\\b`, 'gi');
        console.log(`Using word boundary pattern for '${rawText}'`);
      } else {
        // Phrases or words with special characters - use exact match
        regex = new RegExp(`${escapeRegExp(rawText)}`, 'gi');
        console.log(`Using exact match pattern for '${rawText}'`);
      }
    } else {
      // For Chinese, use exact match
      regex = new RegExp(`${escapeRegExp(rawText)}`, 'g');
    }
    
    // Find all matches in the text
    let match;
    while ((match = regex.exec(text)) !== null) {
      const start = match.index;
      const end = start + match[0].length;
      console.log(`Match found for '${rawText}' at positions ${start}-${end}: '${match[0]}'`);
      
      // Add this match to our list
      matches.push({
        start,
        end,
        keyword,
        text: match[0]
      });
      
      // Prevent infinite loops with zero-width matches
      if (match.index === regex.lastIndex) {
        regex.lastIndex++;
      }
    }
  }
  
  // If no matches found, return the original text
  if (matches.length === 0) {
    console.log('No matches found in text');
    return text;
  }
  
  // Sort matches by start position (ascending) and then by length (descending) for overlaps
  matches.sort((a, b) => {
    if (a.start !== b.start) {
      return a.start - b.start;
    }
    return b.end - a.end; // Longer matches come first
  });
  
  // Filter out overlapping matches, keeping the earliest and longest ones
  const filteredMatches: Match[] = [];
  let lastEnd = -1;
  
  for (const match of matches) {
    // Skip this match if it overlaps with a previously kept match
    if (match.start < lastEnd) {
      console.log(`Skipping overlapping match for '${isEnglish ? match.keyword.raw_en : match.keyword.raw_cn}'`);
      continue;
    }
    
    filteredMatches.push(match);
    lastEnd = match.end;
  }
  
  console.log(`Found ${filteredMatches.length} non-overlapping matches`);
  
  // If no valid matches after filtering, return original text
  if (filteredMatches.length === 0) {
    return text;
  }
  
  // Build segments from matches
  const segments: ReactNode[] = [];
  let currentPosition = 0;
  
  for (const match of filteredMatches) {
    // Add text before this match
    if (match.start > currentPosition) {
      segments.push(text.substring(currentPosition, match.start));
    }
    
    // Add the highlighted match
    segments.push(
      React.createElement(
        'span',
        {
          key: `highlight-${match.start}`,
          className: "bg-yellow-100 dark:bg-yellow-900 rounded px-0.5 cursor-pointer",
          title: isEnglish ? match.keyword.cn : match.keyword.en
        },
        match.text
      )
    );
    
    currentPosition = match.end;
  }
  
  // Add any remaining text after the last match
  if (currentPosition < text.length) {
    segments.push(text.substring(currentPosition));
  }
  
  return React.createElement(React.Fragment, null, ...segments);
}

// Helper function to escape special characters in regex
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
