// Define CDN base URLs for vocabulary files by book ID
const CDN_BASE_URLS: Record<string, string> = {
  // Madame Bovary (IDs 7 and 8 from books.ts)
  '7': 'https://cdn.readwordly.com/MadameBovary/20250310/',
  '8': 'https://cdn.readwordly.com/MadameBovary/20250310/',
  // The Little Prince (ID 9 from books.ts)
  '9': 'https://cdn.readwordly.com/TheLittlePrince/20250403/',
};
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
  title: '',
  author: '',
  language: {
    source: 'English',
    target: 'Chinese'
  },
  vocabulary: []
};

// Function to get vocabulary data for a specific book
// This function now only returns the empty structure since we're only using split files
export async function getVocabularyData(bookId?: string): Promise<VocabularyData> {
  // If a book ID is provided, we could customize the empty structure 
  // with book-specific information in the future
  if (bookId === '9') {
    // The Little Prince
    return {
      ...emptyVocabularyData,
      title: 'The Little Prince',
      author: 'Antoine de Saint-Exupéry'
    };
  } else if (bookId === '7' || bookId === '8') {
    // Madame Bovary
    return {
      ...emptyVocabularyData,
      title: 'Madame Bovary',
      author: 'Gustave Flaubert'
    };
  }
  
  return emptyVocabularyData;
}

// Cache for part-chapter vocabulary data
const vocabularyCache: Record<string, VocabularyItem[]> = {};

// Cache to track failed vocabulary requests to avoid repeated attempts
const failedVocabularyRequests: Set<string> = new Set();

// Function to get vocabulary for a specific paragraph by ID
export async function getVocabularyForParagraph(paragraphId: string): Promise<KeyWord[]> {
  try {

    // Extract parts from the paragraph ID
    const idParts = paragraphId.split('-');

    // Check if we have enough parts to determine chapter (and part if needed)
    if (idParts.length >= 3) {
      const bookId = idParts[0];
      
      // Different handling based on book ID
      let part: string;
      let chapter: string;
      let numericId: number;
      
      // For Madame Bovary (books 7 & 8), use 4-part format: bookId-part-chapter-paragraphId
      if ((bookId === '7' || bookId === '8') && idParts.length >= 4) {
        part = idParts[1];
        chapter = idParts[2];
        numericId = parseInt(idParts[3], 10);
      }
      // For The Little Prince (book 9), use 3-part format: bookId-chapter-paragraphId
      else if (bookId === '9') {
        part = '0'; // Little Prince doesn't use parts
        chapter = idParts[1];
        numericId = parseInt(idParts[2], 10);
      }
      // For other books or invalid formats, return empty
      else {
        console.warn(`[Vocab API] Unsupported book ID or format: ${paragraphId}`);
        return [];
      }
      
      // Check if this book has vocabulary support
      if (!CDN_BASE_URLS[bookId]) {
        console.info(`[Vocab API] No vocabulary support for book ID ${bookId}`);
        return [];
      }
      
      // Create a cache key for this book-part-chapter combination
      const cacheKey = `${bookId}-${part}-${chapter}`;

      // If we've already tried and failed to fetch this vocabulary, don't try again
      if (failedVocabularyRequests.has(cacheKey)) {
        return [];
      }
      
      // Check if we have this part-chapter data in cache
      if (!vocabularyCache[cacheKey]) {
        try {
          // Determine the correct URL pattern based on the book ID
          let url = '';
          if (bookId === '9') {
            // The Little Prince uses a simpler format: vocabulary_chapter.json
            url = `${CDN_BASE_URLS[bookId]}vocabulary_${chapter}.json`;
          } else {
            // Madame Bovary uses the original format: vocabulary_part-chapter.json
            url = `${CDN_BASE_URLS[bookId]}vocabulary_${part}-${chapter}.json`;
          }
          
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
                  console.warn(`[Vocab API] Invalid vocabulary data format for ${cacheKey}`);
                  vocabularyCache[cacheKey] = [];
                  failedVocabularyRequests.add(cacheKey);
                  break;
                }
              } else {
                // If not found (404), mark as failed and don't retry
                if (response.status === 404) {
                  console.warn(`[Vocab API] Vocabulary data not found (404) for ${cacheKey}`);
                  vocabularyCache[cacheKey] = [];
                  failedVocabularyRequests.add(cacheKey);
                  break;
                }
                
                // For other errors, retry if we haven't reached max retries
                if (retries === maxRetries) {
                  console.warn(`[Vocab API] Failed to fetch vocabulary data for ${cacheKey} after ${maxRetries} retries. Status: ${response.status}`);
                  vocabularyCache[cacheKey] = [];
                  failedVocabularyRequests.add(cacheKey);
                  break;
                }
                
                console.warn(`[Vocab API] Retry ${retries + 1}/${maxRetries} for vocabulary ${cacheKey}. Status: ${response.status}`);
                retries++;
                // Add a short delay before retrying
                await new Promise(resolve => setTimeout(resolve, 500));
              }
            } catch (error) {
              // For network errors, retry if we haven't reached max retries
              if (retries === maxRetries) {
                console.error(`[Vocab API] Error fetching vocabulary data for ${cacheKey} after ${maxRetries} retries:`, error);
                vocabularyCache[cacheKey] = [];
                failedVocabularyRequests.add(cacheKey);
                break;
              }
              
              console.warn(`[Vocab API] Retry ${retries + 1}/${maxRetries} after error for vocabulary ${cacheKey}:`, error);
              retries++;
              // Add a short delay before retrying
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }
        } catch (error) {
          console.error(`[Vocab API] Unexpected error fetching vocabulary data for ${cacheKey}:`, error);
          vocabularyCache[cacheKey] = [];
          failedVocabularyRequests.add(cacheKey);
        }
      } else {
        console.log(`[Vocab API] Cache hit for ${cacheKey}, using cached data`);
      }
      
      // Find the vocabulary item with the matching ID in the cached data
      const vocabItem = vocabularyCache[cacheKey]?.find(item => item.id === numericId);
      const result = vocabItem?.key_words || [];
      
      return result;
    } else {
      // For invalid format IDs, we won't attempt to load vocabulary
      console.warn(`[Vocab API] Invalid paragraph ID format: ${paragraphId} (needs at least 3 parts)`);
      return [];
    }
  } catch (error) {
    console.error('[Vocab API] Error getting vocabulary for paragraph:', error);
    return [];
  }
}

// Function to highlight text with vocabulary words
export function highlightText(text: string, keywords: KeyWord[], isEnglish: boolean): ReactNode {
  // Debug information
  
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
      continue;
    }
    
    // Create the appropriate regex based on language and word type
    let regex: RegExp;
    if (isEnglish) {
      // Handle English words appropriately
      if (/^[a-zA-Z]+$/.test(rawText)) {
        // Pure alphabetical words - use word boundaries
        regex = new RegExp(`\\b${escapeRegExp(rawText)}\\b`, 'gi');
      } else {
        // Phrases or words with special characters - use exact match
        regex = new RegExp(`${escapeRegExp(rawText)}`, 'gi');
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
      continue;
    }
    
    filteredMatches.push(match);
    lastEnd = match.end;
  }
  
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

// Export CDN base URLs for direct access if needed
export const VOCABULARY_CDN_URLS = CDN_BASE_URLS;

