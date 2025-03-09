'use client';

import { useState } from 'react';
import { BilingualContent } from '../types';

interface BilingualReaderProps {
  content: BilingualContent[];
  chapterTitle: string;
}

export default function BilingualReader({ content, chapterTitle }: BilingualReaderProps) {
  const [fontSize, setFontSize] = useState<number>(16);
  const [showBoth, setShowBoth] = useState<boolean>(true);
  const [showEnglish, setShowEnglish] = useState<boolean>(true);

  const increaseFontSize = () => {
    if (fontSize < 24) {
      setFontSize(fontSize + 2);
    }
  };

  const decreaseFontSize = () => {
    if (fontSize > 12) {
      setFontSize(fontSize - 2);
    }
  };

  const toggleLanguage = () => {
    if (showBoth) {
      setShowBoth(false);
      setShowEnglish(true);
    } else if (showEnglish) {
      setShowEnglish(false);
    } else {
      setShowBoth(true);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-serif font-bold text-secondary-900 dark:text-secondary-100">{chapterTitle}</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={decreaseFontSize}
              className="p-2 rounded-md text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-800"
              aria-label="Decrease font size"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </button>
            <span className="text-sm text-secondary-600 dark:text-secondary-400">{fontSize}px</span>
            <button
              onClick={increaseFontSize}
              className="p-2 rounded-md text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-800"
              aria-label="Increase font size"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <button
            onClick={toggleLanguage}
            className="px-3 py-1 rounded-md bg-primary-600 dark:bg-primary-500 dark:bg-secondary-800 text-secondary-700 text-sm hover:bg-primary-700 dark:hover:bg-primary-600"
          >
            {showBoth ? '仅显示英文' : showEnglish ? '仅显示中文' : '双语对照'}
          </button>
        </div>
      </div>

      <div className="prose prose-lg max-w-none" style={{ fontSize: `${fontSize}px` }}>
        {content.map((item) => (
          <div key={item.id} className="mb-6 pb-6 border-b border-secondary-200 dark:border-secondary-800">
            {(showBoth || showEnglish) && (
              <p className="mb-2 text-secondary-900 dark:text-secondary-100 leading-relaxed">
                {item.english}
              </p>
            )}
            {(showBoth || !showEnglish) && (
              <p className="text-secondary-700 dark:text-secondary-300 leading-relaxed">
                {item.chinese}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 