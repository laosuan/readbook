import vocabularyData from './vocabulary_data.json';
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

// Function to get vocabulary data for a specific book
export function getVocabularyData(): VocabularyData {
  return vocabularyData as VocabularyData;
}

// Function to get vocabulary for a specific paragraph by ID
export function getVocabularyForParagraph(paragraphId: string): KeyWord[] {
  try {
    // Extract the numeric ID from the paragraph ID (format: bookId-part-chapter-paragraphId)
    const idParts = paragraphId.split('-');
    const numericId = parseInt(idParts[idParts.length - 1], 10);
    
    // Find the vocabulary item with the matching ID
    const vocabItem = (vocabularyData as VocabularyData).vocabulary.find(
      item => item.id === numericId
    );
    
    return vocabItem?.key_words || [];
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

  let result = text;
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
