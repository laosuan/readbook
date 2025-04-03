'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { books } from '../../../data/books';
import { getChapter } from '../../../data/chapters';
import { Book, Chapter } from '../../../types';
import BilingualReader from '../../../components/BilingualReader';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { adaptBilingualData } from '../../../data/adapter';
import ErrorBoundary from '../../../components/ErrorBoundary';

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
          
          // Get the specific chapter directly without loading all chapters
          const chapterNumber = parseInt(chapterId, 10);
          console.log(`ReadPage: Loading chapter ${bookId}-${chapterNumber}`);
          const foundChapter = await getChapter(bookId, chapterNumber);
        
          if (foundChapter && foundChapter.content && foundChapter.content.length > 0) {
            console.log(`ReadPage: Successfully loaded chapter ${bookId}-${chapterNumber} with ${foundChapter.content.length} paragraphs`);
            
            // Use adapter to fix field names if necessary
            if (bookId === '9') {
              // Direct fetch for all Little Prince chapters 
              try {
                const response = await fetch(`https://cdn.readwordly.com/TheLittlePrince/20250403/bilingual_${chapterNumber}.json`);
                if (response.ok) {
                  const rawData = await response.json();
                  // Adapt data from source/translation format to english/chinese format
                  const adaptedContent = adaptBilingualData(rawData);
                  
                  // Create a new chapter object with the adapted content
                  const adaptedChapter = {
                    ...foundChapter,
                    content: adaptedContent
                  };
                  
                  setChapter(adaptedChapter);
                } else {
                  console.error(`Failed to fetch bilingual_${chapterNumber}.json: ${response.status}`);
                  setChapter(foundChapter); // Fallback to original content
                }
              } catch (error) {
                console.error(`Error fetching bilingual_${chapterNumber}.json:`, error);
                setChapter(foundChapter); // Fallback to original content
              }
            } else {
              setChapter(foundChapter);
            }
            
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
            console.error(`ReadPage: Chapter ${bookId}-${chapterNumber} was found but has no content`);
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
    
    loadData();
  }, [params]);

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