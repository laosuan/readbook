'use client';

import { useState } from 'react';

interface BookSearchProps {
  onSearch: (query: string, filters: { category: string[] }) => void;
}

export default function BookSearch({ onSearch }: BookSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  const categories = [
    'Classic', 'Fiction', 'Romance', 'Coming-of-age', 'Dystopian', 'Science Fiction', 'Fantasy', 'Adventure'
  ];

  const handleCategoryToggle = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const handleSearch = () => {
    onSearch(searchQuery, { category: selectedCategories });
  };

  const handleClear = () => {
    setSearchQuery('');
    setSelectedCategories([]);
    onSearch('', { category: [] });
  };

  return (
    <div className="bg-card-light dark:bg-card-dark rounded-lg shadow-md p-6 mb-8 border border-secondary-100 dark:border-secondary-800">
      <div className="mb-4">
        <label htmlFor="search" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
          搜索书籍
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <input
            type="text"
            name="search"
            id="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-3 pr-10 py-2 sm:text-sm border-secondary-300 dark:border-secondary-700 rounded-md bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100"
            placeholder="输入书名或作者"
          />
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">类别</h3>
        <div className="space-y-2">
          {categories.map((category) => (
            <div key={category} className="flex items-center">
              <input
                id={`category-${category}`}
                name={`category-${category}`}
                type="checkbox"
                checked={selectedCategories.includes(category)}
                onChange={() => handleCategoryToggle(category)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 dark:border-secondary-700 rounded"
              />
              <label htmlFor={`category-${category}`} className="ml-2 block text-sm text-secondary-700 dark:text-secondary-300">
                {category}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex space-x-2">
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-primary-600 dark:bg-primary-500 dark:bg-secondary-800 text-secondary-700  rounded-md hover:bg-primary-700 dark:hover:bg-primary-600 flex-1"
        >
          搜索
        </button>
        <button
          onClick={handleClear}
          className="px-4 py-2 border border-secondary-300 dark:border-secondary-700 text-secondary-700 dark:text-secondary-300 rounded-md hover:bg-secondary-50 dark:hover:bg-secondary-800"
        >
          清除
        </button>
      </div>
    </div>
  );
} 