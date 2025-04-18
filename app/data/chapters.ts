import { Chapter, BilingualContent } from '../types';

// 定义书籍配置类型
interface BookConfig {
  id: string;
  cdnUrl: string; // Can be a fallback or first chapter URL for split files
  name: string;
  useSplitFiles?: boolean;
  cdnBaseUrl?: string;
  audioCdnUrl?: string; // Base URL for pre-generated audio files
}

// 书籍配置
const BOOK_CONFIGS: BookConfig[] = [
  {
    id: '7',
    // cdnUrl: 'https://cdn.readwordly.com/book_7_bilingual_data.json', // Old URL
    cdnUrl: 'https://cdn.readwordly.com/Principles/20250415/bilingual_0.json', // Point to first part as fallback/example
    name: 'Principles (2011 Free Version)',
    useSplitFiles: true, // Set to true
    cdnBaseUrl: 'https://cdn.readwordly.com/Principles/20250415/', // Add the base URL
    audioCdnUrl: 'https://cdn.readwordly.com/Principles/Audio/20250418/' // Base URL for audio files
  },
  {
    id: '8',
    cdnUrl: 'https://cdn.readwordly.com/MadameBovary/20250310/bilingual_1-1.json', // Updated fallback example
    name: 'Madame Bovary', // Corrected name
    useSplitFiles: true,
    cdnBaseUrl: 'https://cdn.readwordly.com/MadameBovary/20250310/',
    audioCdnUrl: 'https://cdn.readwordly.com/MadameBovary/Audio/20250418/' // Base URL for audio files
  },
  {
    id: '9',
    cdnUrl: 'https://cdn.readwordly.com/TheLittlePrince/20250403/bilingual_1.json', // Updated fallback example
    name: 'The Little Prince',
    useSplitFiles: true,
    cdnBaseUrl: 'https://cdn.readwordly.com/TheLittlePrince/20250403/',
    audioCdnUrl: 'https://cdn.readwordly.com/TheLittlePrince/Audio/20250418/' // Base URL for audio files
  }
];

// Define the structure for Principles based on paragraph IDs used in splitting
const principlesStructure = [
  { title: "Introduction", index: 0, startId: 0, endId: 31 },
  { title: "Part 1: The Importance of Principles", index: 1, startId: 32, endId: 54 },
  { title: "Part 2: My Most Fundamental Life Principles", index: 2, startId: 55, endId: 308 },
  { title: "Part 3: My Management Principles", index: 3, startId: 309, endId: 99999 } // Use a large number
];

// Define structure for Madame Bovary chapters per part
const madameBovaryPartStructure: Record<number, number> = {
  1: 9,  // 第一部分有9章
  2: 15, // 第二部分有15章
  3: 11  // 第三部分有11章
};

// Define structure for The Little Prince chapters
const littlePrinceTotalChapters = 27;

// 记录已经尝试但未成功的URL，避免重复请求
const failedDataUrls: Set<string> = new Set();

