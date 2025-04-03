#!/usr/bin/env node

/**
 * 脚本用于将上传的图片链接插入到《小王子》双语JSON文件中
 * 使用方法: node insert-images.js
 */

const fs = require('fs');
const path = require('path');

// 配置
const CHARACTERS_DIR = path.join(__dirname, '../app/data/characters');
const IMAGE_BASE_URL = 'https://cdn.readwordly.com/bookimages/TheLittlePrince/';

// 图片映射 - 根据文件内容关键词匹配图片
const imageMapping = [
  // 第一章图片
  { keywords: ['boa constrictor', '蟒蛇', 'swallowed a wild beast', '吞下了一只野兽'], image: 'Boa_fauve.png' },
  { keywords: ['my very first drawing', '第一幅画', 'hat be scary', '帽子'], image: 'Sombrero.png' },
  { keywords: ['inside of the boa constrictor', '蟒蛇肚子里面', 'second drawing', '第二幅画'], image: 'Boa.png' },
  { keywords: ['grown-ups were glad', '飞机', 'fly planes', '大人们都十分高兴'], image: 'Habille_a_l_Europeenne.jpg' },
  
  // 第二章图片
  { keywords: ['extraordinary little man', '小人儿', 'portrait', '肖像'], image: 'Petit_Prince.jpg' },
  { keywords: ['thousand miles from any inhabited', '远离人迹千里的沙漠', 'desert', '沙漠'], image: 'Desert.png' },
  { keywords: ['I drew', '我画了一只羊', 'already very ill', '病得太重'], image: 'Mouton1.jpg' },
  { keywords: ['Do another one', '再画一只', 'second sheep', '第二只羊'], image: 'Mouton2.jpg' },
  { keywords: ['it\'s a ram', '公羊', 'has horns', '犄角'], image: 'Mouton3.jpg' },
  { keywords: ['box', '箱子', 'sheep you want is in it', '羊就在里面'], image: 'Mouton4.jpg' },
  
  // 第三章图片
  { keywords: ['asteroid', '小行星', 'planet', '星球'], image: '300px-Planete_seche.jpg' },
  { keywords: ['flower', '花', 'rose', '玫瑰'], image: 'Arrivee_de_la_fleur.jpg' },
  
  // 更多章节的图片映射...
  { keywords: ['baobabs', '猴面包树'], image: 'Baobabs.jpg' },
  { keywords: ['sunset', '日落', '夕阳'], image: 'Coucher_de_soleil.jpg' },
  { keywords: ['fox', '狐狸'], image: 'Renard.jpg' },
  { keywords: ['king', '国王'], image: 'Roi.jpg' },
  { keywords: ['business', '商人'], image: 'Businessman.jpg' },
  { keywords: ['lamplighter', '点灯人'], image: '400px-Allumeur.jpg' },
  { keywords: ['stars', '星星'], image: '400px-Petit_Prince_etoile.jpg' },
  { keywords: ['snake', '蛇'], image: 'Serpentjaune.jpg' },
  { keywords: ['well', '井'], image: 'Puit.jpg' }
];

// 处理每个双语JSON文件
async function processFiles() {
  try {
    // 读取所有bilingual_*.json文件
    const files = fs.readdirSync(CHARACTERS_DIR)
      .filter(file => file.startsWith('bilingual_') && file.endsWith('.json'))
      .sort((a, b) => {
        const numA = parseInt(a.replace('bilingual_', '').replace('.json', ''), 10);
        const numB = parseInt(b.replace('bilingual_', '').replace('.json', ''), 10);
        return numA - numB;
      });
    
    console.log(`找到${files.length}个双语文件`);
    
    let totalModified = 0;
    
    // 处理每个文件
    for (const file of files) {
      const filePath = path.join(CHARACTERS_DIR, file);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      let jsonData;
      
      try {
        jsonData = JSON.parse(fileContent);
      } catch (error) {
        console.error(`解析文件${file}时出错:`, error.message);
        continue;
      }
      
      let modified = false;
      
      // 处理每个段落
      if (jsonData.paragraphs && Array.isArray(jsonData.paragraphs)) {
        for (const paragraph of jsonData.paragraphs) {
          // 如果段落已经有图片，跳过
          if (paragraph.image) continue;
          
          // 合并源文本和翻译，用于匹配关键词
          const combinedText = (paragraph.source || '') + ' ' + (paragraph.translation || '');
          
          // 尝试匹配关键词
          for (const mapping of imageMapping) {
            const matchesKeyword = mapping.keywords.some(keyword => 
              combinedText.toLowerCase().includes(keyword.toLowerCase())
            );
            
            if (matchesKeyword) {
              paragraph.image = IMAGE_BASE_URL + mapping.image;
              modified = true;
              console.log(`在文件${file}中找到匹配: ${mapping.image}`);
              break; // 找到第一个匹配就停止
            }
          }
        }
      }
      
      // 如果文件被修改，写回文件
      if (modified) {
        fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2), 'utf8');
        totalModified++;
        console.log(`更新了文件 ${file}`);
      }
    }
    
    console.log(`完成! 共修改了${totalModified}个文件`);
    
  } catch (error) {
    console.error('处理文件时发生错误:', error);
    process.exit(1);
  }
}

// 执行脚本
processFiles(); 