'use client';

import { useMemo } from 'react';

interface BookCoverPlaceholderProps {
  title: string;
  author: string;
  width?: number;
  height?: number;
}

export default function BookCoverPlaceholder({ 
  title, 
  author, 
  width = 300, 
  height = 400 
}: BookCoverPlaceholderProps) {
  // Generate a consistent color based on the book title
  const backgroundColor = useMemo(() => {
    const colors = [
      'bg-primary-600 dark:bg-primary-700', 
      'bg-primary-700 dark:bg-primary-800',
      'bg-primary-800 dark:bg-primary-900',
      'bg-accent dark:bg-accent',
      'bg-success dark:bg-success',
      'bg-warning dark:bg-warning',
      'bg-error dark:bg-error',
      'bg-secondary-600 dark:bg-secondary-700',
      'bg-secondary-700 dark:bg-secondary-800',
      'bg-secondary-800 dark:bg-secondary-900',
    ];
    
    // Simple hash function to get a consistent color for the same title
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
      hash = ((hash << 5) - hash) + title.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    
    // Use the absolute value of the hash to get a positive index
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  }, [title]);

  return (
    <div 
      className={`${backgroundColor} rounded-md shadow-md flex flex-col items-center justify-center text-center p-4 overflow-hidden`}
      style={{ width, height }}
    >
      <h3 className="dark:bg-secondary-800 text-secondary-700 font-bold text-lg mb-2 line-clamp-3">{title}</h3>
      <p className="dark:bg-secondary-800 text-secondary-700 text-sm italic line-clamp-2">{author}</p>
    </div>
  );
} 