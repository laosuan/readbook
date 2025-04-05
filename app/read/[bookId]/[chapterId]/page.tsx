'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { books } from '../../../data/books';
import { getChapter } from '../../../data/chapters';
import { Book, Chapter } from '../../../types';
import BilingualReader from '../../../components/BilingualReader';
import LoadingSpinner from '../../../components/LoadingSpinner';
import ErrorBoundary from '../../../components/ErrorBoundary';
import { getReadingProgress } from '../../../lib/localStorage';

export default function ReadPage({ params }: { params: Promise<{ bookId: string; chapterId: string }> }) {
  const [book, setBook] = useState<Book | null>(null);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [prevChapter, setPrevChapter] = useState<string | null>(null);
  const [nextChapter, setNextChapter] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notFound, setNotFound] = useState<boolean>(false);
  const [savedPosition, setSavedPosition] = useState<number | null>(null);
  
  // 创建一个状态保存不同章节的阅读进度信息及提示状态
  const [differentChapterProgress, setDifferentChapterProgress] = useState<{
    chapterNum: number;
    position: number;
    showPrompt: boolean;
  } | null>(null);
  
  // Get URL hash for position restoration
  useEffect(() => {
    // Check for hash in URL
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash && hash.startsWith('#position=')) {
        const position = parseInt(hash.replace('#position=', ''), 10);
        if (!isNaN(position) && position > 10) {  // 只在位置有效且大于阈值时使用
          // 减少日志输出
          // console.log(`从URL哈希获取阅读位置: ${position}px`);
          setSavedPosition(position);
          // 在获取位置后立即清除hash，避免刷新页面时再次跳转
          // 这可以防止一些边缘情况下的位置重置问题
          window.history.replaceState(
            null, 
            '', 
            window.location.pathname + window.location.search
          );
        } else {
          // console.log(`URL哈希中的位置无效或太小: ${position}px`);
        }
      } else {
        // console.log('URL中没有位置哈希参数');
      }
    }
  }, []);
  
  useEffect(() => {
    // Reset state when params change
    setBook(null);
    setChapter(null);
    setPrevChapter(null);
    setNextChapter(null);
    setIsLoading(true);
    setNotFound(false);
    setDifferentChapterProgress(null); // 重置章节进度提示信息
    
    const loadData = async () => {
      try {
        // Extract params
        const { bookId, chapterId } = await params;
        // 仅保留重要的日志
        console.log(`加载阅读页面数据 - 书籍ID: ${bookId}, 章节ID: ${chapterId}`);
        
        // Find the book by ID
        const foundBook = books.find((b) => b.id === bookId);
        if (foundBook) {
          setBook(foundBook);
          
          // Get the specific chapter directly without loading all chapters
          const chapterNumber = parseInt(chapterId, 10);
          // console.log(`正在加载章节 ${bookId}-${chapterNumber}`);
          const foundChapter = await getChapter(bookId, chapterNumber);
        
          if (foundChapter && foundChapter.content && foundChapter.content.length > 0) {
            // console.log(`成功加载章节 ${bookId}-${chapterNumber}，含 ${foundChapter.content.length} 个段落`);
            
            // Set chapter to state
            setChapter(foundChapter);
            
            // Set previous and next chapter links
            if (chapterNumber > 1) {
              setPrevChapter((chapterNumber - 1).toString());
            } else {
              setPrevChapter(null);
            }
            
            if (chapterNumber < foundBook.totalChapters) {
              setNextChapter((chapterNumber + 1).toString());
            } else {
              setNextChapter(null);
            }
            
            // If no position from hash, check from localStorage
            if (savedPosition === null || savedPosition < 10) {
              // console.log('从哈希获取的位置无效，尝试从localStorage获取阅读进度');
              const progress = getReadingProgress(bookId);
              
              // 无论章节是否匹配，只要有有效的位置，就优先使用它
              if (progress && progress.lastPosition > 10) {
                // 如果章节不匹配但存在阅读进度，使用保存的章节
                if (progress.chapterId !== foundChapter.id) {
                  console.log(`发现不同章节的阅读进度: ${progress.chapterId}，当前章节: ${foundChapter.id}`);
                  
                  // 判断是否需要跳转到保存的章节
                  // 从chapterId（形如"7-3"）中提取章节编号
                  const savedChapterMatch = progress.chapterId.match(/^(\d+)-(\d+)(?:-\d+)?(?:-\d+)?$/);
                  if (savedChapterMatch) {
                    const savedBookId = savedChapterMatch[1];
                    const savedChapterNum = parseInt(savedChapterMatch[2], 10);
                    
                    if (savedBookId === bookId && savedChapterNum !== chapterNumber) {
                      console.log(`需要跳转到保存的章节: ${savedChapterNum}，当前章节: ${chapterNumber}`);
                      
                      // 设置不同章节的阅读进度信息，用于显示提示
                      setDifferentChapterProgress({
                        chapterNum: savedChapterNum,
                        position: progress.lastPosition,
                        showPrompt: true
                      });
                    }
                  }
                } else {
                  // 章节匹配，使用保存的位置
                  // console.log(`从localStorage获取到有效的阅读位置: ${progress.lastPosition}px`);
                  setSavedPosition(progress.lastPosition);
                }
              } else {
                // console.log('localStorage中没有找到有效的阅读进度，将从头开始阅读');
              }
            } else {
              // console.log(`使用从URL哈希获取的阅读位置: ${savedPosition}px`);
            }
          } else {
            console.error(`章节 ${bookId}-${chapterNumber} 已找到但没有内容`);
            setNotFound(true);
          }
        } else {
          console.error(`未找到书籍 ${bookId}`);
          setNotFound(true);
        }
      } catch (error) {
        console.error('加载参数时出错:', error);
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [params, savedPosition]);

  // Effect to scroll to the saved position after content loads
  useEffect(() => {
    if (savedPosition !== null && !isLoading) {
      // 删除日志
      // console.log(`准备恢复滚动位置至: ${savedPosition}px`);
      // Short delay to ensure content is rendered
      const timer = setTimeout(() => {
        // console.log(`恢复滚动位置至: ${savedPosition}px`);
        window.scrollTo(0, savedPosition);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [savedPosition, isLoading]);

  // 处理跳转到之前保存的章节
  const handleJumpToSavedChapter = () => {
    if (differentChapterProgress && book) {
      console.log(`跳转到保存的章节: ${differentChapterProgress.chapterNum}`);
      window.location.href = `/read/${book.id}/${differentChapterProgress.chapterNum}`;
    }
  };

  // 处理忽略保存的章节，留在当前位置
  const handleStayOnCurrentChapter = () => {
    setDifferentChapterProgress(prev => prev ? {...prev, showPrompt: false} : null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (notFound || !book || !chapter) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-red-600 mb-4">章节未找到</h1>
        <p className="mb-4">抱歉，我们找不到您请求的章节。</p>
        <Link href="/library" className="text-blue-600 hover:underline">返回书库</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <main>
        {/* 添加阅读进度提示 */}
        {differentChapterProgress && differentChapterProgress.showPrompt && (
          <div className="bg-blue-50 dark:bg-blue-900 p-4 mb-4 rounded-md shadow-sm mx-auto max-w-4xl mt-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-blue-700 dark:text-blue-200 font-medium">
                  您之前在第 {differentChapterProgress.chapterNum} 章阅读到 {Math.round(differentChapterProgress.position)}px 处
                </p>
                <p className="text-blue-600 dark:text-blue-300 text-sm mt-1">
                  您想继续上次的阅读进度吗？
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleStayOnCurrentChapter}
                  className="px-3 py-1 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  留在当前章节
                </button>
                <button
                  onClick={handleJumpToSavedChapter}
                  className="px-3 py-1 text-sm bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600"
                >
                  跳转到上次位置
                </button>
              </div>
            </div>
          </div>
        )}

        <ErrorBoundary fallback={
          <div className="max-w-4xl mx-auto px-4 py-8 mt-4">
            <p>You can try navigating to another chapter.</p>
            <div className="mt-4">
              <Link href={`/book/${book.id}`} className="text-blue-600 hover:underline">
                View Table of Contents
              </Link>
            </div>
          </div>
        }>
          <BilingualReader 
            content={chapter.content} 
            chapterTitle={`${book.title} - ${chapter.title}`}
            bookId={book.id}
            chapterId={chapter.id}
          />
        </ErrorBoundary>
        
        {/* Chapter navigation */}
        <div className="max-w-4xl mx-auto px-4 py-8 flex justify-between">
          {prevChapter ? (
            <Link
            href={`/read/${book.id}/${prevChapter}`}
            className="px-4 py-2 bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 rounded-md hover:bg-secondary-200 dark:hover:bg-secondary-700"
          >
              上一章
            </Link>
          ) : (
            <div></div>
          )}
          
          <Link href={`/book/${book.id}`} className="px-4 py-2 bg-secondary-200 dark:bg-secondary-700 text-secondary-900 dark:text-white rounded-md hover:bg-secondary-300 dark:hover:bg-secondary-600">
            目录
          </Link>
          
          {nextChapter ? (
            <Link
            href={`/read/${book.id}/${nextChapter}`}
            className="px-4 py-2 bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 rounded-md hover:bg-secondary-200 dark:hover:bg-secondary-700"
          >
              下一章
            </Link>
          ) : (
            <div></div>
          )}
        </div>
      </main>
    </div>
  );
} 