// 通用函数：从CDN获取数据
// Added partIndex specifically for Principles (book 7)
async function fetchBookData(config: BookConfig, part?: number, chapter?: number, partIndex?: number) {
  try {
    let url = config.cdnUrl; // Start with fallback URL

    // 如果使用分割文件，则构建URL
    if (config.useSplitFiles && config.cdnBaseUrl) {
      if (config.id === '7' && partIndex !== undefined) {
        // Principles uses partIndex (0, 1, 2, 3)
        url = `${config.cdnBaseUrl}bilingual_${partIndex}.json`;
      } else if (config.id === '9' && chapter !== undefined) {
        // 小王子的文件格式不使用part，直接是bilingual_chapter.json
        url = `${config.cdnBaseUrl}bilingual_${chapter}.json`;
      } else if (config.id === '8' && part !== undefined && chapter !== undefined) {
        // Madame Bovary uses part-chapter format
        url = `${config.cdnBaseUrl}bilingual_${part}-${chapter}.json`;
      }
      // Add other book-specific logic here if needed
    }

    // 如果URL以/app开头，说明是本地文件，需要调整路径 (Keep this for potential local testing)
    if (url.startsWith('/app')) {
      url = '.' + url; // 转为相对路径 例如 ./app/data/...
    }

    // 如果该URL已经请求失败过，则直接返回空数据，避免重复请求
    if (failedDataUrls.has(url)) {
      console.log(`Skipping previously failed URL: ${url}`);
      return { paragraphs: [] };
    }

    console.log(`Fetching data from: ${url}`);

    // 实现重试逻辑，最多重试一次
    let retries = 0;
    const maxRetries = 1; // 减少重试次数

    while (retries <= maxRetries) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          console.log(`Successfully fetched data from ${url} (${config.name})`);
          return data;
        } else {
          // 对于404错误，直接标记为失败并返回，不重试
          if (response.status === 404) {
            console.warn(`Resource not found at URL: ${url}`);
            failedDataUrls.add(url);
            return { paragraphs: [] };
          }

          // 如果是最后一次重试，记录错误并返回空数据
          if (retries === maxRetries) {
            console.error(`Failed to fetch ${config.name} data after ${maxRetries} retries: ${response.status} ${response.statusText} for URL: ${url}`);
            failedDataUrls.add(url);
            return { paragraphs: [] };
          }
          // 否则继续重试
          console.warn(`Retry ${retries + 1}/${maxRetries} for URL: ${url}`);
          retries++;
          // 添加短暂延迟再重试
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        // 如果是最后一次重试，记录错误并返回空数据
        if (retries === maxRetries) {
          console.error(`Error fetching ${config.name} data after ${maxRetries} retries:`, error);
          failedDataUrls.add(url);
          return { paragraphs: [] };
        }
        // 否则继续重试
        console.warn(`Retry ${retries + 1}/${maxRetries} after error for URL: ${url}`);
        retries++;
        // 添加短暂延迟再重试
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // 这里不应该到达，但为了类型安全添加默认返回
    return { paragraphs: [] };
  } catch (error) {
    console.error(`Unexpected error fetching ${config.name} data:`, error);
    return { paragraphs: [] }; // Return empty data structure on error
  }
}

// 通用函数：处理JSON数据为BilingualContent对象
// Added partIndex specifically for Principles (book 7)
async function processBookData(config: BookConfig, part?: number, chapter?: number, partIndex?: number): Promise<BilingualContent[]> {
  const content: BilingualContent[] = [];

  try {
    // 获取数据, pass partIndex if provided
    const bookData = await fetchBookData(config, part, chapter, partIndex);

    // 检查数据格式
    if (!bookData || !bookData.paragraphs || !Array.isArray(bookData.paragraphs)) {
      console.error(`Invalid ${config.name} data format: paragraphs array not found or invalid.`);
      return [];
    }

    // 遍历段落数组
    bookData.paragraphs.forEach((paragraph: { id: string | number; source: string; translation: string }) => {
      // 确保段落有source和translation字段
      if (paragraph && paragraph.source && paragraph.translation) {
        // 确保 id 是字符串
        const paragraphIdSuffix = paragraph.id.toString();

        // 生成唯一的段落 ID
        let id: string;
        if (config.id === '7' && partIndex !== undefined) {
          // Principles: bookId-partIndex-paragraphIdSuffix
          id = `${config.id}-${partIndex}-${paragraphIdSuffix}`;
        } else if (config.id === '9' && chapter !== undefined) {
           // Little Prince: bookId-chapter-paragraphIdSuffix
           id = `${config.id}-${chapter}-${paragraphIdSuffix}`;
        } else if (config.id === '8' && part !== undefined && chapter !== undefined) {
           // Madame Bovary: bookId-part-chapter-paragraphIdSuffix
           id = `${config.id}-${part}-${chapter}-${paragraphIdSuffix}`;
        } else {
           // Fallback for non-split or other formats (might need adjustment)
           // Assuming a default part/chapter if not specified for split files might be wrong.
           // If book uses split files but no part/chapter/index provided, ID generation is ambiguous.
           // For now, use a simple format, but this case should ideally not happen for split files.
           id = `${config.id}-0-0-${paragraphIdSuffix}`; // Default placeholder
           console.warn(`Ambiguous ID generation for book ${config.id}, paragraph ${paragraphIdSuffix}. Using default.`);
        }

        content.push({
          id: id,
          english: paragraph.source, // 英文原文
          chinese: paragraph.translation, // 中文翻译
        });
      }
    });

    console.log(`Processed ${content.length} paragraphs for ${config.name}${partIndex !== undefined ? ` PartIndex ${partIndex}` : ''}${chapter !== undefined ? ` Chapter ${chapter}` : ''}`);
    return content;
  } catch (error) {
    console.error(`Error processing data for ${config.name}:`, error);
    return [];
  }
}

