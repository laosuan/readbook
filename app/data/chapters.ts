import { Chapter, BilingualContent } from '../types';

// 定义书籍配置类型
interface BookConfig {
  id: string;
  cdnUrl: string;
  name: string;
  useSplitFiles?: boolean;
  cdnBaseUrl?: string;
}

// 书籍配置
const BOOK_CONFIGS: BookConfig[] = [
  {
    id: '7',
    cdnUrl: 'https://cdn.readwordly.com/principles_bilingual_data.json',
    name: 'Principles',
    useSplitFiles: false
  },
  {
    id: '8',
    cdnUrl: 'https://cdn.readwordly.com/MadameBovary_translate_bilingual_data_20250310.json',
    name: 'GPT-4.5',
    useSplitFiles: true,
    cdnBaseUrl: 'https://cdn.readwordly.com/MadameBovary/20250310/'
  },
  {
    id: '9',
    cdnUrl: 'https://cdn.readwordly.com/TheLittlePrince/20250310/bilingual_1.json',
    name: 'The Little Prince',
    useSplitFiles: true,
    cdnBaseUrl: 'https://cdn.readwordly.com/TheLittlePrince/20250403/'
  }
];

// 记录已经尝试但未成功的URL，避免重复请求
const failedDataUrls: Set<string> = new Set();

