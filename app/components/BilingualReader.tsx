'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  
  // TTS state variables
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentParagraphId, setCurrentParagraphId] = useState<string | null>(null);
  const [currentParagraphIndex, setCurrentParagraphIndex] = useState<number | null>(null);
  const [hoverParagraphId, setHoverParagraphId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

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

  // Initialize Audio Context
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Create audio element for playback
      if (!audioRef.current) {
        audioRef.current = new Audio();
        
        // Set up event listeners for the audio element
        audioRef.current.onended = () => {
          // When current audio ends, move to next paragraph if playing
          if (isPlaying && currentParagraphIndex !== null) {
            const nextIndex = currentParagraphIndex + 1;
            if (nextIndex < content.length) {
              const nextParagraph = content[nextIndex];
              playTTS(nextParagraph.id);
            } else {
              // End of content
              stopTTS();
            }
          }
        };
      }
      
      // Initialize audio context for potential audio processing
      if (!audioContextRef.current) {
        try {
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          audioContextRef.current = new AudioContext();
        } catch (error) {
          console.error('Could not create AudioContext:', error);
        }
      }
    }
    
    return () => {
      stopTTS();
      // Clean up audio resources
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, [content.length, currentParagraphIndex, isPlaying]);
  
  // Function to get all paragraph text content
  const getAllParagraphsEnglishContent = useCallback(() => {
    const allContent: { id: string; text: string }[] = [];
    content.forEach((item, index) => {
      allContent.push({ id: item.id, text: item.english });
    });
    return allContent;
  }, [content]);
  
  // Play TTS for a specific paragraph
  const playTTS = useCallback(async (paragraphId: string) => {
    if (!audioRef.current) return;
    
    // Stop any current playback
    stopTTS();
    
    // Find the index of the paragraph to start from
    const paragraphIndex = content.findIndex(item => item.id === paragraphId);
    if (paragraphIndex === -1) return;
    
    const paragraphText = content[paragraphIndex].english;
    if (!paragraphText) return;
    
    setCurrentParagraphId(paragraphId);
    setCurrentParagraphIndex(paragraphIndex);
    setIsPlaying(true);
    setIsLoading(true);
    
    try {
      // Scroll to the paragraph being read
      const paragraphElement = paragraphRefs.current.get(paragraphId);
      if (paragraphElement) {
        paragraphElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      
      // Get audio from server-side TTS API
      console.log('Requesting TTS for text:', paragraphText.substring(0, 50) + (paragraphText.length > 50 ? '...' : ''));
      
      try {
        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: paragraphText,
            voice: 'en-US-AriaNeural' // Default voice
          }),
        });
        
        // Check for HTTP errors
        if (!response.ok) {
          const errorText = await response.text();
          console.error('TTS API HTTP error:', response.status, errorText);
          throw new Error(`TTS API error (${response.status}): ${errorText || 'No error details available'}`);
        }
        
        // Parse response data
        const data = await response.json();
        console.log('TTS API response received', data ? 'with data' : 'with empty data');
        
        // Validate audio data exists
        if (!data || !data.audio) {
          console.error('TTS API response missing audio data:', data);
          throw new Error('No audio data received from TTS API');
        }
        
        // Create audio source from base64 data
        const audioSrc = `data:audio/mp3;base64,${data.audio}`;
        console.log('Audio source created, length:', data.audio.length);
        
        // Set up audio playback
        if (audioRef.current) {
          audioRef.current.src = audioSrc;
          console.log('Starting audio playback');
          
          await audioRef.current.play()
            .catch(error => {
              console.error('Audio playback error:', error);
              throw new Error(`Audio playback failed: ${error.message}`);
            });
            
          console.log('Audio playback started successfully');
        } else {
          console.error('Audio element reference is not available');
          throw new Error('Audio player not available');
        }
      } catch (error) {
        console.error('TTS request or playback error:', error);
        // Re-throw the error to be caught by the outer catch block
        throw error;
      } finally {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('TTS error:', error);
      setIsLoading(false);
      stopTTS();
      
      // Show error message to the user
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Speech synthesis failed: ${errorMessage}. Please try again later.`);
    }
  }, [content]);
  
  // These functions are no longer needed with the server-side approach
  // The audio element's 'onended' event handles moving to the next paragraph
  
  // Pause TTS
  const pauseTTS = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);
  
  // Resume TTS
  const resumeTTS = useCallback(() => {
    if (audioRef.current && audioRef.current.src) {
      audioRef.current.play().catch(error => {
        console.error('Error resuming audio:', error);
      });
      setIsPlaying(true);
    } else if (currentParagraphId) {
      // If we can't resume, restart from current paragraph
      playTTS(currentParagraphId);
    }
  }, [currentParagraphId, playTTS]);
  
  // Stop TTS completely
  const stopTTS = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    setIsPlaying(false);
    setCurrentParagraphId(null);
    setCurrentParagraphIndex(null);
    setIsLoading(false);
  }, []);

  // Set up intersection observer to track visible paragraphs
  useEffect(() => {
    if (typeof window === 'undefined' || !showVocabulary || !(bookId === '8')) return;
    
    const observerOptions = {
      root: null, // viewport
      rootMargin: '0px', // 使用0px确保只有在视口中的段落才被标记为可见
      threshold: 0.1, // 降低阈值，只需10%可见就触发
    };

    const observer = new IntersectionObserver((entries) => {
      let visibilityChanged = false;
      const updatedVisibleParagraphs = new Set(visibleParagraphs);
      
      entries.forEach(entry => {
        const paragraphId = entry.target.getAttribute('data-paragraph-id');
        if (!paragraphId) return;
        
        if (entry.isIntersecting && !updatedVisibleParagraphs.has(paragraphId)) {
          updatedVisibleParagraphs.add(paragraphId);
          visibilityChanged = true;
        } else if (!entry.isIntersecting && updatedVisibleParagraphs.has(paragraphId)) {
          updatedVisibleParagraphs.delete(paragraphId);
          visibilityChanged = true;
        }
      });
      
      if (visibilityChanged) {
        setVisibleParagraphs(updatedVisibleParagraphs);
      }
    }, observerOptions);

    // Observe all paragraph elements
    paragraphRefs.current.forEach((element) => {
      if (element) observer.observe(element);
    });

    return () => {
      observer.disconnect();
    };
  }, [showVocabulary, bookId, visibleParagraphs]);

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
      console.log('Skipping vocabulary fetch - conditions not met:', { showVocabulary, bookId, currentChapterInfo });
      return;
    }
    
    console.log('Current visible paragraphs:', Array.from(visibleParagraphs));
    
    // Use a debounce timer to avoid excessive API calls
    let debounceTimer: NodeJS.Timeout | null = null;
    
    const fetchVocabulary = async () => {
      // Keep existing vocabulary items
      const newVocabularyItems = {...vocabularyItems};
      
      // Get visible paragraphs and add adjacent paragraphs for preloading
      const visibleParagraphIds = Array.from(visibleParagraphs);
      const paragraphIdsToCheck = new Set(visibleParagraphIds);
      
      // Add a few paragraphs ahead for preloading
      visibleParagraphIds.forEach(paragraphId => {
        const [bookId, part, chapter, numStr] = paragraphId.split('-');
        const paragraphNum = parseInt(numStr, 10);
        
        // Add 5 paragraphs ahead for preloading
        for (let i = 1; i <= 5; i++) {
          const adjacentNum = paragraphNum + i;
          if (adjacentNum > 0) {
            const adjacentId = `${bookId}-${part}-${chapter}-${adjacentNum}`;
            paragraphIdsToCheck.add(adjacentId);
          }
        }
      });
      
      console.log('Checking paragraphs (including adjacent):', Array.from(paragraphIdsToCheck));
      
      // Get only paragraphs that aren't already loaded and belong to the current chapter
      const paragraphsToFetch = Array.from(paragraphIdsToCheck).filter(paragraphId => {
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
      // Use Promise.all to fetch vocabulary for all paragraphs in parallel
      const fetchPromises = paragraphsToFetch.map(async (paragraphId) => {
        try {
          const vocab = await getVocabularyForParagraph(paragraphId);
          console.log(`Retrieved ${vocab.length} vocabulary items for paragraph ${paragraphId}`);
          
          if (vocab.length > 0) {
            newVocabularyItems[paragraphId] = vocab;
            console.log(`Added vocabulary for paragraph ${paragraphId}:`, vocab);
          } else {
            console.log(`No vocabulary found for paragraph ${paragraphId}`);
          }
          return { success: true, paragraphId };
        } catch (error) {
          console.error(`Error fetching vocabulary for ${paragraphId}:`, error);
          return { success: false, paragraphId, error };
        }
      });
      
      await Promise.all(fetchPromises);
      
      setVocabularyItems(newVocabularyItems);
    };
    
    // Clear any existing timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    // Set a new timer to delay the fetch
    debounceTimer = setTimeout(fetchVocabulary, 300);
    
    // Cleanup the timer on unmount
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [visibleParagraphs, showVocabulary, bookId, vocabularyItems, currentChapterInfo]);

  // Add CSS for the pulse animation
  useEffect(() => {
    // Add the CSS animation for the current paragraph indicator
    if (typeof document !== 'undefined') {
      const style = document.createElement('style');
      style.textContent = `
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
        .pulse-animation {
          animation: pulse 2s infinite ease-in-out;
        }
      `;
      document.head.appendChild(style);
      
      return () => {
        document.head.removeChild(style);
      };
    }
  }, []);
  
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
          
          {/* Play/Pause/Stop TTS button group */}
          {currentParagraphId && (
            <div className="flex items-center space-x-2">
              {/* Loading indicator */}
              {isLoading && (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary-600 dark:border-primary-300"></div>
              )}
              
              {/* Play/Pause button */}
              <button
                onClick={() => isPlaying ? pauseTTS() : resumeTTS()}
                className="p-2 rounded-md bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-800 disabled:opacity-50"
                aria-label={isPlaying ? "Pause" : "Resume"}
                title={isPlaying ? "暂停朗读" : "继续朗读"}
                disabled={isLoading}
              >
                {isPlaying ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </button>
              
              {/* Stop TTS button */}
              <button
                onClick={stopTTS}
                className="p-2 rounded-md bg-secondary-100 text-secondary-600 dark:bg-secondary-800 dark:text-secondary-300 hover:bg-secondary-200 dark:hover:bg-secondary-700 disabled:opacity-50"
                aria-label="Stop"
                title="停止朗读"
                disabled={isLoading}
              >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
              </button>
            </div>
          )}
          
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
            
            // Debug: uncomment to help track paragraph IDs with missing vocabulary
            // useEffect(() => {
            //   if (isVocabBook && showVocabulary && item.id === '8-1-1-24' && !hasVocabulary) {
            //     console.log(`Paragraph ${item.id} missing vocabulary but should have it`);
            //   }
            // }, [item.id, hasVocabulary, isVocabBook, showVocabulary]);
            
            return (
              <div 
                key={item.id} 
                ref={(el: HTMLDivElement | null) => { if (el) paragraphRefs.current.set(item.id, el); }}
                data-paragraph-id={item.id}
                className={`mb-6 pb-6 border-b border-secondary-200 dark:border-secondary-800 ${hasVocabulary ? 'relative' : ''}`}
              >
                {(showBoth || showEnglish) && (
                  <div 
                    className="relative group mb-2"
                    onMouseEnter={() => setHoverParagraphId(item.id)}
                    onMouseLeave={() => setHoverParagraphId(null)}
                  >
                    <p className="text-secondary-900 dark:text-secondary-100 leading-relaxed">
                      {isVocabBook && showVocabulary ? (
                        vocabulary.length > 0 ? (
                          <>
                            {/* Add debug comment for development */}
                            {/* <small className="text-xs text-gray-500">[DEBUG: {item.id} has {vocabulary.length} vocab items]</small> */}
                            {highlightText(item.english, vocabulary, true)}
                          </>
                        ) : (
                          <>
                            {/* Add debug comment for development */}
                            {/* <small className="text-xs text-gray-500">[DEBUG: No vocab for {item.id}]</small> */}
                            {item.english}
                          </>
                        )
                      ) : item.english}
                    </p>
                    
                    {/* Play button that appears on hover */}
                    {hoverParagraphId === item.id && !isPlaying && currentParagraphId !== item.id && (
                      <button 
                        onClick={() => playTTS(item.id)}
                        className="absolute right-0 top-0 bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-300 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        aria-label="Play paragraph"
                        title="朗读此段落"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        </svg>
                      </button>
                    )}
                    
                    {/* Current playing indicator */}
                    {currentParagraphId === item.id && (
                      <div className="absolute left-0 top-0 h-full w-1 bg-primary-500 rounded-full pulse-animation"></div>
                    )}
                  </div>
                )}
                {(showBoth || !showEnglish) && (
                  <p className="text-secondary-700 dark:text-secondary-300 leading-relaxed">
                    {isVocabBook && showVocabulary ? (
                      vocabulary.length > 0 ? (
                        <>
                          {/* Add debug comment for development */}
                          {/* <small className="text-xs text-gray-500">[DEBUG: {item.id} has {vocabulary.length} vocab items]</small> */}
                          {highlightText(item.chinese, vocabulary, false)}
                        </>
                      ) : (
                        <>
                          {/* Add debug comment for development */}
                          {/* <small className="text-xs text-gray-500">[DEBUG: No vocab for {item.id}]</small> */}
                          {item.chinese}
                        </>
                      )
                    ) : item.chinese}
                  </p>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Fixed Vocabulary sidebar */}
        {showVocabulary && Object.keys(vocabularyItems).length > 0 && (
          <div className="w-64 shrink-0 border-l border-secondary-200 dark:border-secondary-800 pl-6 ml-2 sticky top-8 max-h-screen overflow-y-auto pb-8">
            <h3 className="text-lg font-medium mb-3 text-secondary-900 dark:text-secondary-100 sticky top-0 border-secondary-200 dark:bg-secondary-950 py-2">重点词汇</h3>
            <div className="space-y-4">
              {/* Show all vocabulary items from all currently visible paragraphs */}
              {visibleParagraphs.size > 0 ? (
                // First, collect all vocabulary words from visible paragraphs
                Array.from(visibleParagraphs)
                  // Sort paragraphs by their numeric ID for proper ordering
                  .sort((a, b) => {
                    const aNum = parseInt(a.split('-')[3], 10);
                    const bNum = parseInt(b.split('-')[3], 10);
                    return aNum - bNum;
                  })
                  // Filter to include only paragraphs that have vocabulary items
                  .filter(paragraphId => vocabularyItems[paragraphId] && vocabularyItems[paragraphId].length > 0)
                  // Map each paragraph to its vocabulary display
                  .map(paragraphId => (
                    <div key={paragraphId} className="border-b border-secondary-200 dark:border-secondary-800 pb-3">
                      {/* Display paragraph number for reference */}
                      {/* <div className="text-xs text-secondary-500 dark:text-secondary-400 mb-1">段落 {paragraphId.split('-')[3]}</div> */}
                      <ul className="space-y-2">
                        {vocabularyItems[paragraphId].map((word, index) => (
                          <li key={index} className="p-2 bg-secondary-50 dark:bg-secondary-800 rounded">
                            <div className="font-medium text-secondary-900 dark:text-secondary-100">{word.raw_en} - {word.raw_cn}</div>
                            <div className="text-sm text-secondary-600 dark:text-secondary-400">{word.en} - {word.cn}</div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))
              ) : (
                <div className="text-secondary-500 dark:text-secondary-400 italic">当前没有可见的段落词汇</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 