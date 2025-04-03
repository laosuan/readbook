export interface Book {
  id: string;
  title: string;
  author: string;
  coverImage: string;
  description: string;
  publishYear: number;
  language: string;
  totalChapters: number;
  category: string[];
}

export interface Chapter {
  id: string;
  bookId: string;
  chapterNumber: number;
  title: string;
  content: BilingualContent[];
}

export interface BilingualContent {
  id: string;
  english: string;
  chinese: string;
  image?: string;
}

export interface VocabularyItem {
  id: string;
  paragraphId: string;
  english: string;
  chinese: string;
  raw_english: string;
  raw_chinese: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  readingProgress: ReadingProgress[];
}

export interface ReadingProgress {
  bookId: string;
  chapterId: string;
  lastPosition: number;
  lastRead: Date;
} 