// 通用函数：从CDN获取数据
async function fetchBookData(config: BookConfig, part?: number, chapter?: number) {
  try {
    let url = config.cdnUrl;
    
    // 如果使用分割文件，则构建URL
    if (config.useSplitFiles && config.cdnBaseUrl) {
      if (config.id === '9' && chapter !== undefined) {
        // 小王子的文件格式不使用part，直接是bilingual_1.json到bilingual_27.json
        url = `${config.cdnBaseUrl}bilingual_${chapter}.json`;
      } else if (part !== undefined && chapter !== undefined) {
        url = `${config.cdnBaseUrl}bilingual_${part}-${chapter}.json`;
      }
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
async function processBookData(config: BookConfig, part?: number, chapter?: number): Promise<BilingualContent[]> {
  const content: BilingualContent[] = [];
  
  // 获取数据
  const bookData = await fetchBookData(config, part, chapter);
  
  // 检查数据格式
  if (!bookData.paragraphs) {
    console.error(`Invalid ${config.name} data format: paragraphs array not found`);
    return [];
  }

  // 遍历段落数组
  bookData.paragraphs.forEach((paragraph: { id: string; source: string; translation: string }) => {
    // 确保段落有source和translation字段
    if (paragraph.source && paragraph.translation) {
      // 如果使用分割文件，则使用正确的ID格式
      const id = config.useSplitFiles && part && chapter
        ? `${config.id}-${part}-${chapter}-${paragraph.id}`
        : `${config.id}-1-${paragraph.id}`;

      content.push({
        id: id,
        english: paragraph.source, // 英文原文
        chinese: paragraph.translation, // 中文翻译
      });
    }
  });
  
  return content;
}

// 通用函数：构建章节内容
async function createBookChapters(config: BookConfig): Promise<Chapter[]> {
  // 创建章节
  const chapters: Chapter[] = [];
  
  // 如果使用分割文件，则不在此处加载所有章节，而是返回章节元数据
  if (config.useSplitFiles) {
    // 定义各部分章节数
    const partStructure: Record<number, number> = {
      1: 9,  // 第一部分有9章
      2: 15, // 第二部分有15章
      3: 11  // 第三部分有11章
    };
    
    // 从配置中提取bookId
    const bookId = config.id;
    
    // 计算累积章节编号
    let cumulativeChapterNumber = 0;
    
    // 为每个部分和章节创建章节元数据对象 (不加载内容)
    for (let part = 1; part <= 3; part++) {
      const maxChapters = partStructure[part] || 0;
      
      // 为每个章节创建章节元数据对象
      for (let chapter = 1; chapter <= maxChapters; chapter++) {
        cumulativeChapterNumber++;
        
        // 创建章节对象，但不加载内容
        chapters.push({
          id: `${bookId}-${part}-${chapter}`,
          bookId: bookId,
          chapterNumber: cumulativeChapterNumber,
          title: `Part ${part}, Chapter ${chapter}`,
          content: [] // 空内容，稍后按需加载
        });
      }
    }
    
    console.log(`Created ${chapters.length} chapter metadata objects for ${config.name} without loading content`);
    return chapters;
  }
  
  // 对于Principles (ID 7)，使用特殊的处理逻辑
  if (config.id === '7') {
    // 获取所有内容
    const allContent = await processBookData(config);
    
    // 根据Principles的结构定义章节
    const principlesStructure = [
      { title: "Introduction", startId: 7, endId: 29 },
      { title: "Part 1: The Importance of Principles", startId: 30, endId: 54 },
      { title: "Part 2: My Most Fundamental Life Principles", startId: 55, endId: 308 },
      { title: "Part 3: My Management Principles", startId: 309, endId: 2000 } // 使用一个较大的数字作为结束，以包含所有剩余内容
    ];
    
    // 创建各章节
    principlesStructure.forEach((section, index) => {
      // 查找章节的开始和结束索引
      const startIndex = allContent.findIndex(item => parseInt(item.id.split('-').pop() || '0', 10) === section.startId);
      let endIndex = allContent.length;
      
      // 如果不是最后一章，找到下一章的起始位置
      if (index < principlesStructure.length - 1) {
        const nextStartIndex = allContent.findIndex(item => parseInt(item.id.split('-').pop() || '0', 10) === principlesStructure[index + 1].startId);
        if (nextStartIndex > -1) {
          endIndex = nextStartIndex;
        }
      }
      
      // 如果找不到章节标记，则跳过
      if (startIndex === -1) {
        console.warn(`Could not find start of section: ${section.title}`);
        return;
      }
      
      // 创建章节内容
      const chapterContent = allContent.slice(startIndex, endIndex).map((item) => ({
        ...item
      }));
      
      // 添加章节
      chapters.push({
        id: `${config.id}-${index + 1}`,
        bookId: config.id,
        chapterNumber: index + 1,
        title: section.title,
        content: chapterContent
      });
      
      console.log(`Created Principles chapter: ${section.title} with ${chapterContent.length} paragraphs`);
    });
    
    return chapters;
  }
  
  // 原始逻辑：使用单一文件
  const allContent = await processBookData(config);

  // 定义各部分章节数
  const partStructure = {
    part1: 9,  // 第一部分有9章
    part2: 15, // 第二部分有15章
    part3: 11  // 第三部分有11章
  };
  
  // 章节标记在JSON中的位置
  const chapterMarkers = {
    partI: "Part I",
    partII: "Part II",
    partIII: "Part III",
    chapterOne: "Chapter One",
    chapterTwo: "Chapter Two",
    chapterThree: "Chapter Three",
    chapterFour: "Chapter Four",
    chapterFive: "Chapter Five",
    chapterSix: "Chapter Six",
    chapterSeven: "Chapter Seven",
    chapterEight: "Chapter Eight",
    chapterNine: "Chapter Nine",
    chapterTen: "Chapter Ten",
    chapterEleven: "Chapter Eleven",
    chapterTwelve: "Chapter Twelve",
    chapterThirteen: "Chapter Thirteen",
    chapterFourteen: "Chapter Fourteen",
    chapterFifteen: "Chapter Fifteen"
  };
  
  // 查找章节标记在内容中的索引
  function findMarkerIndex(marker: string): number {
    return allContent.findIndex(item => item.english === marker);
  }
  
  // 查找所有章节标记的索引
  const markerIndices = {
    partI: findMarkerIndex(chapterMarkers.partI),
    partII: findMarkerIndex(chapterMarkers.partII),
    partIII: findMarkerIndex(chapterMarkers.partIII),
    // 第一部分章节
    part1Ch1: findMarkerIndex(chapterMarkers.chapterOne),
    part1Ch2: findMarkerIndex(chapterMarkers.chapterTwo),
    part1Ch3: findMarkerIndex(chapterMarkers.chapterThree),
    part1Ch4: findMarkerIndex(chapterMarkers.chapterFour),
    part1Ch5: findMarkerIndex(chapterMarkers.chapterFive),
    part1Ch6: findMarkerIndex(chapterMarkers.chapterSix),
    part1Ch7: findMarkerIndex(chapterMarkers.chapterSeven),
    part1Ch8: findMarkerIndex(chapterMarkers.chapterEight),
    part1Ch9: findMarkerIndex(chapterMarkers.chapterNine),
    // 第二部分章节
    part2Ch1: -1, // 将在后面查找
    part2Ch2: -1,
    part2Ch3: -1,
    part2Ch4: -1,
    part2Ch5: -1,
    part2Ch6: -1,
    part2Ch7: -1,
    part2Ch8: -1,
    part2Ch9: -1,
    part2Ch10: -1,
    part2Ch11: -1,
    part2Ch12: -1,
    part2Ch13: -1,
    part2Ch14: -1,
    part2Ch15: -1,
    // 第三部分章节
    part3Ch1: -1, // 将在后面查找
    part3Ch2: -1,
    part3Ch3: -1,
    part3Ch4: -1,
    part3Ch5: -1,
    part3Ch6: -1,
    part3Ch7: -1,
    part3Ch8: -1,
    part3Ch9: -1,
    part3Ch10: -1,
    part3Ch11: -1
  };
  
  // 在特定部分内查找章节标记
  function findChapterInPart(marker: string, startIdx: number, endIdx: number): number {
    for (let i = startIdx; i < endIdx; i++) {
      if (allContent[i].english === marker) {
        return i;
      }
    }
    return -1;
  }
  
  // 查找第二部分和第三部分的所有章节
  if (markerIndices.partII > -1) {
    const part2EndIndex = markerIndices.partIII > -1 ? markerIndices.partIII : allContent.length;
    
    // 查找第二部分的所有章节
    markerIndices.part2Ch1 = findChapterInPart(chapterMarkers.chapterOne, markerIndices.partII, part2EndIndex);
    markerIndices.part2Ch2 = findChapterInPart(chapterMarkers.chapterTwo, markerIndices.partII, part2EndIndex);
    markerIndices.part2Ch3 = findChapterInPart(chapterMarkers.chapterThree, markerIndices.partII, part2EndIndex);
    markerIndices.part2Ch4 = findChapterInPart(chapterMarkers.chapterFour, markerIndices.partII, part2EndIndex);
    markerIndices.part2Ch5 = findChapterInPart(chapterMarkers.chapterFive, markerIndices.partII, part2EndIndex);
    markerIndices.part2Ch6 = findChapterInPart(chapterMarkers.chapterSix, markerIndices.partII, part2EndIndex);
    markerIndices.part2Ch7 = findChapterInPart(chapterMarkers.chapterSeven, markerIndices.partII, part2EndIndex);
    markerIndices.part2Ch8 = findChapterInPart(chapterMarkers.chapterEight, markerIndices.partII, part2EndIndex);
    markerIndices.part2Ch9 = findChapterInPart(chapterMarkers.chapterNine, markerIndices.partII, part2EndIndex);
    markerIndices.part2Ch10 = findChapterInPart(chapterMarkers.chapterTen, markerIndices.partII, part2EndIndex);
    markerIndices.part2Ch11 = findChapterInPart(chapterMarkers.chapterEleven, markerIndices.partII, part2EndIndex);
    markerIndices.part2Ch12 = findChapterInPart(chapterMarkers.chapterTwelve, markerIndices.partII, part2EndIndex);
    markerIndices.part2Ch13 = findChapterInPart(chapterMarkers.chapterThirteen, markerIndices.partII, part2EndIndex);
    markerIndices.part2Ch14 = findChapterInPart(chapterMarkers.chapterFourteen, markerIndices.partII, part2EndIndex);
    markerIndices.part2Ch15 = findChapterInPart(chapterMarkers.chapterFifteen, markerIndices.partII, part2EndIndex);
  }
  
  if (markerIndices.partIII > -1) {
    // 查找第三部分的所有章节
    markerIndices.part3Ch1 = findChapterInPart(chapterMarkers.chapterOne, markerIndices.partIII, allContent.length);
    markerIndices.part3Ch2 = findChapterInPart(chapterMarkers.chapterTwo, markerIndices.partIII, allContent.length);
    markerIndices.part3Ch3 = findChapterInPart(chapterMarkers.chapterThree, markerIndices.partIII, allContent.length);
    markerIndices.part3Ch4 = findChapterInPart(chapterMarkers.chapterFour, markerIndices.partIII, allContent.length);
    markerIndices.part3Ch5 = findChapterInPart(chapterMarkers.chapterFive, markerIndices.partIII, allContent.length);
    markerIndices.part3Ch6 = findChapterInPart(chapterMarkers.chapterSix, markerIndices.partIII, allContent.length);
    markerIndices.part3Ch7 = findChapterInPart(chapterMarkers.chapterSeven, markerIndices.partIII, allContent.length);
    markerIndices.part3Ch8 = findChapterInPart(chapterMarkers.chapterEight, markerIndices.partIII, allContent.length);
    markerIndices.part3Ch9 = findChapterInPart(chapterMarkers.chapterNine, markerIndices.partIII, allContent.length);
    markerIndices.part3Ch10 = findChapterInPart(chapterMarkers.chapterTen, markerIndices.partIII, allContent.length);
    markerIndices.part3Ch11 = findChapterInPart(chapterMarkers.chapterEleven, markerIndices.partIII, allContent.length);
  }
  
  // 已在函数开始处创建了章节数组
  
  // 创建第一部分的章节
  for (let i = 1; i <= partStructure.part1; i++) {
    let startIndex, endIndex;
    
    // 确定章节的起始和结束索引
    if (i === 1) {
      startIndex = markerIndices.part1Ch1;
      endIndex = markerIndices.part1Ch2;
    } else if (i === 2) {
      startIndex = markerIndices.part1Ch2;
      endIndex = markerIndices.part1Ch3;
    } else if (i === 3) {
      startIndex = markerIndices.part1Ch3;
      endIndex = markerIndices.part1Ch4;
    } else if (i === 4) {
      startIndex = markerIndices.part1Ch4;
      endIndex = markerIndices.part1Ch5;
    } else if (i === 5) {
      startIndex = markerIndices.part1Ch5;
      endIndex = markerIndices.part1Ch6;
    } else if (i === 6) {
      startIndex = markerIndices.part1Ch6;
      endIndex = markerIndices.part1Ch7;
    } else if (i === 7) {
      startIndex = markerIndices.part1Ch7;
      endIndex = markerIndices.part1Ch8;
    } else if (i === 8) {
      startIndex = markerIndices.part1Ch8;
      endIndex = markerIndices.part1Ch9;
    } else if (i === 9) {
      startIndex = markerIndices.part1Ch9;
      endIndex = markerIndices.partII;
    }
    
    // 如果找不到章节标记，则跳过
    if (startIndex === -1 || endIndex === -1) {
      continue;
    }
    
    // 创建章节内容
    const chapterContent = allContent.slice(startIndex, endIndex).map((item) => ({
      ...item,
      id: `${config.id}-1-${i}-${item.id.split('-').pop()}` // 使用原始段落ID作为标识的一部分
    }));
    
    // 添加章节
    chapters.push({
      id: `${config.id}-1-${i}`,
      bookId: config.id,
      chapterNumber: i,
      title: `PART I - Chapter ${i}`,
      content: chapterContent
    });
  }
  
  // 为第二部分创建章节
  if (markerIndices.partII > -1) {
    for (let i = 1; i <= partStructure.part2; i++) {
      let startIndex, endIndex;
      
      // 确定章节的起始和结束索引
      if (i === 1) {
        startIndex = markerIndices.part2Ch1;
        endIndex = markerIndices.part2Ch2 > -1 ? markerIndices.part2Ch2 : markerIndices.partIII;
      } else if (i === 2) {
        startIndex = markerIndices.part2Ch2;
        endIndex = markerIndices.part2Ch3 > -1 ? markerIndices.part2Ch3 : markerIndices.partIII;
      } else if (i === 3) {
        startIndex = markerIndices.part2Ch3;
        endIndex = markerIndices.part2Ch4 > -1 ? markerIndices.part2Ch4 : markerIndices.partIII;
      } else if (i === 4) {
        startIndex = markerIndices.part2Ch4;
        endIndex = markerIndices.part2Ch5 > -1 ? markerIndices.part2Ch5 : markerIndices.partIII;
      } else if (i === 5) {
        startIndex = markerIndices.part2Ch5;
        endIndex = markerIndices.part2Ch6 > -1 ? markerIndices.part2Ch6 : markerIndices.partIII;
      } else if (i === 6) {
        startIndex = markerIndices.part2Ch6;
        endIndex = markerIndices.part2Ch7 > -1 ? markerIndices.part2Ch7 : markerIndices.partIII;
      } else if (i === 7) {
        startIndex = markerIndices.part2Ch7;
        endIndex = markerIndices.part2Ch8 > -1 ? markerIndices.part2Ch8 : markerIndices.partIII;
      } else if (i === 8) {
        startIndex = markerIndices.part2Ch8;
        endIndex = markerIndices.part2Ch9 > -1 ? markerIndices.part2Ch9 : markerIndices.partIII;
      } else if (i === 9) {
        startIndex = markerIndices.part2Ch9;
        endIndex = markerIndices.part2Ch10 > -1 ? markerIndices.part2Ch10 : markerIndices.partIII;
      } else if (i === 10) {
        startIndex = markerIndices.part2Ch10;
        endIndex = markerIndices.part2Ch11 > -1 ? markerIndices.part2Ch11 : markerIndices.partIII;
      } else if (i === 11) {
        startIndex = markerIndices.part2Ch11;
        endIndex = markerIndices.part2Ch12 > -1 ? markerIndices.part2Ch12 : markerIndices.partIII;
      } else if (i === 12) {
        startIndex = markerIndices.part2Ch12;
        endIndex = markerIndices.part2Ch13 > -1 ? markerIndices.part2Ch13 : markerIndices.partIII;
      } else if (i === 13) {
        startIndex = markerIndices.part2Ch13;
        endIndex = markerIndices.part2Ch14 > -1 ? markerIndices.part2Ch14 : markerIndices.partIII;
      } else if (i === 14) {
        startIndex = markerIndices.part2Ch14;
        endIndex = markerIndices.part2Ch15 > -1 ? markerIndices.part2Ch15 : markerIndices.partIII;
      } else if (i === 15) {
        startIndex = markerIndices.part2Ch15;
        endIndex = markerIndices.partIII > -1 ? markerIndices.partIII : allContent.length;
      }
      
      // 如果找不到章节标记，则跳过
      if (startIndex === -1) {
        continue;
      }
      
      // 如果找不到结束标记，使用下一个部分的开始或文件结束
      if (endIndex === -1) {
        endIndex = markerIndices.partIII > -1 ? markerIndices.partIII : allContent.length;
      }
      
      // 创建章节内容
      const chapterContent = allContent.slice(startIndex, endIndex).map((item) => ({
        ...item,
        id: `${config.id}-2-${i}-${item.id.split('-').pop()}` // 使用原始段落ID作为标识的一部分
      }));
      
      // 添加章节
      chapters.push({
        id: `${config.id}-2-${i}`,
        bookId: config.id,
        chapterNumber: partStructure.part1 + i,
        title: `PART II - Chapter ${i}`,
        content: chapterContent
      });
    }
  }
  
  // 为第三部分创建章节
  if (markerIndices.partIII > -1) {
    for (let i = 1; i <= partStructure.part3; i++) {
      let startIndex, endIndex;
      
      // 确定章节的起始和结束索引
      if (i === 1) {
        startIndex = markerIndices.part3Ch1;
        endIndex = markerIndices.part3Ch2 > -1 ? markerIndices.part3Ch2 : allContent.length;
      } else if (i === 2) {
        startIndex = markerIndices.part3Ch2;
        endIndex = markerIndices.part3Ch3 > -1 ? markerIndices.part3Ch3 : allContent.length;
      } else if (i === 3) {
        startIndex = markerIndices.part3Ch3;
        endIndex = markerIndices.part3Ch4 > -1 ? markerIndices.part3Ch4 : allContent.length;
      } else if (i === 4) {
        startIndex = markerIndices.part3Ch4;
        endIndex = markerIndices.part3Ch5 > -1 ? markerIndices.part3Ch5 : allContent.length;
      } else if (i === 5) {
        startIndex = markerIndices.part3Ch5;
        endIndex = markerIndices.part3Ch6 > -1 ? markerIndices.part3Ch6 : allContent.length;
      } else if (i === 6) {
        startIndex = markerIndices.part3Ch6;
        endIndex = markerIndices.part3Ch7 > -1 ? markerIndices.part3Ch7 : allContent.length;
      } else if (i === 7) {
        startIndex = markerIndices.part3Ch7;
        endIndex = markerIndices.part3Ch8 > -1 ? markerIndices.part3Ch8 : allContent.length;
      } else if (i === 8) {
        startIndex = markerIndices.part3Ch8;
        endIndex = markerIndices.part3Ch9 > -1 ? markerIndices.part3Ch9 : allContent.length;
      } else if (i === 9) {
        startIndex = markerIndices.part3Ch9;
        endIndex = markerIndices.part3Ch10 > -1 ? markerIndices.part3Ch10 : allContent.length;
      } else if (i === 10) {
        startIndex = markerIndices.part3Ch10;
        endIndex = markerIndices.part3Ch11 > -1 ? markerIndices.part3Ch11 : allContent.length;
      } else if (i === 11) {
        startIndex = markerIndices.part3Ch11;
        endIndex = allContent.length;
      }
      
      // 如果找不到章节标记，则跳过
      if (startIndex === -1) {
        continue;
      }
      
      // 创建章节内容
      const chapterContent = allContent.slice(startIndex, endIndex).map((item) => ({
        ...item,
        id: `${config.id}-3-${i}-${item.id.split('-').pop()}` // 使用原始段落ID作为标识的一部分
      }));
      
      // 添加章节
      chapters.push({
        id: `${config.id}-3-${i}`,
        bookId: config.id,
        chapterNumber: partStructure.part1 + partStructure.part2 + i,
        title: `PART III - Chapter ${i}`,
        content: chapterContent
      });
    }
  }
  
  // Log the first chapter to help with debugging
  if (chapters.length > 0) {
    console.log(`First ${config.name} chapter:`, {
      id: chapters[0].id,
      bookId: chapters[0].bookId,
      chapterNumber: chapters[0].chapterNumber,
      title: chapters[0].title,
      contentLength: chapters[0].content.length
    });
  } else {
    console.log(`No ${config.name} chapters were created`);
  }
  
  return chapters;
}

// Cache for chapters and chapter metadata
let cachedChapters: Chapter[] | null = null;
const cachedChapterMetadata: Record<string, Chapter[]> = {};

// Cache to track in-progress chapter loading to prevent duplicate requests
const loadingChapters: Record<string, Promise<Chapter | null>> = {};

// Define interface for raw bilingual data format
// This interface is used in the fetchBookData function when parsing the data
export interface RawBilingualData {
  title: string;
  author: string;
  language: {
    source: string;
    target: string;
  };
  chapter: number;
  paragraphs: {
    id: number | string;
    source: string;
    translation: string;
    image?: string;
  }[];
}

// Function to get a single chapter by bookId and chapterNumber
export async function getChapter(bookId: string, chapterNumber: number): Promise<Chapter | null> {
  const cacheKey = `${bookId}-${chapterNumber}`;
  
  // If this chapter is already being loaded, return the existing promise
  if (cacheKey in loadingChapters) {
    return loadingChapters[cacheKey];
  }
  
  // Create a loading promise and store it
  loadingChapters[cacheKey] = (async () => {
    try {
      // Check if we have the chapter in cache already with content
      if (cachedChapters) {
        const cachedChapter = cachedChapters.find(
          chapter => chapter.bookId === bookId && 
                    chapter.chapterNumber === chapterNumber && 
                    chapter.content && 
                    chapter.content.length > 0
        );
        if (cachedChapter) {
          return cachedChapter;
        } else {
          console.log(`Found cached chapter ${bookId}-${chapterNumber} but it has no content, will reload`);
        }
      }
      
      // Find the book config
      const bookConfig = BOOK_CONFIGS.find(config => config.id === bookId);
      if (!bookConfig) {
        console.error(`Book config not found for ID: ${bookId}`);
        return null;
      }
      
      // For split files, we can load just the specific chapter
      if (bookConfig.useSplitFiles) {
        // Calculate part and chapter based on chapterNumber
        // Define parts structure
        const partStructure: Record<number, number> = {
          1: 9,  // 第一部分有9章
          2: 15, // 第二部分有15章
          3: 11  // 第三部分有11章
        };
        
        // Calculate the correct part and chapter within that part
        let part = 1;
        let chapterInPart = chapterNumber;
        
        // For Madame Bovary (bookId 8), we have a specific structure
        if (bookId === '8') {
          if (chapterNumber <= 9) {
            part = 1;
            chapterInPart = chapterNumber; // Part 1: Chapters 1-9
          } else if (chapterNumber <= 24) {
            part = 2;
            chapterInPart = chapterNumber - 9; // Part 2: Chapters 10-24 (1-15 within part 2)
          } else {
            part = 3;
            chapterInPart = chapterNumber - 24; // Part 3: Chapters 25-35 (1-11 within part 3)
          }
          
          console.log(`Mapped absolute chapter ${chapterNumber} to Part ${part}, Chapter ${chapterInPart}`);
        } 
        // For The Little Prince (bookId 9), we have a simpler structure
        else if (bookId === '9') {
          // 小王子没有part的概念，直接使用章节号
          part = 0; // 不使用part
          chapterInPart = chapterNumber; // 直接使用章节号
          
          console.log(`Loading The Little Prince chapter ${chapterNumber}`);
        }
        else {
          // For other books, use a more generic approach
          let cumulativeChapters = 0;
          
          for (let p = 1; p <= 3; p++) {
            if (chapterNumber <= cumulativeChapters + partStructure[p]) {
              part = p;
              chapterInPart = chapterNumber - cumulativeChapters;
              break;
            }
            cumulativeChapters += partStructure[p];
          }
        }
        
        // Get content for this specific chapter only
        const content = await fetchBookData(bookConfig, part, chapterInPart)
          .then(bookData => {
            // Process only this chapter's data
            if (!bookData.paragraphs) {
              console.error(`Invalid ${bookConfig.name} data format: paragraphs array not found`);
              return [];
            }
            
            return bookData.paragraphs.map((paragraph: { id: string; source: string; translation: string; image?: string }) => {
              // Ensure paragraph has source and translation fields
              if (paragraph.source && paragraph.translation) {
                // 对于小王子，使用不同的ID格式
                const id = bookId === '9' 
                  ? `${bookId}-${chapterInPart}-${paragraph.id}` 
                  : `${bookId}-${part}-${chapterInPart}-${paragraph.id}`;
                
                // For The Little Prince (bookId 9), include the image property if it exists
                if (bookId === '9' && paragraph.image) {
                  return {
                    id: id,
                    english: paragraph.source,
                    chinese: paragraph.translation,
                    image: paragraph.image
                  };
                }
                
                return {
                  id: id,
                  english: paragraph.source,
                  chinese: paragraph.translation,
                };
              }
              return null;
            }).filter(Boolean) as BilingualContent[];
          });
        
        if (content.length > 0) {
          // Create the chapter
          const chapter: Chapter = {
            // 对于小王子，使用不同的ID格式和标题
            id: bookId === '9' ? `${bookId}-${chapterInPart}` : `${bookId}-${part}-${chapterInPart}`,
            bookId: bookId,
            chapterNumber: chapterNumber,
            title: bookId === '9' ? `Chapter ${chapterInPart}` : `Part ${part}, Chapter ${chapterInPart}`,
            content: content
          };
          
          // Cache this chapter if we have a cache
          if (cachedChapters) {
            // Check if this chapter already exists in cache
            const existingIndex = cachedChapters.findIndex(
              c => c.bookId === bookId && c.chapterNumber === chapterNumber
            );
            
            if (existingIndex >= 0) {
              // Replace existing chapter
              cachedChapters[existingIndex] = chapter;
            } else {
              // Add new chapter to cache
              cachedChapters.push(chapter);
            }
          }
          
          return chapter;
        }
      } else {
        // For non-split files, we need to get all chapters and find the one we want
        // This is less efficient but maintains compatibility with older format
        console.log(`Loading all chapters for non-split file book ${bookId} to find chapter ${chapterNumber}`);
        const allChapters = await getChapters();
        return allChapters.find(chapter => chapter.bookId === bookId && chapter.chapterNumber === chapterNumber) || null;
      }
      
      // If we get here, we couldn't find the chapter
      console.error(`Chapter ${chapterNumber} not found for book ${bookId}`);
      return null;
    } catch (error) {
      console.error(`Error loading chapter ${chapterNumber} for book ${bookId}:`, error);
      return null;
    } finally {
      // Remove from loading cache once done (either success or failure)
      delete loadingChapters[cacheKey];
    }
  })();
  
  return loadingChapters[cacheKey];
}

// Function to get chapter metadata for a specific book without loading content
export async function getChapterMetadata(bookId: string): Promise<Chapter[]> {
  // Check if we have cached metadata for this book
  if (cachedChapterMetadata[bookId] && cachedChapterMetadata[bookId].length > 0) {
    return cachedChapterMetadata[bookId];
  }
  
  // Find the book config
  const bookConfig = BOOK_CONFIGS.find(config => config.id === bookId);
  if (!bookConfig) {
    console.error(`Book config not found for ID: ${bookId}`);
    return [];
  }
  
  // For split files, we can generate metadata without loading content
  if (bookConfig.useSplitFiles) {
    const chapterMetadata: Chapter[] = [];
    
    // Define parts structure
    const partStructure: Record<number, number> = {
      1: 9,  // 第一部分有9章
      2: 15, // 第二部分有15章
      3: 11  // 第三部分有11章
    };
    
    // Generate metadata for each part and chapter
    if (bookId === '8') { // Special case for Madame Bovary
      // Part 1: Chapters 1-9
      for (let chapter = 1; chapter <= partStructure[1]; chapter++) {
        const absoluteChapterNumber = chapter; // In part 1, chapter numbers align with absolute numbering
        chapterMetadata.push({
          id: `${bookId}-1-${chapter}`,
          bookId: bookId,
          chapterNumber: absoluteChapterNumber,
          title: `Part 1, Chapter ${chapter}`,
          content: [] // Empty content array for metadata
        });
      }
      
      // Part 2: Chapters 1-15 (maps to absolute chapters 10-24)
      for (let chapter = 1; chapter <= partStructure[2]; chapter++) {
        const absoluteChapterNumber = chapter + partStructure[1]; // Add Part 1 chapters to get absolute number
        chapterMetadata.push({
          id: `${bookId}-2-${chapter}`,
          bookId: bookId,
          chapterNumber: absoluteChapterNumber,
          title: `Part 2, Chapter ${chapter}`,
          content: [] // Empty content array for metadata
        });
      }
      
      // Part 3: Chapters 1-11 (maps to absolute chapters 25-35)
      for (let chapter = 1; chapter <= partStructure[3]; chapter++) {
        const absoluteChapterNumber = chapter + partStructure[1] + partStructure[2]; // Add Part 1+2 chapters
        chapterMetadata.push({
          id: `${bookId}-3-${chapter}`,
          bookId: bookId,
          chapterNumber: absoluteChapterNumber,
          title: `Part 3, Chapter ${chapter}`,
          content: [] // Empty content array for metadata
        });
      }
      
      console.log(`Generated ${chapterMetadata.length} chapter metadata entries for book ${bookId}`);
    } 
    // Special case for The Little Prince
    else if (bookId === '9') {
      // 小王子有27个章节，编号从1到27
      const totalChapters = 27;
      
      for (let chapter = 1; chapter <= totalChapters; chapter++) {
        chapterMetadata.push({
          id: `${bookId}-${chapter}`,
          bookId: bookId,
          chapterNumber: chapter,
          title: `Chapter ${chapter}`,
          content: [] // Empty content array for metadata
        });
      }
      
      console.log(`Generated ${chapterMetadata.length} chapter metadata entries for The Little Prince`);
    }
    else {
      // For other books, use a simpler approach
      let absoluteChapterNumber = 1;
      
      for (let part = 1; part <= 3; part++) {
        const maxChapters = partStructure[part] || 0;
        
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
    }
    
    // Cache the metadata
    cachedChapterMetadata[bookId] = chapterMetadata;
    return chapterMetadata;
  }
  
  // For non-split files, we need to get all chapters and filter
  // This is less efficient but maintains compatibility
  const allChapters = await getChapters();
  const bookChapters = allChapters.filter(chapter => chapter.bookId === bookId);
  
  // Create metadata versions (without content)
  const chapterMetadata = bookChapters.map(chapter => ({
    ...chapter,
    content: [] // Replace content with empty array
  }));
  
  // Cache the metadata
  cachedChapterMetadata[bookId] = chapterMetadata;
  return chapterMetadata;
}

// Function to get all chapters with full content
export async function getChapters(): Promise<Chapter[]> {
  if (cachedChapters && cachedChapters.length > 0) {
    return cachedChapters;
  }
  
  // 获取所有书籍的章节
  const allChapters: Chapter[] = [];
  
  // 并行获取所有书籍的章节
  const chapterPromises = BOOK_CONFIGS.map(config => createBookChapters(config));
  const chapterResults = await Promise.all(chapterPromises);
  
  // 合并所有章节
  chapterResults.forEach(chapters => {
    allChapters.push(...chapters);
  });
  
  cachedChapters = allChapters;
  return cachedChapters;
}

// For backward compatibility, also export a chapters object that will be populated asynchronously
export let chapters: Chapter[] = [];

// Initialize chapters on module load
(async () => {
  try {
    chapters = await getChapters();
  } catch (error) {
    console.error('Failed to initialize chapters:', error);
  }
})();