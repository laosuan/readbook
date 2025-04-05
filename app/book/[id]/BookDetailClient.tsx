'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import BookCoverPlaceholder from '../../components/BookCoverPlaceholder';
import { Chapter, Book } from '../../types';
import ChapterList from './ChapterList';
import { getReadingProgress, ReadingProgress } from '../../lib/localStorage';

interface BookDetailClientProps {
  book: Book;
  bookChapters: Chapter[];
}

export default function BookDetailClient({ book, bookChapters }: BookDetailClientProps) {
  const [readingProgress, setReadingProgress] = useState<ReadingProgress | null>(null);

  useEffect(() => {
    // Get reading progress
    const progress = getReadingProgress(book.id);
    setReadingProgress(progress);
  }, [book.id]);

  const hasValidCover = book.coverImage && (
    book.coverImage.startsWith('http') || 
    book.coverImage.startsWith('/images/')
  );

  // Determine the reading link
  const getReadingLink = () => {
    // Default to first chapter
    let readingLink = `/read/${book.id}/1`;
    
    if (readingProgress) {
      // Extract chapter information from the saved progress
      const chapterParts = readingProgress.chapterId.split('-');
      if (chapterParts.length >= 4) {
        // Format is bookId-part-chapter-paragraph, we need the second and third parts
        const part = chapterParts[1];
        const chapter = chapterParts[2];
        
        // Find the corresponding chapter number in the chapters list
        const matchingChapter = bookChapters.find(ch => ch.id === readingProgress.chapterId);
        
        if (matchingChapter) {
          // If we found the exact chapter, use its chapter number
          readingLink = `/read/${book.id}/${matchingChapter.chapterNumber}`;
        } else if (parseInt(part) && parseInt(chapter)) {
          // If we didn't find the exact chapter but have part and chapter numbers
          // Find a chapter with matching part and chapter
          const chapterWithPartAndNumber = bookChapters.find(ch => 
            ch.id.includes(`${book.id}-${part}-${chapter}`)
          );
          
          if (chapterWithPartAndNumber) {
            readingLink = `/read/${book.id}/${chapterWithPartAndNumber.chapterNumber}`;
          }
        }
        
        // Add position hash if available and meaningful (>10px)
        if (readingProgress.lastPosition && readingProgress.lastPosition > 10) {
          readingLink += `#position=${readingProgress.lastPosition}`;
        }
      }
    }
    
    return readingLink;
  };

  return (
    <div className="bg-card-light dark:bg-card-dark py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          <div className="flex justify-center lg:justify-end lg:col-span-1">
            <div className="w-64 h-96 overflow-hidden rounded-lg shadow-lg">
              {hasValidCover ? (
                <Image
                  src={book.coverImage}
                  alt={book.title}
                  className="w-full h-full object-cover"
                  width={256}
                  height={384}
                />
              ) : (
                <BookCoverPlaceholder 
                  title={book.title} 
                  author={book.author} 
                  width={256} 
                  height={384} 
                />
              )}
            </div>
          </div>

          <div className="mt-8 lg:mt-0 lg:col-span-2">
            <div className="bg-card-light dark:bg-card-dark rounded-lg shadow-md overflow-hidden border border-secondary-100 dark:border-secondary-800">
              <div className="px-6 py-5">
                <h1 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100">{book.title}</h1>
                <p className="mt-1 text-xl text-secondary-500 dark:text-secondary-400">{book.author}</p>
                
                <div className="mt-4 flex flex-wrap gap-2">
                  {book.category.map((cat) => (
                    <span 
                      key={cat} 
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-300"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
                
                <div className="mt-6">
                  <h2 className="text-lg font-medium text-secondary-900 dark:text-secondary-100">简介</h2>
                  <p className="mt-2 text-secondary-600 dark:text-secondary-400 whitespace-pre-line">
                    {book.description}
                  </p>
                </div>
                
                <div className="mt-6">
                  <h2 className="text-lg font-medium text-secondary-900 dark:text-secondary-100">出版信息</h2>
                  <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-secondary-500 dark:text-secondary-400">出版年份</dt>
                      <dd className="mt-1 text-sm text-secondary-900 dark:text-secondary-100">{book.publishYear}</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-secondary-500 dark:text-secondary-400">语言</dt>
                      <dd className="mt-1 text-sm text-secondary-900 dark:text-secondary-100">
                        {book.language === 'en' ? '英文原著' : book.language === 'zh' ? '中文译本' : '双语对照'}
                      </dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-secondary-500 dark:text-secondary-400">章节数</dt>
                      <dd className="mt-1 text-sm text-secondary-900 dark:text-secondary-100">{book.totalChapters}</dd>
                    </div>
                  </dl>
                </div>
                
                <div className="mt-6">
                  <Link
                    href={getReadingLink()}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm dark:bg-secondary-800 text-secondary-700 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600"
                  >
                    {readingProgress ? '继续阅读' : '开始阅读'}
                  </Link>
                  {readingProgress && (
                    <p className="mt-2 text-sm text-secondary-500 dark:text-secondary-400">
                      上次阅读时间: {new Date(readingProgress.lastRead).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <h2 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100 mb-6">章节列表</h2>
          <div className="bg-card-light dark:bg-card-dark rounded-lg shadow-md overflow-hidden border border-secondary-100 dark:border-secondary-800">
            <ChapterList bookId={book.id} initialChapters={bookChapters} />
          </div>
        </div>
      </div>
    </div>
  );
} 