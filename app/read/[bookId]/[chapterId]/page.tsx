'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { books } from '../../../data/books';
import { getChapters } from '../../../data/chapters';
import { Book, Chapter } from '../../../types';
import BilingualReader from '../../../components/BilingualReader';
import LoadingSpinner from '../../../components/LoadingSpinner';

export default function ReadPage({ params }: { params: Promise<{ bookId: string; chapterId: string }> }) {
  const [book, setBook] = useState<Book | null>(null);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [prevChapter, setPrevChapter] = useState<string | null>(null);
  const [nextChapter, setNextChapter] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    // Reset state when params change
    setIsLoading(true);
    setNotFound(false);
    
    // Handle Promise-based params
    const loadData = async () => {
      try {
        const paramsData = await params;
        const { bookId, chapterId } = paramsData;
        
        // Find the book by ID
        const foundBook = books.find((b) => b.id === bookId);
        if (foundBook) {
          setBook(foundBook);
          
          // Get chapters and find the current chapter
          const allChapters = await getChapters();
          
          // Find the chapter by number
          const chapterNumber = parseInt(chapterId, 10);
          const foundChapter = allChapters.find(
            (c) => c.bookId === bookId && c.chapterNumber === chapterNumber
          );
        
          if (foundChapter) {
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
          } else {
            setNotFound(true);
          }
        } else {
          setNotFound(true);
        }
      } catch (error) {
        console.error('Error loading params:', error);
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Simulate loading data with a slight delay
    const timer = setTimeout(() => {
      loadData();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [params]); // Only depend on the params Promise itself
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  if (notFound || !book || !chapter) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-secondary-900 dark:text-secondary-100">未找到内容</h1>
          <p className="mt-4 text-xl text-secondary-500 dark:text-secondary-400">
            抱歉，我们找不到您请求的章节内容。
          </p>
          <div className="mt-6">
            <Link
              href="/library"
              className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm dark:bg-secondary-800 text-secondary-700  bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600"
            >
              返回书库
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-card-light dark:bg-card-dark min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4">
              <li>
                <div>
                  <Link href="/" className="text-secondary-500 dark:text-secondary-400 hover:text-secondary-700 dark:hover:text-secondary-300">
                    首页
                  </Link>
                </div>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="flex-shrink-0 h-5 w-5 text-secondary-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <Link href="/library" className="ml-4 text-secondary-500 dark:text-secondary-400 hover:text-secondary-700 dark:hover:text-secondary-300">
                    书库
                  </Link>
                </div>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="flex-shrink-0 h-5 w-5 text-secondary-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <Link href={`/book/${book.id}`} className="ml-4 text-secondary-500 dark:text-secondary-400 hover:text-secondary-700 dark:hover:text-secondary-300">
                    {book.title}
                  </Link>
                </div>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="flex-shrink-0 h-5 w-5 text-secondary-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="ml-4 text-secondary-600 dark:text-secondary-300">
                    {book.id === '7' ? (
                      // 包法利夫人的章节显示格式
                      chapter.title
                    ) : (
                      // 其他书籍的章节显示格式
                      `第 ${chapter.chapterNumber} 章`
                    )}
                  </span>
                </div>
              </li>
            </ol>
          </nav>
        </div>
        
        <BilingualReader content={chapter.content} chapterTitle={chapter.title} bookId={book.id} />
        
        <div className="mt-8 flex justify-between">
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
          
          {nextChapter ? (
            <Link
              href={`/read/${book.id}/${nextChapter}`}
              className="px-4 py-2 bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 rounded-md hover:bg-secondary-200 dark:hover:bg-secondary-700"
            >
              下一章
            </Link>
          ) : (
            <Link
              href={`/book/${book.id}`}
              className="px-4 py-2 bg-primary-600 dark:bg-primary-500 dark:bg-secondary-800 text-secondary-700 rounded-md hover:bg-primary-700 dark:hover:bg-primary-600"
            >
              返回书籍详情
            </Link>
          )}
        </div>
      </div>
    </div>
  );
} 