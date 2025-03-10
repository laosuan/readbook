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
      return vocabItem?.key_words || [];
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
  if (!keywords || keywords.length === 0) {
    return text;
  }

  // Sort keywords by length (longest first) to handle overlapping matches correctly
  const sortedKeywords = [...keywords].sort((a, b) => {
    const aText = isEnglish ? a.raw_en : a.raw_cn;
    const bText = isEnglish ? b.raw_en : b.raw_cn;
    return bText.length - aText.length;
  });

  const result = text;
  let segments: Array<{ text: string; isHighlighted: boolean; keyword?: KeyWord }> = [{ text: result, isHighlighted: false }];

  for (const keyword of sortedKeywords) {
    const rawText = isEnglish ? keyword.raw_en : keyword.raw_cn;
    if (!rawText) continue;

    const newSegments: Array<{ text: string; isHighlighted: boolean; keyword?: KeyWord }> = [];

    for (const segment of segments) {
      if (segment.isHighlighted) {
        newSegments.push(segment);
        continue;
      }

      const parts = segment.text.split(new RegExp(`(${escapeRegExp(rawText)})`, 'i'));
      
      for (let i = 0; i < parts.length; i++) {
        if (parts[i].toLowerCase() === rawText.toLowerCase()) {
          newSegments.push({ 
            text: parts[i], 
            isHighlighted: true, 
            keyword: keyword 
          });
        } else if (parts[i]) {
          newSegments.push({ text: parts[i], isHighlighted: false });
        }
      }
    }

    segments = newSegments;
  }

  // Use React.createElement instead of JSX for better TypeScript compatibility
  const elements = segments.map((segment, index) => {
    if (segment.isHighlighted) {
      return React.createElement(
        'span',
        {
          key: index,
          className: "bg-yellow-100 dark:bg-yellow-900 rounded px-0.5 cursor-pointer",
          title: isEnglish ? segment.keyword?.cn : segment.keyword?.en
        },
        segment.text
      );
    } else {
      return segment.text;
    }
  });

  return React.createElement(React.Fragment, null, ...elements);
}

// Helper function to escape special characters in regex
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
