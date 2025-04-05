import Link from 'next/link';
import { books } from '../../data/books';
import { getChapterMetadata } from '../../data/chapters';
import { Metadata } from 'next';
import BookDetailClient from './BookDetailClient';
import { Chapter } from '../../types';

// Keep generateMetadata in the server component
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params;
  const book = books.find((b) => b.id === id);
  
  if (!book) {
    return {
      title: '未找到书籍 | 阅词名著',
    };
  }
  
  return {
    title: `${book.title} | 阅词名著`,
    description: book.description.substring(0, 160),
  };
}

// Server component that renders the client component
export default async function BookDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const book = books.find((b) => b.id === id);
  
  // Only fetch chapter metadata for the book list page
  let bookChapters: Chapter[] = [];
  try {
    // getChapterMetadata only fetches basic chapter info without content
    bookChapters = await getChapterMetadata(id);
  } catch (error) {
    console.error('Error fetching chapter metadata:', error);
  }
  
  if (!book) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-secondary-900 dark:text-secondary-100">未找到书籍</h1>
          <p className="mt-4 text-xl text-secondary-500 dark:text-secondary-400">
            抱歉，我们找不到您请求的书籍。
          </p>
          <div className="mt-6">
            <Link
              href="/library"
              className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm dark:bg-secondary-800 text-secondary-700 bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600"
            >
              返回书库
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Pass the book and chapters to the client component
  return <BookDetailClient book={book} bookChapters={bookChapters} />;
} 