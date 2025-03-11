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
  console.log('BilingualReader component initializing with bookId:', bookId);
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
  
  // Text chunk handling for long paragraphs
  const [textChunks, setTextChunks] = useState<string[]>([]);
  const [currentChunkIndex, setCurrentChunkIndex] = useState<number>(0);
  // Constants
  const MAX_CHUNK_LENGTH = 300; // Maximum characters per chunk
  
  // Debug variable to track TTS functionality
  const [ttsInitialized, setTtsInitialized] = useState(false);

  // Stop TTS completely
  const stopTTS = useCallback(() => {
    console.log('Stopping TTS playback');
    if (audioRef.current) {
      console.log('Audio element exists, stopping playback');
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      // Reset the onended handler
      audioRef.current.onended = null;
    } else {
      console.error('No audio element available when stopping TTS');
    }
    
    setIsPlaying(false);
    setCurrentParagraphId(null);
    setCurrentParagraphIndex(null);
    setIsLoading(false);
    setTextChunks([]);
    setCurrentChunkIndex(0);
  }, []);

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

  // Check if audio element exists when component mounts
  useEffect(() => {
    console.log('Checking audio element status at component mount:', {
      audioRefExists: !!audioRef,
      audioElementInitialized: !!audioRef.current,
    });
    if (typeof window !== 'undefined') {
      // Create audio element for playback
      if (!audioRef.current) {
        console.log('Audio element not initialized, creating new Audio()...');
        try {
          audioRef.current = new Audio();
          console.log('Created new Audio element successfully:', !!audioRef.current);
          
          // Add global debugging handlers
          audioRef.current.onerror = (e) => {
            const errorCodes: Record<string, string> = {
              '1': 'MEDIA_ERR_ABORTED - 获取过程被用户取消',
              '2': 'MEDIA_ERR_NETWORK - 网络错误导致音频下载失败',
              '3': 'MEDIA_ERR_DECODE - 音频解码错误',
              '4': 'MEDIA_ERR_SRC_NOT_SUPPORTED - 音频格式不支持或资源不可用'
            };
            
            if (!audioRef.current) {
              console.error('Audio element error occurred but audio reference is null');
              return;
            }
            
            const mediaError = audioRef.current.error;
            const errorCode = mediaError ? String(mediaError.code) : 'unknown';
            const errorMessage = mediaError && errorCode in errorCodes 
              ? errorCodes[errorCode] 
              : '未知错误';
            
            console.error('Audio element error event:', {
              errorCode,
              errorMessage,
              errorDetails: mediaError,
              eventDetails: e
            });
            
            // Reset the audio element when an error occurs to allow retrying
            audioRef.current.removeAttribute('src');
            audioRef.current.load();
          };
          
          audioRef.current.oncanplay = () => {
            console.log('Audio can play event fired');
          };
          
          audioRef.current.oncanplaythrough = () => {
            console.log('Audio can play through event fired');
          };
        } catch (error) {
          console.error('Error creating Audio element:', error);
        }
        // Note: onended event is now managed in the playTextChunk function
        // to handle both chunk transitions and paragraph transitions
      } else {
        console.log('Audio element already initialized');
      }
      
      // Initialize audio context for potential audio processing
      if (!audioContextRef.current) {
        try {
          // Use proper typing for AudioContext
          // Define WebAudio API types
          type AudioContextType = typeof window.AudioContext;
          const AudioContextClass: AudioContextType = 
            window.AudioContext || 
            ((window as {webkitAudioContext?: AudioContextType}).webkitAudioContext as AudioContextType);
          audioContextRef.current = new AudioContextClass();
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
  }, [content.length, currentParagraphIndex, isPlaying, stopTTS]);
  
  // Function to get all paragraph text content
  // This function is kept for future use but currently not being used
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getAllParagraphsEnglishContent = useCallback(() => {
    const allContent: { id: string; text: string }[] = [];
    content.forEach((item) => {
      allContent.push({ id: item.id, text: item.english });
    });
    return allContent;
  }, [content]);
  
  // Split text into manageable chunks
  const splitTextIntoChunks = useCallback((text: string): string[] => {
    if (text.length <= MAX_CHUNK_LENGTH) {
      return [text];
    }
    
    const chunks: string[] = [];
    let start = 0;
    
    while (start < text.length) {
      let end = Math.min(start + MAX_CHUNK_LENGTH, text.length);
      
      // Try to find sentence boundaries for more natural splitting
      if (end < text.length) {
        const sentenceEndings = ['. ', '! ', '? ', '; ']; // Potential sentence endings
        let bestBreakPoint = end;
        
        // Look back from the max length to find a good sentence ending
        for (let i = end; i > Math.max(start + 100, end - 100); i--) { // Don't look back more than 100 chars
          const twoChars = text.substring(i - 1, i + 1);
          if (sentenceEndings.some(ending => ending === twoChars)) {
            bestBreakPoint = i + 1; // Include the space after the period
            break;
          }
        }
        
        // If no good sentence ending found, look for a space
        if (bestBreakPoint === end) {
          const lastSpace = text.lastIndexOf(' ', end);
          if (lastSpace > start + 100) { // Ensure we don't create tiny chunks
            bestBreakPoint = lastSpace + 1; // Include the space
          }
        }
        
        end = bestBreakPoint;
      }
      
      chunks.push(text.substring(start, end));
      start = end;
    }
    
    return chunks;
  }, [MAX_CHUNK_LENGTH]);
  
  // Play a specific chunk of text
  const playTextChunk = useCallback(async (text: string, isLastChunk: boolean) => {
    console.log('playTextChunk called with text length:', text.length, 'isLastChunk:', isLastChunk);
    
    if (!audioRef.current) {
      console.error('Audio reference is not available in playTextChunk');
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log('Requesting TTS for chunk:', text.substring(0, 50) + (text.length > 50 ? '...' : ''));
      console.log('Sending fetch request to /api/tts');
      
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
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
        // Reset audio element before setting new source
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.removeAttribute('src');
        audioRef.current.load();
        
        // Short delay to ensure audio element is ready
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Set new source
        audioRef.current.src = audioSrc;
        
        console.log('Starting audio playback');
        
        // Add a retry mechanism for play
        let retryCount = 0;
        const maxRetries = 2;
        
        const attemptPlay = async (): Promise<void> => {
          try {
            await audioRef.current!.play();
            console.log('Audio playback started successfully');
          } catch (playError: unknown) {
            retryCount++;
            console.warn(`Play attempt ${retryCount} failed:`, playError);
            
            if (retryCount <= maxRetries) {
              console.log(`Retrying playback (attempt ${retryCount}/${maxRetries})...`);
              // Wait a moment before retrying
              await new Promise(resolve => setTimeout(resolve, 300));
              return attemptPlay();
            } else {
              const errorMessage = playError instanceof Error ? playError.message : 'Unknown error';
              throw new Error(`Audio playback failed after ${maxRetries} attempts: ${errorMessage}`);
            }
          }
        };
        
        await attemptPlay();
        
        // Set up the ended event for this chunk
        const handleEnded = () => {
          if (isLastChunk) {
            // If this is the last chunk of the paragraph, move to next paragraph
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
          } else {
            // Play the next chunk of the current paragraph
            playNextChunk();
          }
        };
        
        audioRef.current.onended = handleEnded;
        console.log('Setting up onended handler, about to play audio...');
      } else {
        console.error('Audio element reference is not available');
        throw new Error('Audio player not available');
      }
    } catch (error) {
      console.error('TTS request or playback error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [content, currentParagraphIndex, isPlaying, stopTTS]);
  
  // Play the next chunk of the current paragraph
  const playNextChunk = useCallback(() => {
    console.log('playNextChunk called');
    
    if (currentChunkIndex < textChunks.length - 1) {
      const nextChunkIndex = currentChunkIndex + 1;
      setCurrentChunkIndex(nextChunkIndex);
      const isLastChunk = nextChunkIndex === textChunks.length - 1;
      console.log(`Playing next chunk (${nextChunkIndex + 1}/${textChunks.length})`);
      
      playTextChunk(textChunks[nextChunkIndex], isLastChunk).catch((error: unknown) => {
        console.error('Error playing next chunk:', error);
        stopTTS();
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        alert(`Failed to play next chunk: ${errorMessage}`);
      });
    }
  }, [currentChunkIndex, textChunks, stopTTS, playTextChunk]);
  
  // Play TTS for a specific paragraph
  const playTTS = useCallback(async (paragraphId: string) => {
    console.log('playTTS called with paragraph ID:', paragraphId);
    console.log('Current time:', new Date().toISOString());
    
    if (!audioRef.current) {
      console.error('Audio reference is not available');
      return;
    }
    
    // Stop any current playback
    stopTTS();
    
    // Find the index of the paragraph to start from
    const paragraphIndex = content.findIndex(item => item.id === paragraphId);
    console.log('Paragraph index:', paragraphIndex);
    if (paragraphIndex === -1) {
      console.error('Paragraph not found in content');
      return;
    }
    
    const paragraphText = content[paragraphIndex].english;
    console.log('Paragraph text:', paragraphText ? paragraphText.substring(0, 50) + '...' : 'undefined');
    if (!paragraphText) {
      console.error('No English text for this paragraph');
      return;
    }
    
    // Split the paragraph text into chunks if it's long
    const chunks = splitTextIntoChunks(paragraphText);
    setTextChunks(chunks);
    setCurrentChunkIndex(0);
    
    setCurrentParagraphId(paragraphId);
    setCurrentParagraphIndex(paragraphIndex);
    setIsPlaying(true);
    
    try {
      // Scroll to the paragraph being read
      if (paragraphRefs.current.has(paragraphId)) {
        const paragraphElement = paragraphRefs.current.get(paragraphId);
        if (paragraphElement) {
          paragraphElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      
      // Play the first chunk
      const isLastChunk = chunks.length === 1;
      await playTextChunk(chunks[0], isLastChunk);
    } catch (error) {
      console.error('TTS error:', error);
      setIsLoading(false);
      stopTTS();
      
      // Show error message to the user
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Speech synthesis failed: ${errorMessage}. Please try again later.`);
    }
  }, [content, stopTTS, splitTextIntoChunks, playTextChunk, setTextChunks, setCurrentChunkIndex, setCurrentParagraphId, setCurrentParagraphIndex, setIsPlaying, paragraphRefs]);
  
  // Log when TTS functions are initialized
  useEffect(() => {
    console.log('TTS functions initialized');
    setTtsInitialized(true);
  }, []);
  
  
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
  
  // stopTTS function moved to the top of the component

  // Set up intersection observer to track visible paragraphs
  useEffect(() => {
    if (typeof window === 'undefined' || !showVocabulary || bookId !== '8') return;
    
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
      return;
    }
    
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
      
      
      // Process each new visible paragraph
      // Use Promise.all to fetch vocabulary for all paragraphs in parallel
      const fetchPromises = paragraphsToFetch.map(async (paragraphId) => {
        try {
          const vocab = await getVocabularyForParagraph(paragraphId);
          if (vocab.length > 0) {
            newVocabularyItems[paragraphId] = vocab;
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
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 01-1 1h-3a1 1 0 110-2h3V8a1 1 0 011-1v3z" clipRule="evenodd" />
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
            //     // Removed vocabulary debug log
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
                        onClick={(e) => {
                          console.log('PLAY BUTTON CLICKED for paragraph:', item.id);
                          console.log('playTTS function exists:', typeof playTTS === 'function');
                          console.log('Event target:', e.target);
                          e.stopPropagation(); // 防止事件冒泡
                          try {
                            playTTS(item.id);
                            console.log('playTTS call completed');
                          } catch (error) {
                            console.error('Error calling playTTS:', error);
                          }
                        }}
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