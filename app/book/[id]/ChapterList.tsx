'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Chapter } from '../../types';

// Client component to handle chapter loading
export default function ChapterList({ bookId, initialChapters }: { bookId: string, initialChapters: Chapter[] }) {
  const [chapters, setChapters] = useState<Chapter[]>(initialChapters);
  const [loading, setLoading] = useState(initialChapters.length === 0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If we already have chapters from SSR, don't fetch again
    if (initialChapters.length > 0) {
      return;
    }

    const fetchChapters = async () => {
      try {
        setLoading(true);
        // Fetch only chapter metadata from API (no content needed for chapter list)
        const response = await fetch(`/api/chapters?bookId=${bookId}&includeContent=false`);
        if (!response.ok) {
          throw new Error('Failed to fetch chapters');
        }
        const data = await response.json();
        setChapters(data);
      } catch (err) {
        console.error('Error fetching chapters:', err);
        setError('加载章节失败，请刷新页面重试');
      } finally {
        setLoading(false);
      }
    };

    fetchChapters();
  }, [bookId, initialChapters]);

  if (loading) {
    return (
      <div className="px-6 py-8 text-center">
        <p className="text-lg text-secondary-500 dark:text-secondary-400">
          正在加载章节列表，请稍候...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-6 py-8 text-center">
        <p className="text-lg text-secondary-500 dark:text-secondary-400">
          {error}
        </p>
      </div>
    );
  }

  if (chapters.length === 0) {
    return (
      <div className="px-6 py-8 text-center">
        <p className="text-lg text-secondary-500 dark:text-secondary-400">
          未找到章节
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-secondary-200 dark:divide-secondary-800">
      {chapters.map((chapter) => (
        <li key={chapter.id}>
          <Link 
            href={`/read/${bookId}/${chapter.chapterNumber}`}
            className="block hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-colors duration-150"
          >
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <p className="text-lg font-medium text-secondary-900 dark:text-secondary-100">
                  {bookId === '7' ? (
                    chapter.title
                  ) : (
                    `第 ${chapter.chapterNumber} 章: ${chapter.title}`
                  )}
                </p>
                <svg className="h-5 w-5 text-secondary-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
} 