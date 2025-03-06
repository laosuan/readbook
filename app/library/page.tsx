'use client';

import { useState, useEffect } from 'react';
import { Book } from '../types';
import { books } from '../data/books';
import BookCard from '../components/BookCard';
import BookSearch from '../components/BookSearch';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Library() {
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      filterBooks(searchQuery, { category: selectedCategories });
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategories]);

  const filterBooks = (query: string, filters: { category: string[] }) => {
    let result = [...books];

    // Filter by search query
    if (query) {
      const lowerQuery = query.toLowerCase();
      result = result.filter(
        (book) =>
          book.title.toLowerCase().includes(lowerQuery) ||
          book.author.toLowerCase().includes(lowerQuery)
      );
    }

    // Filter by categories
    if (filters.category.length > 0) {
      result = result.filter((book) =>
        book.category.some((cat) => filters.category.includes(cat))
      );
    }

    setFilteredBooks(result);
  };

  const handleSearch = (query: string, filters: { category: string[] }) => {
    setSearchQuery(query);
    setSelectedCategories(filters.category);
  };

  return (
    <div className="bg-card-light dark:bg-card-dark py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-secondary-900 dark:text-secondary-100 sm:text-4xl">
            书库
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-secondary-500 dark:text-secondary-400">
            探索我们收录的经典英语名著，开始您的阅读之旅。
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <BookSearch onSearch={handleSearch} />
          </div>

          <div className="lg:col-span-3">
            {isLoading ? (
              <LoadingSpinner />
            ) : filteredBooks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredBooks.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            ) : (
              <div className="bg-card-light dark:bg-card-dark rounded-lg shadow-md p-8 text-center border border-secondary-100 dark:border-secondary-800">
                <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 mb-2">未找到匹配的书籍</h3>
                <p className="text-secondary-500 dark:text-secondary-400">
                  请尝试调整搜索条件或浏览其他类别。
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 