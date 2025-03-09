import { Chapter, BilingualContent } from '../types';
import madameBovaryData from './MadameBovary_translate_cache_new.json';

// 将JSON数据转换为BilingualContent对象
function processJsonData(): BilingualContent[] {
  const content: BilingualContent[] = [];
  
  // 从新的JSON格式中获取段落数据
  if (!madameBovaryData.paragraphs) {
    console.error('Invalid data format: paragraphs array not found');
    return [];
  }
  
  // 遍历段落数组
  madameBovaryData.paragraphs.forEach((paragraph) => {
    // 确保段落有source和translation字段
    if (paragraph.source && paragraph.translation) {
      content.push({
        id: `7-1-${paragraph.id}`, // 使用段落的id
        english: paragraph.source, // 英文原文
        chinese: paragraph.translation, // 中文翻译
      });
    }
  });
  
  return content;
}

// 通过JSON数据构建包法利夫人的全部章节内容
function createMadameBovaryChapters(): Chapter[] {
  const allContent = processJsonData();
  
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
  
  // 创建章节
  const chapters: Chapter[] = [];
  
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
      id: `7-1-${i}-${item.id}` // 使用原始段落ID作为标识的一部分
    }));
    
    // 添加章节
    chapters.push({
      id: `7-1-${i}`,
      bookId: '7',
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
        id: `7-2-${i}-${item.id}` // 使用原始段落ID作为标识的一部分
      }));
      
      // 添加章节
      chapters.push({
        id: `7-2-${i}`,
        bookId: '7',
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
        id: `7-3-${i}-${item.id}` // 使用原始段落ID作为标识的一部分
      }));
      
      // 添加章节
      chapters.push({
        id: `7-3-${i}`,
        bookId: '7',
        chapterNumber: partStructure.part1 + partStructure.part2 + i,
        title: `PART III - Chapter ${i}`,
        content: chapterContent
      });
    }
  }
  
  return chapters;
}

export const chapters: Chapter[] = [
  // 添加包法利夫人的所有章节
  ...createMadameBovaryChapters()
];