// Cache for loaded chapter/part data
const chapterDataCache: Record<string, Chapter | null> = {};
// Cache for chapter/part metadata
const cachedChapterMetadata: Record<string, Chapter[]> = {};
// Track ongoing loading promises
const loadingChapters: Record<string, Promise<Chapter | null>> = {};

// 获取特定章节（或 Principles 的部分）的内容
export async function getChapter(bookId: string, chapterOrPartIndex: number): Promise<Chapter | null> {
  const cacheKey = `${bookId}-${chapterOrPartIndex}`;

  // Check cache first
  if (chapterDataCache[cacheKey] !== undefined) {
    return chapterDataCache[cacheKey];
  }

  // Check if already loading
  if (cacheKey in loadingChapters) {
    return await loadingChapters[cacheKey];
  }

  // Find book configuration
  const bookConfig = BOOK_CONFIGS.find(book => book.id === bookId);
  if (!bookConfig) {
    console.error(`Book configuration not found for ID: ${bookId}`);
    return null;
  }

  // Start loading
  loadingChapters[cacheKey] = (async () => {
    try {
      let chapterData: Chapter | null = null;

      // Handle split files logic
      if (bookConfig.useSplitFiles && bookConfig.cdnBaseUrl) {
        let part: number | undefined = undefined;
        let chapterInPart: number | undefined = undefined;
        let partIndex: number | undefined = undefined; // For Principles
        let chapterTitle: string = '';

        // --- Logic to determine part/chapter/partIndex based on bookId and chapterOrPartIndex ---
        if (bookId === '7') {
            // Principles: chapterOrPartIndex is the partIndex (0, 1, 2, 3)
            partIndex = chapterOrPartIndex;
            const partInfo = principlesStructure.find(p => p.index === partIndex);
            if (!partInfo) {
                console.error(`Invalid part index ${partIndex} for Principles (Book ID 7)`);
                throw new Error(`Invalid part index for Principles: ${partIndex}`);
            }
            chapterTitle = partInfo.title;

        } else if (bookId === '8') {
            // Madame Bovary: chapterOrPartIndex is the absolute chapter number (1-35)
            const absoluteChapterNumber = chapterOrPartIndex;
            if (absoluteChapterNumber <= 9) {
              part = 1;
              chapterInPart = absoluteChapterNumber;
            } else if (absoluteChapterNumber <= 24) {
              part = 2;
              chapterInPart = absoluteChapterNumber - 9;
            } else {
              part = 3;
              chapterInPart = absoluteChapterNumber - 24;
            }
            if (part === undefined || chapterInPart === undefined || chapterInPart < 1 || chapterInPart > madameBovaryPartStructure[part]) {
                 console.error(`Invalid chapter number ${absoluteChapterNumber} for Madame Bovary (Book ID 8)`);
                 throw new Error(`Invalid chapter number for Madame Bovary: ${absoluteChapterNumber}`);
            }
            chapterTitle = `Part ${part}, Chapter ${chapterInPart}`;
            console.log(`Mapped absolute chapter ${absoluteChapterNumber} to Part ${part}, Chapter ${chapterInPart}`);

        } else if (bookId === '9') {
            // The Little Prince: chapterOrPartIndex is the chapter number (1-27)
            chapterInPart = chapterOrPartIndex; // Use directly
            if (chapterInPart < 1 || chapterInPart > littlePrinceTotalChapters) {
                 console.error(`Invalid chapter number ${chapterInPart} for The Little Prince (Book ID 9)`);
                 throw new Error(`Invalid chapter number for The Little Prince: ${chapterInPart}`);
            }
            chapterTitle = `Chapter ${chapterInPart}`;
            console.log(`Loading The Little Prince chapter ${chapterInPart}`);

        } else {
            console.error(`Unsupported book ID ${bookId} for split file loading.`);
            throw new Error(`Unsupported book ID for split file loading: ${bookId}`);
        }

        // --- Fetch and process data ---
        const chapterContent = await processBookData(bookConfig, part, chapterInPart, partIndex);

        // --- Create Chapter object ---
        if (chapterContent.length > 0) {
             // Construct the chapter ID based on the book's structure
             let generatedId = `${bookId}-`;
             if (bookId === '7') {
                 generatedId += `${partIndex}`;
             } else if (bookId === '9') {
                 generatedId += `${chapterInPart}`;
             } else { // Assuming Madame Bovary or similar structure
                 generatedId += `${part}-${chapterInPart}`;
             }

             chapterData = {
               id: generatedId, // Use the determined part/chapter index
               bookId: bookId,
               chapterNumber: chapterOrPartIndex, // Keep the original requested number/index
               title: chapterTitle,
               content: chapterContent,
             };
        } else {
             console.warn(`No content found for Book ${bookId}, Chapter/PartIndex ${chapterOrPartIndex}`);
             chapterData = null; // Indicate chapter couldn't be loaded
        }

      } else {
        // --- Logic for non-split files (existing or future) ---
        console.warn(`Loading chapter ${chapterOrPartIndex} for non-split book ${bookId} - Not fully implemented`);
        // This part would need logic similar to the old createBookChapters if needed
        // For now, returns null for non-split files in this function
         chapterData = null;
      }

      // Cache the result (even if null)
      chapterDataCache[cacheKey] = chapterData;
      return chapterData;

    } catch (error) {
      console.error(`Error loading chapter ${chapterOrPartIndex} for book ${bookId}:`, error);
      chapterDataCache[cacheKey] = null; // Cache failure as null
      return null;
    } finally {
      delete loadingChapters[cacheKey]; // Remove from loading map
    }
  })();

  return await loadingChapters[cacheKey];
}

