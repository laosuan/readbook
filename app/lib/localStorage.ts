// localStorage.ts
// Utility functions for browser localStorage operations

const STORAGE_KEY = 'readbook_reading_progress';

// Define the reading progress type
export interface ReadingProgress {
  bookId: string;
  chapterId: string;
  lastPosition: number; // Scroll position
  lastRead: string; // ISO date string
}

// Initialize storage
const initStorage = (): ReadingProgress[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error initializing local storage:', error);
  }
  
  return [];
};

// Save reading progress
export const saveReadingProgress = (progress: ReadingProgress): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const allProgress = initStorage();
    
    // Find and update existing entry or add new one
    const existingIndex = allProgress.findIndex(p => p.bookId === progress.bookId);
    
    const isUpdate = existingIndex !== -1;
    const oldProgress = isUpdate ? allProgress[existingIndex] : null;
    
    // 防止无效位置覆盖 - 重要改进
    // 如果新位置无效(接近0)，而之前已有有效的位置记录，则不更新
    if (isUpdate && oldProgress && progress.lastPosition < 10) {
      console.log(`阻止无效位置覆盖 - 书籍ID: ${progress.bookId}`, {
        原位置: oldProgress.lastPosition,
        新位置: progress.lastPosition,
        原章节: oldProgress.chapterId,
        新章节: progress.chapterId
      });
      
      // 无论章节是否相同，只要新位置无效且旧位置有效，都不更新
      if (oldProgress.lastPosition > 10) {
        return; // 不更新，直接返回
      }
    }
    
    if (isUpdate) {
      allProgress[existingIndex] = progress;
      console.log(`更新阅读进度 - 书籍ID: ${progress.bookId}`, {
        章节: progress.chapterId,
        位置: progress.lastPosition,
        时间: new Date(progress.lastRead).toLocaleString(),
        旧位置: oldProgress ? oldProgress.lastPosition : '无'
      });
    } else {
      allProgress.push(progress);
      console.log(`新增阅读进度 - 书籍ID: ${progress.bookId}`, {
        章节: progress.chapterId,
        位置: progress.lastPosition,
        时间: new Date(progress.lastRead).toLocaleString()
      });
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allProgress));
  } catch (error) {
    console.error('Error saving reading progress:', error);
  }
};

// Get reading progress for a specific book
export const getReadingProgress = (bookId: string): ReadingProgress | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const allProgress = initStorage();
    const bookProgress = allProgress.find(p => p.bookId === bookId);
    
    // 添加日志，显示获取到的阅读进度信息
    console.log(`获取阅读进度 - 书籍ID: ${bookId}`, bookProgress ? {
      章节: bookProgress.chapterId,
      位置: bookProgress.lastPosition,
      时间: new Date(bookProgress.lastRead).toLocaleString()
    } : '无保存的阅读进度');
    
    return bookProgress || null;
  } catch (error) {
    console.error('Error getting reading progress:', error);
    return null;
  }
};

// Get all reading progress entries
export const getAllReadingProgress = (): ReadingProgress[] => {
  return initStorage();
};

// Clear all reading progress
export const clearAllReadingProgress = (): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing reading progress:', error);
  }
};

// Clear reading progress for a specific book
export const clearBookReadingProgress = (bookId: string): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const allProgress = initStorage();
    const filteredProgress = allProgress.filter(p => p.bookId !== bookId);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredProgress));
  } catch (error) {
    console.error('Error clearing book reading progress:', error);
  }
}; 