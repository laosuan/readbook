import Link from 'next/link';
import Image from 'next/image';
import { Book } from '../types';
import BookCoverPlaceholder from './BookCoverPlaceholder';

interface BookCardProps {
  book: Book;
}

export default function BookCard({ book }: BookCardProps) {
  // Check if the cover image is a valid URL or path
  const hasValidCover = book.coverImage && (
    book.coverImage.startsWith('http') || 
    book.coverImage.startsWith('/images/')
  );

  return (
    <div className="group relative bg-card-light dark:bg-card-dark rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl border border-secondary-100 dark:border-secondary-800 hover:border-primary-200 dark:hover:border-primary-800 hover:-translate-y-1">
      <Link href={`/book/${book.id}`} className="block">
        <div className="relative h-64 w-full overflow-hidden">
          {hasValidCover ? (
            <Image
              src={book.coverImage}
              alt={book.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              width={300}
              height={400}
            />
          ) : (
            <div className="w-full h-full">
              <BookCoverPlaceholder 
                title={book.title} 
                author={book.author} 
                width={300} 
                height={400} 
              />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="absolute bottom-0 left-0 right-0 p-4 dark:bg-secondary-800 text-secondary-700 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/80 dark:bg-secondary-800 text-secondary-700 backdrop-blur-sm">
              {book.category[0]}
            </span>
          </div>
        </div>
        <div className="p-5">
          <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 mb-1 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-500 transition-colors duration-300">{book.title}</h3>
          <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-3 italic">{book.author}</p>
          
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary-100 dark:bg-secondary-800 text-secondary-800 dark:text-secondary-200">
              {book.language === 'en' ? '英文原著' : book.language === 'zh' ? '中文译本' : '双语对照'}
            </span>
            {book.category.length > 1 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary-100 dark:bg-secondary-800 text-secondary-800 dark:text-secondary-200">
                +{book.category.length - 1} 类别
              </span>
            )}
          </div>
          
          <div className="flex items-center justify-between text-xs text-secondary-600 dark:text-secondary-400 pt-3 border-t border-secondary-100 dark:border-secondary-800">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1 text-secondary-500">
                <path fillRule="evenodd" d="M5.75 2a.75.75 0 0 1 .75.75V4h7V2.75a.75.75 0 0 1 1.5 0V4h.25A2.75 2.75 0 0 1 18 6.75v8.5A2.75 2.75 0 0 1 15.25 18H4.75A2.75 2.75 0 0 1 2 15.25v-8.5A2.75 2.75 0 0 1 4.75 4H5V2.75A.75.75 0 0 1 5.75 2Zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75Z" clipRule="evenodd" />
              </svg>
              <span>{book.publishYear}</span>
            </div>
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1 text-secondary-500">
                <path fillRule="evenodd" d="M3.5 2A1.5 1.5 0 0 0 2 3.5V15a3 3 0 1 0 6 0V3.5A1.5 1.5 0 0 0 6.5 2h-3Zm11.753 6.99L9.5 14.743V6.257l5.753 2.733ZM17.5 8.265l-6.5-3.097V2.5a.5.5 0 0 1 .5-.5h3.5a.5.5 0 0 1 .5.5v1.5a.5.5 0 0 0 .5.5h1a.5.5 0 0 1 .5.5v3.265Z" clipRule="evenodd" />
              </svg>
              <span>{book.totalChapters} 章节</span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
} 