// 获取书籍的章节/部分元数据列表
export async function getChapterMetadata(bookId: string): Promise<Chapter[]> {
  // Check cache first
  if (cachedChapterMetadata[bookId]) {
    return cachedChapterMetadata[bookId];
  }

  const bookConfig = BOOK_CONFIGS.find(book => book.id === bookId);
  if (!bookConfig) {
    console.error(`Metadata requested for unknown book ID: ${bookId}`);
    return [];
  }

  const chapterMetadata: Chapter[] = [];

  // Handle split files - generate metadata without loading content
  if (bookConfig.useSplitFiles) {
      if (bookId === '7') {
          // Principles - use the defined structure
          principlesStructure.forEach(partInfo => {
              chapterMetadata.push({
                  id: `${bookId}-${partInfo.index}`, // ID based on index 0, 1, 2, 3
                  bookId: bookId,
                  chapterNumber: partInfo.index, // Use index as the number for selection
                  title: partInfo.title,
                  content: [] // Empty content array for metadata
              });
          });
          console.log(`Generated ${chapterMetadata.length} part metadata entries for Principles`);

      } else if (bookId === '8') {
          // Madame Bovary - use the part structure
          let absoluteChapterNumber = 1;
          for (let part = 1; part <= 3; part++) {
              const maxChapters = madameBovaryPartStructure[part] || 0;
              for (let chapter = 1; chapter <= maxChapters; chapter++) {
                  chapterMetadata.push({
                      id: `${bookId}-${part}-${chapter}`,
                      bookId: bookId,
                      chapterNumber: absoluteChapterNumber++,
                      title: `Part ${part}, Chapter ${chapter}`,
                      content: [] // Empty content array for metadata
                  });
              }
          }
           console.log(`Generated ${chapterMetadata.length} chapter metadata entries for Madame Bovary`);

      } else if (bookId === '9') {
          // The Little Prince - simple chapter structure
          for (let chapter = 1; chapter <= littlePrinceTotalChapters; chapter++) {
              chapterMetadata.push({
                  id: `${bookId}-${chapter}`, // ID just uses chapter number
                  bookId: bookId,
                  chapterNumber: chapter,
                  title: `Chapter ${chapter}`,
                  content: [] // Empty content array for metadata
              });
          }
          console.log(`Generated ${chapterMetadata.length} chapter metadata entries for The Little Prince`);

      } else {
          console.warn(`Metadata generation not implemented for split book ID: ${bookId}`);
      }

  } else {
      // --- Logic for non-split files ---
      // This would require fetching the *entire* book and splitting it here,
      // which is inefficient. This path should ideally be avoided.
      // If needed, adapt the logic from the old createBookChapters function here.
      console.warn(`Metadata generation requested for non-split book ID: ${bookId}. Returning empty metadata.`);
      // Example: Fetch all content and split based on markers or structure
      // const allContent = await processBookData(bookConfig);
      // ... splitting logic ...
      // chapterMetadata = ...
  }

  // Cache the metadata
  cachedChapterMetadata[bookId] = chapterMetadata;
  return chapterMetadata;
}

// Export book configurations if needed elsewhere
export const getAllBookConfigs = (): BookConfig[] => {
    return BOOK_CONFIGS;
};

// Export Principles structure if needed elsewhere (e.g., UI)
export const getPrinciplesStructure = () => {
    return principlesStructure;
};