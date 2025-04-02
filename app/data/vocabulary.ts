// Define CDN base URL for vocabulary files
const CDN_BASE_URL = 'https://cdn.readwordly.com/MadameBovary/20250310/';
import React, { ReactNode } from 'react';
import { VocabularyItem } from '../types';

export interface KeyWord {
  raw_en: string;
  en: string;
  cn: string;
  raw_cn: string;
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
      const vocabItem = vocabularyCache[cacheKey]?.find(item => {
        // Parse the item.id to extract the paragraph ID part for comparison
        const itemIdParts = item.id.split('-');
        // The numeric ID is the last part of the item.id
        const itemNumericId = itemIdParts[itemIdParts.length - 2];
        return itemNumericId === idParts[3];
      });

      // Convert to the expected KeyWord[] format
      if (vocabItem) {
        return [{
          en: vocabItem.english,
          cn: vocabItem.chinese,
          raw_en: vocabItem.raw_english,
          raw_cn: vocabItem.raw_chinese
        }];
      }
      
      return [];
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

// 定义词汇书籍配置类型
interface VocabBookConfig {
  id: string;
  cdnBaseUrl: string;
  name: string;
}

// 词汇书籍配置
const VOCAB_BOOK_CONFIGS: VocabBookConfig[] = [
  {
    id: '8',
    cdnBaseUrl: 'https://cdn.readwordly.com/MadameBovary/20250310/',
    name: 'Madame Bovary'
  },
  {
    id: '9',
    cdnBaseUrl: 'https://cdn.readwordly.com/TheLittlePrince/20250310/',
    name: 'The Little Prince'
  }
];

// 记录已经尝试但未成功的URL，避免重复请求
const failedVocabUrls: Set<string> = new Set();

// Define interfaces for the vocabulary data structure
interface VocabularyDataItem {
  id: string;
  key_words?: VocabularyWord[];
}

interface VocabularyWord {
  en: string;
  cn: string;
  raw_en?: string;
  raw_cn?: string;
}

/**
 * 从CDN获取词汇数据
 */
async function fetchVocabularyData(config: VocabBookConfig, part?: number, chapter?: number): Promise<VocabularyItem[]> {
  try {
    let url: string;
    
    // 构建URL
    if (config.id === '9' && chapter !== undefined) {
      // 小王子的文件格式不使用part，直接是vocabulary_1.json到vocabulary_27.json
      url = `${config.cdnBaseUrl}vocabulary_${chapter}.json`;
    } else if (part !== undefined && chapter !== undefined) {
      // 包法利夫人的文件格式使用part和chapter，如vocabulary_1-1.json
      url = `${config.cdnBaseUrl}vocabulary_${part}-${chapter}.json`;
    } else {
      console.error('Missing part or chapter for vocabulary data');
      return [];
    }
    
    // 缓存键
    const cacheKey = url;
    
    // 如果已经在缓存中，直接返回
    if (vocabularyCache[cacheKey]) {
      console.log(`Using cached vocabulary from ${url}`);
      return vocabularyCache[cacheKey];
    }
    
    // 如果该URL已经请求失败过，则直接返回空数据，避免重复请求
    if (failedVocabUrls.has(url)) {
      console.log(`Skipping previously failed vocabulary URL: ${url}`);
      return [];
    }
    
    console.log(`Fetching vocabulary from: ${url}`);
    
    // 实现重试逻辑，最多重试一次
    let retries = 0;
    const maxRetries = 1;
    
    while (retries <= maxRetries) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          
          if (!data.vocabulary || !Array.isArray(data.vocabulary)) {
            console.error(`Invalid vocabulary data format from ${url}`);
            failedVocabUrls.add(url);
            return [];
          }
          
          // 处理词汇数据
          const vocabularyItems: VocabularyItem[] = [];
          
          data.vocabulary.forEach((item: VocabularyDataItem) => {
            if (item.key_words && Array.isArray(item.key_words)) {
              item.key_words.forEach((word: VocabularyWord) => {
                if (word.en && word.cn) {
                  vocabularyItems.push({
                    id: `${config.id}-${item.id}-${word.en}`,
                    paragraphId: config.id === '9' 
                      ? `${config.id}-${chapter}-${item.id}` 
                      : `${config.id}-${part}-${chapter}-${item.id}`,
                    english: word.en,
                    chinese: word.cn,
                    raw_english: word.raw_en || word.en,
                    raw_chinese: word.raw_cn || word.cn
                  });
                }
              });
            }
          });
          
          // 缓存结果
          vocabularyCache[cacheKey] = vocabularyItems;
          return vocabularyItems;
        } else {
          // 对于404错误，直接标记为失败并返回，不重试
          if (response.status === 404) {
            console.warn(`Vocabulary resource not found at URL: ${url}`);
            failedVocabUrls.add(url);
            return [];
          }
          
          // 如果是最后一次重试，记录错误并返回空数据
          if (retries === maxRetries) {
            console.error(`Failed to fetch vocabulary after ${maxRetries} retries: ${response.status} ${response.statusText} for URL: ${url}`);
            failedVocabUrls.add(url);
            return [];
          }
          // 否则继续重试
          console.warn(`Retry ${retries + 1}/${maxRetries} for vocabulary URL: ${url}`);
          retries++;
          // 添加短暂延迟再重试
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        // 如果是最后一次重试，记录错误并返回空数据
        if (retries === maxRetries) {
          console.error(`Error fetching vocabulary after ${maxRetries} retries:`, error);
          failedVocabUrls.add(url);
          return [];
        }
        // 否则继续重试
        console.warn(`Retry ${retries + 1}/${maxRetries} after error for vocabulary URL: ${url}`);
        retries++;
        // 添加短暂延迟再重试
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    return [];
  } catch (error) {
    console.error('Unexpected error fetching vocabulary data:', error);
    return [];
  }
}

/**
 * 获取特定书籍、章节的词汇表
 */
export async function getVocabulary(bookId: string, chapterNumber: number): Promise<VocabularyItem[]> {
  // 查找书籍配置
  const bookConfig = VOCAB_BOOK_CONFIGS.find(config => config.id === bookId);
  if (!bookConfig) {
    console.error(`Vocabulary book config not found for ID: ${bookId}`);
    return [];
  }
  
  // 计算part和chapter
  let part: number | undefined;
  let chapter: number | undefined;
  
  if (bookId === '8') { // Madame Bovary
    if (chapterNumber <= 9) {
      part = 1;
      chapter = chapterNumber; // Part 1: Chapters 1-9
    } else if (chapterNumber <= 24) {
      part = 2;
      chapter = chapterNumber - 9; // Part 2: Chapters 10-24 (1-15 within part 2)
    } else {
      part = 3;
      chapter = chapterNumber - 24; // Part 3: Chapters 25-35 (1-11 within part 3)
    }
  } else if (bookId === '9') { // The Little Prince
    part = undefined; // 小王子不使用part
    chapter = chapterNumber; // 直接使用章节号
  } else {
    console.error(`Unsupported book ID for vocabulary: ${bookId}`);
    return [];
  }
  
  // 获取词汇数据
  return await fetchVocabularyData(bookConfig, part, chapter);
}

/**
 * 获取段落的所有词汇
 */
export async function getParagraphVocabulary(paragraphId: string): Promise<VocabularyItem[]> {
  // 解析段落ID
  const parts = paragraphId.split('-');
  if (parts.length < 3) {
    console.error(`Invalid paragraph ID format: ${paragraphId}`);
    return [];
  }
  
  const bookId = parts[0];
  let chapterNumber: number;
  
  if (bookId === '9') { // The Little Prince
    // 格式: 9-chapter-paragraph_id
    chapterNumber = parseInt(parts[1], 10);
  } else {
    // 格式: bookId-part-chapter-paragraph_id
    const part = parseInt(parts[1], 10);
    const chapter = parseInt(parts[2], 10);
    
    // 计算绝对章节号
    if (bookId === '8') { // Madame Bovary
      if (part === 1) {
        chapterNumber = chapter;
      } else if (part === 2) {
        chapterNumber = 9 + chapter;
      } else if (part === 3) {
        chapterNumber = 9 + 15 + chapter;
      } else {
        console.error(`Invalid part in paragraph ID: ${paragraphId}`);
        return [];
      }
    } else {
      console.error(`Unsupported book ID for paragraph vocabulary: ${paragraphId}`);
      return [];
    }
  }
  
  // 获取整个章节的词汇
  const chapterVocabulary = await getVocabulary(bookId, chapterNumber);
  
  // 过滤出属于这个段落的词汇
  return chapterVocabulary.filter(item => item.paragraphId === paragraphId);
}
