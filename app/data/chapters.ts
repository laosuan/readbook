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
    // 第三部分章节
    part3Ch1: -1 // 将在后面查找
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
  
  // 查找第二部分和第三部分的第一章
  if (markerIndices.partII > -1) {
    markerIndices.part2Ch1 = findChapterInPart(chapterMarkers.chapterOne, markerIndices.partII, markerIndices.partIII > -1 ? markerIndices.partIII : allContent.length);
  }
  
  if (markerIndices.partIII > -1) {
    markerIndices.part3Ch1 = findChapterInPart(chapterMarkers.chapterOne, markerIndices.partIII, allContent.length);
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
  
  // 为第二部分和第三部分创建章节
  // 由于JSON中没有明确的章节标记，我们将平均分配内容
  
  // 第二部分
  if (markerIndices.partII > -1) {
    // 第二部分的结束位置
    const part2End = markerIndices.partIII > -1 ? markerIndices.partIII : allContent.length;
    
    // 计算每个章节的大致大小
    const part2Content = allContent.slice(markerIndices.partII, part2End);
    const part2ChapterSize = Math.ceil(part2Content.length / partStructure.part2);
    
    // 第二部分章节的起始位置
    const part2StartIndex = markerIndices.part2Ch1 > -1 ? markerIndices.part2Ch1 : markerIndices.partII;
    
    for (let i = 1; i <= partStructure.part2; i++) {
      const startIndex = part2StartIndex + (i - 1) * part2ChapterSize;
      const endIndex = i === partStructure.part2 ? part2End : part2StartIndex + i * part2ChapterSize;
      
      const chapterContent = allContent.slice(startIndex, endIndex).map((item) => ({
        ...item,
        id: `7-2-${i}-${item.id}` // 使用原始段落ID作为标识的一部分
      }));
      
      chapters.push({
        id: `7-2-${i}`,
        bookId: '7',
        chapterNumber: partStructure.part1 + i,
        title: `PART II - Chapter ${i}`,
        content: chapterContent
      });
    }
  }
  
  // 第三部分
  if (markerIndices.partIII > -1) {
    // 计算每个章节的大致大小
    const part3Content = allContent.slice(markerIndices.partIII);
    const part3ChapterSize = Math.ceil(part3Content.length / partStructure.part3);
    
    // 第三部分章节的起始位置
    const part3StartIndex = markerIndices.part3Ch1 > -1 ? markerIndices.part3Ch1 : markerIndices.partIII;
    
    for (let i = 1; i <= partStructure.part3; i++) {
      const startIndex = part3StartIndex + (i - 1) * part3ChapterSize;
      const endIndex = i === partStructure.part3 ? allContent.length : part3StartIndex + i * part3ChapterSize;
      
      const chapterContent = allContent.slice(startIndex, endIndex).map((item) => ({
        ...item,
        id: `7-3-${i}-${item.id}` // 使用原始段落ID作为标识的一部分
      }));
      
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
  ...createMadameBovaryChapters(),
  
  // 原有章节
  {
    id: '1-1',
    bookId: '1',
    chapterNumber: 1,
    title: 'Chapter 1',
    content: [
      {
        id: '1-1-1',
        english: "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.",
        chinese: "这是一个普遍承认的真理，一个有钱的单身汉，必定需要一位太太。"
      },
      {
        id: '1-1-2',
        english: "However little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families, that he is considered the rightful property of some one or other of their daughters.",
        chinese: "不管这种单身汉的性情和看法怎样，这一条真理早已深深地印在他四周各家人的心中，因此，这样的单身汉一搬进一个地方，尽管别人还没有了解过他的性情和看法，四周各家就已经把他看作自己某一个女儿理所应得的财产了。"
      },
      {
        id: '1-1-3',
        english: "\"My dear Mr. Bennet,\" said his lady to him one day, \"have you heard that Netherfield Park is let at last?\"",
        chinese: "有一天，班纳特太太对她的丈夫说：\"我的好老爷，彭伯里庄园终于租出去了，你听说了没有？\""
      },
      {
        id: '1-1-4',
        english: "Mr. Bennet replied that he had not.",
        chinese: "班纳特先生回答说，他没有听说。"
      },
      {
        id: '1-1-5',
        english: "\"But it is,\" returned she; \"for Mrs. Long has just been here, and she told me all about it.\"",
        chinese: "\"可是确实租出去了,\"她说,\"朗格太太刚刚来过这里，把这件事的底细对我说了。\""
      }
    ]
  },
  {
    id: '1-2',
    bookId: '1',
    chapterNumber: 2,
    title: 'Chapter 2',
    content: [
      {
        id: '1-2-1',
        english: "Mr. Bennet was among the earliest of those who waited on Mr. Bingley. He had always intended to visit him, though to the last always assuring his wife that he should not go; and till the evening after the visit was paid she had no knowledge of it.",
        chinese: "班纳特先生是最早去拜访彬格莱先生的人之一。他本来就打算去拜访他，虽然到最后他还是一直跟他的太太说他不去；直到拜访过后的那天晚上，她才知道这件事。"
      },
      {
        id: '1-2-2',
        english: "It was then disclosed in the following manner. Observing his second daughter employed in trimming a hat, he suddenly addressed her with:",
        chinese: "事情是这样披露的。他看见他的第二个女儿在修饰一顶帽子，便突然对她说："
      },
      {
        id: '1-2-3',
        english: "\"I hope Mr. Bingley will like it, Lizzy.\"",
        chinese: "\"我希望彬格莱先生会喜欢它，丽萃。\""
      },
      {
        id: '1-2-4',
        english: "\"We are not in a way to know what Mr. Bingley likes,\" said her mother resentfully, \"since we are not to visit.\"",
        chinese: "\"我们没有办法知道彬格莱先生喜欢什么,\"她的母亲怨恨地说,\"因为我们不能去拜访。\""
      }
    ]
  },
  {
    id: '2-1',
    bookId: '2',
    chapterNumber: 1,
    title: 'Madame Bovary - Chapter 1',
    content: processJsonData()
  }
]; 