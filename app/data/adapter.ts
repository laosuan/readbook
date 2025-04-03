// Adapter utility to convert between data formats

import { BilingualContent } from '../types';

interface RawBilingualData {
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

/**
 * Converts data from the raw JSON format (source/translation) to the format 
 * expected by the BilingualReader component (english/chinese)
 */
export function adaptBilingualData(data: RawBilingualData): BilingualContent[] {
  if (!data || !data.paragraphs || !Array.isArray(data.paragraphs)) {
    console.error('Invalid data format provided to adapter');
    return [];
  }

  return data.paragraphs.map((paragraph) => {
    if (!paragraph) {
      console.warn('Empty paragraph found in data');
      return {
        id: Date.now().toString(), // Generate a unique ID
        english: '',
        chinese: '',
      };
    }

    // Ensure the image URL is correctly passed to the output
    const adaptedParagraph: BilingualContent = {
      id: paragraph.id?.toString() || Date.now().toString(),
      english: paragraph.source || '',
      chinese: paragraph.translation || '',
    };

    // Only add the image property if it exists
    if (paragraph.image) {
      adaptedParagraph.image = paragraph.image;
      
      // Debug log for image URLs
      console.log(`Adapting paragraph ${adaptedParagraph.id} with image: ${paragraph.image}`);
    }

    return adaptedParagraph;
  });
} 