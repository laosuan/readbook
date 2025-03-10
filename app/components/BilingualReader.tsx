'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { BilingualContent } from '../types';
import { KeyWord, getVocabularyForParagraph, highlightText } from '../data/vocabulary';

interface BilingualReaderProps {
  content: BilingualContent[];
  chapterTitle: string;
  bookId: string;
}

export default function BilingualReader({ content, chapterTitle, bookId }: BilingualReaderProps) {
  const [fontSize, setFontSize] = useState<number>(16);
  const [showBoth, setShowBoth] = useState<boolean>(true);
  const [showEnglish, setShowEnglish] = useState<boolean>(true);
  const [showVocabulary, setShowVocabulary] = useState<boolean>(true);
  const [visibleParagraphs, setVisibleParagraphs] = useState<Set<string>>(new Set());
  const paragraphRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [vocabularyItems, setVocabularyItems] = useState<{[key: string]: KeyWord[]}>({});

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

  const toggleVocabulary = () => {
    setShowVocabulary(!showVocabulary);
  };

  // Set up intersection observer to track visible paragraphs
  useEffect(() => {
    if (typeof window === 'undefined' || !showVocabulary || !(bookId === '8')) return;
    
    const observerOptions = {
      root: null, // viewport
      rootMargin: '0px',
      threshold: 0.3, // at least 30% of the paragraph must be visible
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const paragraphId = entry.target.getAttribute('data-paragraph-id');
        if (!paragraphId) return;
        
        setVisibleParagraphs(prev => {
          const newSet = new Set(prev);
          if (entry.isIntersecting) {
            newSet.add(paragraphId);
          } else {
            newSet.delete(paragraphId);
          }
          return newSet;
        });
      });
    }, observerOptions);

    // Observe all paragraph elements
    paragraphRefs.current.forEach((element) => {
      if (element) observer.observe(element);
    });

    return () => {
      observer.disconnect();
    };
  }, [showVocabulary, bookId]);

  // Extract chapter information from content to limit vocabulary requests to current chapter only
  const currentChapterInfo = useMemo(() => {
    if (!content || content.length === 0 || !(bookId === '8')) return null;
    
    // Get the first paragraph ID to extract part and chapter
    const firstParagraphId = content[0]?.id;
    if (!firstParagraphId) return null;
    
    const idParts = firstParagraphId.split('-');
    if (idParts.length < 4) return null;
    
    return {
      part: idParts[1],
      chapter: idParts[2]
    };
  }, [content, bookId]);

  // Update vocabulary items when visible paragraphs change
  useEffect(() => {
    if (!showVocabulary || !(bookId === '8') || !currentChapterInfo) {
      return;
    }
    
    // Use a debounce timer to avoid excessive API calls
    let debounceTimer: NodeJS.Timeout | null = null;
    
    const fetchVocabulary = async () => {
      // Keep existing vocabulary items
      const newVocabularyItems = {...vocabularyItems};
      
      // Get only paragraphs that aren't already loaded and belong to the current chapter
      const paragraphsToFetch = Array.from(visibleParagraphs).filter(paragraphId => {
        // Skip if already loaded
        if (newVocabularyItems[paragraphId]) return false;
        
        // Verify paragraph belongs to current chapter
        const idParts = paragraphId.split('-');
        if (idParts.length < 4) return false;
        
        const paragraphPart = idParts[1];
        const paragraphChapter = idParts[2];
        
        return paragraphPart === currentChapterInfo.part && 
               paragraphChapter === currentChapterInfo.chapter;
      });
      
      // If no new paragraphs to fetch, exit early
      if (paragraphsToFetch.length === 0) return;
      
      console.log(`Fetching vocabulary for ${paragraphsToFetch.length} new paragraphs in chapter ${currentChapterInfo.part}-${currentChapterInfo.chapter}`);
      
      // Process each new visible paragraph
      for (const paragraphId of paragraphsToFetch) {
        try {
          const vocab = await getVocabularyForParagraph(paragraphId);
          if (vocab.length > 0) {
            newVocabularyItems[paragraphId] = vocab;
          }
        } catch (error) {
          console.error(`Error fetching vocabulary for ${paragraphId}:`, error);
        }
      }
      
      setVocabularyItems(newVocabularyItems);
    };
    
    // Clear any existing timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    // Set a new timer to delay the fetch
    debounceTimer = setTimeout(fetchVocabulary, 500);
    
    // Cleanup the timer on unmount
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [visibleParagraphs, showVocabulary, bookId, vocabularyItems, currentChapterInfo]);

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
            className="px-3 py-1 rounded-md bg-primary-600 dark:bg-primary-500 dark:bg-secondary-800 text-secondary-700 text-sm hover:bg-primary-700 dark:hover:bg-primary-600 mr-2"
          >
            {showBoth ? '仅显示英文' : showEnglish ? '仅显示中文' : '双语对照'}
          </button>
          {(bookId === '8') && (
            <button
              onClick={toggleVocabulary}
              className={`px-3 py-1 rounded-md text-secondary-700 text-sm ${showVocabulary ? 'bg-yellow-200 hover:bg-yellow-300 dark:bg-yellow-700 dark:hover:bg-yellow-600' : 'bg-secondary-200 hover:bg-secondary-300 dark:bg-secondary-700 dark:hover:bg-secondary-600'}`}
            >
              {showVocabulary ? '隐藏词汇' : '显示词汇'}
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-10">  
        <div className="prose prose-lg flex-grow" style={{ fontSize: `${fontSize}px` }}>
          {content.map((item) => {
            // Only load vocabulary for bookId 8
            const isVocabBook = bookId === '8';
            // Use vocabulary from state instead of fetching it directly
            const vocabulary = isVocabBook && showVocabulary ? vocabularyItems[item.id] || [] : [];
            const hasVocabulary = vocabulary.length > 0;
            // const isVisible = visibleParagraphs.has(item.id); // Removed unused variable
            
            return (
              <div 
                key={item.id} 
                ref={(el: HTMLDivElement | null) => { if (el) paragraphRefs.current.set(item.id, el); }}
                data-paragraph-id={item.id}
                className={`mb-6 pb-6 border-b border-secondary-200 dark:border-secondary-800 ${hasVocabulary ? 'relative' : ''}`}
              >
                {(showBoth || showEnglish) && (
                  <p className="mb-2 text-secondary-900 dark:text-secondary-100 leading-relaxed">
                    {isVocabBook && showVocabulary ? highlightText(item.english, vocabulary, true) : item.english}
                  </p>
                )}
                {(showBoth || !showEnglish) && (
                  <p className="text-secondary-700 dark:text-secondary-300 leading-relaxed">
                    {isVocabBook && showVocabulary ? highlightText(item.chinese, vocabulary, false) : item.chinese}
                  </p>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Fixed Vocabulary sidebar */}
        {showVocabulary && Object.keys(vocabularyItems).length > 0 && (
          <div className="w-64 shrink-0 border-l border-secondary-200 dark:border-secondary-800 pl-6 ml-2 sticky top-8 max-h-screen overflow-y-auto pb-8">
            <h3 className="text-lg font-medium mb-3 text-secondary-900 dark:text-secondary-100 sticky top-0 border-secondary-200  dark:bg-secondary-950 py-2">重点词汇</h3>
            <div className="space-y-4">
              {Object.entries(vocabularyItems).map(([paragraphId, words]) => (
                <div key={paragraphId} className="border-b border-secondary-200 dark:border-secondary-800 pb-3">
                  <ul className="space-y-2">
                    {words.map((word, index) => (
                      <li key={index} className="p-2 bg-secondary-50 dark:bg-secondary-800 rounded">
                        <div className="font-medium text-secondary-900 dark:text-secondary-100">{word.raw_en} - {word.raw_cn}</div>
                        <div className="text-sm text-secondary-600 dark:text-secondary-400">{word.en} - {word.cn}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 