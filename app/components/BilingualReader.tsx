'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { BilingualContent } from '../types';
import { KeyWord, getVocabularyForParagraph, highlightText } from '../data/vocabulary';
import Link from 'next/link';
import Image from 'next/image';
import { saveReadingProgress, getReadingProgress } from '../lib/localStorage';
import { getAllBookConfigs } from '../data/chapters';

interface BilingualReaderProps {
  content: BilingualContent[];
  chapterTitle: string;
  bookId: string;
  chapterId: string;
}

export default function BilingualReader({ content, chapterTitle, bookId, chapterId }: BilingualReaderProps) {
  const [fontSize, setFontSize] = useState<number>(16);
  const [showBoth, setShowBoth] = useState<boolean>(true);
  const [showEnglish, setShowEnglish] = useState<boolean>(true);
  const [showVocabulary, setShowVocabulary] = useState<boolean>(true);
  const [visibleParagraphs, setVisibleParagraphs] = useState<Set<string>>(new Set());
  const paragraphRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [vocabularyItems, setVocabularyItems] = useState<{[key: string]: KeyWord[]}>({});
  
  // Add playback speed state
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [showSpeedSelector, setShowSpeedSelector] = useState<boolean>(false);
  
  // Add playback mode state (sequential or loop)
  const [loopMode, setLoopMode] = useState<boolean>(false);
  // Add a ref to track the latest loopMode value for callbacks
  const loopModeRef = useRef<boolean>(false);

  // TTS state variables
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentParagraphId, setCurrentParagraphId] = useState<string | null>(null);
  const [, setCurrentParagraphIndex] = useState<number | null>(null);
  const [hoverParagraphId, setHoverParagraphId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Add state for floating controls
  const [showFloatingControls, setShowFloatingControls] = useState<boolean>(true);
  // Only enable audio playback for book ID '7'
  const isAudioEnabled = bookId === '7';

  // Use a ref to track the last scroll position
  const lastScrollPositionRef = useRef<number>(0);
  const scrollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const saveProgressTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // 添加追踪用户滚动状态的ref - 移到组件顶层
  const hasScrolledRef = useRef<boolean>(false);
  
  // Forward declarations to solve circular references
  const playTTSRef = useRef<(paragraphId: string) => Promise<void>>(undefined!);
  const playTextChunkRef = useRef<(text: string, paragraphIndex: number) => Promise<void>>(undefined!);

  // Add iOS Safari detection function
  const isIOSSafari = useCallback(() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent;
    // Type assertion for MSStream property which is used in browser detection
    return /iPad|iPhone|iPod/.test(ua) && !(window as Window & { MSStream?: unknown }).MSStream && /Safari/.test(ua);
  }, []);

  // Add a ref for tracking audio initialization
  const audioInitializedRef = useRef<boolean>(false);

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
    setIsPlaying(false);
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

  // Track scroll to show/hide floating controls and save reading progress
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 组件挂载时记录日志 - 简化日志
    // console.log(`BilingualReader 组件已挂载 - 书籍: ${bookId}, 章节: ${chapterId}`);
    
    // 重置滚动状态
    hasScrolledRef.current = false;
    
    // 尝试获取现有的阅读进度，避免重置
    const existingProgress = getReadingProgress(bookId);
    if (existingProgress && existingProgress.lastPosition > 10) {
      // console.log(`BilingualReader 挂载时找到现有阅读进度 - 书籍: ${bookId}, 位置: ${existingProgress.lastPosition}px`);
      // 我们不在这里设置滚动位置，那是ReadPage组件的责任
    }
    
    const handleScroll = () => {
      // 标记已经滚动过
      hasScrolledRef.current = true;
      
      const currentScrollPos = window.scrollY;
      
      // Show/hide based on scroll direction
      if (currentScrollPos > lastScrollPositionRef.current + 20) {
        // Scrolling down, hide controls
        setShowFloatingControls(false);
      } else if (currentScrollPos < lastScrollPositionRef.current - 20) {
        // Scrolling up, show controls
        setShowFloatingControls(true);
      }
      
      lastScrollPositionRef.current = currentScrollPos;
      
      // Clear existing timer
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current);
      }
      
      // Show controls briefly when scrolling stops
      scrollTimerRef.current = setTimeout(() => {
        setShowFloatingControls(true);
      }, 1000);
      
      // Clear existing progress save timer
      if (saveProgressTimerRef.current) {
        clearTimeout(saveProgressTimerRef.current);
      }
      
      // Save reading progress after scrolling stops (debounce)
      saveProgressTimerRef.current = setTimeout(() => {
        // Only save position if it's meaningful (not at the very top)
        if (currentScrollPos > 10) {
          // 减少详细的滚动位置日志
          // console.log('滚动时保存阅读进度:', {
          //   书籍: bookId,
          //   章节: chapterId,
          //   位置: currentScrollPos,
          //   时间: new Date().toLocaleString()
          // });
          
          saveReadingProgress({
            bookId,
            chapterId,
            lastPosition: currentScrollPos,
            lastRead: new Date().toISOString()
          });
        }
      }, 500);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      // console.log(`BilingualReader 组件即将卸载 - 书籍: ${bookId}, 章节: ${chapterId}`);
      
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current);
      }
      if (saveProgressTimerRef.current) {
        clearTimeout(saveProgressTimerRef.current);
      }
      
      // Save final position on unmount
      const finalPosition = window.scrollY;
      
      // 获取页面跳转信息
      try {
        if (typeof document !== 'undefined') {
          const activeElement = document.activeElement;
          if (activeElement && activeElement.tagName === 'A') {
            const href = (activeElement as HTMLAnchorElement).getAttribute('href');
            if (href) {
              // Removed the navigatingTo variable as it's not used
            }
          }
        }
      } catch (e) {
        console.error("获取导航信息时出错", e);
      }
      
      // 删除详细的卸载日志
      // console.log(`组件卸载详情 - 当前位置: ${finalPosition}, 是否曾经滚动: ${hasScrolledRef.current}`);
      
      // 只有当滚动位置大于一个阈值时才保存
      // 这可以防止在返回首页等情况下将位置重置为0
      if (finalPosition > 10) {
        // console.log('卸载时保存阅读进度:', {
        //   书籍: bookId,
        //   章节: chapterId,
        //   位置: finalPosition,
        //   时间: new Date().toLocaleString(),
        //   导航至: navigatingTo
        // });
        
        saveReadingProgress({
          bookId,
          chapterId,
          lastPosition: finalPosition,
          lastRead: new Date().toISOString()
        });
      } else {
        // 如果当前位置很小，检查是否已有保存的阅读进度，避免覆盖
        const existingProgress = getReadingProgress(bookId);
        if (existingProgress && existingProgress.lastPosition > 10) {
          // console.log('卸载时检测到无效位置，保留现有阅读进度', {
          //   书籍: bookId,
          //   章节: chapterId,
          //   当前位置: finalPosition,
          //   已保存位置: existingProgress.lastPosition,
          //   导航至: navigatingTo
          // });
          // 不做任何更新，保留现有进度
        } 
        // 只有当用户已经进行过滚动交互，且位置为0时，才保存初始状态
        // 这可以避免在组件初始化和卸载时错误地保存位置为0
        else if (hasScrolledRef.current) {
          // console.log('卸载时保存初始阅读状态（从头开始）', {
          //   书籍: bookId,
          //   章节: chapterId,
          //   位置: finalPosition,
          //   时间: new Date().toLocaleString(),
          //   导航至: navigatingTo
          // });
          
          saveReadingProgress({
            bookId,
            chapterId,
            lastPosition: finalPosition,
            lastRead: new Date().toISOString()
          });
        } else {
          // console.log('卸载时未保存位置为0的初始状态，因为用户未进行滚动交互');
        }
      }
    };
  }, [bookId, chapterId]);

  // Scroll to saved position on initial load
  useEffect(() => {
    // After component is mounted and content is loaded, try to restore scroll position
    const timer = setTimeout(() => {
      if (window.location.hash) {
        const scrollPosition = parseInt(window.location.hash.replace('#position=', ''), 10);
        if (!isNaN(scrollPosition)) {
          window.scrollTo(0, scrollPosition);
        }
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

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
          // Add attributes needed for iOS
          if (isIOSSafari()) {
            audioRef.current.setAttribute('playsinline', '');
            audioRef.current.setAttribute('webkit-playsinline', '');
            
            // Store in window for iOS Safari to reuse the same audio context
            (window as unknown as { globalAudioElement: HTMLAudioElement | null }).globalAudioElement = audioRef.current;
          }
          
          console.log('Created new Audio element successfully:', !!audioRef.current);
          
          // Add global debugging handlers
          audioRef.current.onerror = () => {
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
            console.error(`Audio element error: ${errorMessage}`);

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
      
      // Initialize audio on user interaction for iOS Safari
      if (isIOSSafari() && !audioInitializedRef.current) {
        const initAudioOnUserInteraction = () => {
          console.log('User interaction detected, initializing audio for iOS');
          // Create and play a silent audio file to initialize audio
          const silentAudio = new Audio("data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//tQwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAACAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV6urq6urq6urq6urq6urq6urq6v///////////////////////////////////////////wAAADlMQVZDNTguNTQuMTAwAAAAAAAAAAAUBAj/4QAAMAAAAQAAAQAB//8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/7UMQAAAppSqVGiACsCH2qVYYAQABkb3duAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUUAAIAAABkb3duAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVU=");
          silentAudio.play().then(() => {
            audioInitializedRef.current = true;
            console.log('Silent audio initialized successfully for iOS');
          }).catch(error => console.log("Silent audio initialization failed:", error));
        };

        document.addEventListener('touchstart', initAudioOnUserInteraction, { once: true });
        document.addEventListener('click', initAudioOnUserInteraction, { once: true });
      }
    }
    
    return () => {
      stopTTS();
      // Clean up audio resources
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      
      // Clean up event listeners if added
      if (isIOSSafari()) {
        document.removeEventListener('touchstart', () => {});
        document.removeEventListener('click', () => {});
      }
    };
  }, [stopTTS, isIOSSafari]);

  // Add function to set playback speed
  const changePlaybackSpeed = useCallback((speed: number) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
    setShowSpeedSelector(false);
  }, []);

  // Add function to toggle speed selector visibility
  const toggleSpeedSelector = useCallback(() => {
    setShowSpeedSelector(prev => !prev);
  }, []);

  // Add function to toggle playback mode between sequential and loop
  const togglePlaybackMode = useCallback(() => {
    setLoopMode(prev => !prev);
  }, []);

  // Play the next chunk of text from the paragraph
  const playTextChunk = useCallback(async (text: string, paragraphIndex: number): Promise<void> => {
    console.log('playTextChunk called with:', { textLength: text.length, paragraphIndex });
    
    if (!text || text.trim() === '') {
      console.error('Empty text provided to playTextChunk');
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (audioRef.current) {
        // Get current paragraph ID
        const paragraphId = content[paragraphIndex].id;
        console.log('Creating audio for paragraph ID:', paragraphId);
        
        // Get book configuration to find audio CDN URL
        const bookConfigs = getAllBookConfigs();
        const bookConfig = bookConfigs.find(config => config.id === bookId);
        
        if (bookConfig?.audioCdnUrl) {
          // Extract the file name from paragraph ID
          // For example: "7-1-123" would become "123.mp3"
          // Or "8-1-2-45" would become "45.mp3"
          const parts = paragraphId.split('-');
          const fileName = parts[parts.length - 1] + '.mp3';
          const audioUrl = `${bookConfig.audioCdnUrl}${fileName}`;
          
          console.log('Loading audio from CDN URL:', audioUrl);
          
          // Set audio source to the CDN URL
          if (audioRef.current) {
            // Reset audio element before setting new source
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            
            // Remove previous event listeners to avoid duplicates
            audioRef.current.onended = null;
            
            // Special handling for iOS Safari
            if (isIOSSafari()) {
              // For iOS Safari, use the globally stored audio element that's initialized on first user interaction
              const globalAudio = (window as unknown as { globalAudioElement?: HTMLAudioElement }).globalAudioElement;
              if (globalAudio) {
                audioRef.current = globalAudio;
              }
              
              // Ensure attributes for iOS playback
              if (audioRef.current) {
                audioRef.current.setAttribute('playsinline', '');
                audioRef.current.setAttribute('webkit-playsinline', '');
              }
            } else {
              // For other browsers, create a new Audio element to avoid state issues
              const oldElement = audioRef.current;
              audioRef.current = new Audio();
              
              // Transfer needed event handlers
              // Re-add global debugging handlers
              if (oldElement.onerror) audioRef.current.onerror = oldElement.onerror;
              if (oldElement.oncanplay) audioRef.current.oncanplay = oldElement.oncanplay;
              if (oldElement.oncanplaythrough) audioRef.current.oncanplaythrough = oldElement.oncanplaythrough;
            }
            
            // Set new source to CDN URL instead of base64 data
            audioRef.current.src = audioUrl;
            
            // Apply the current playback speed
            audioRef.current.playbackRate = playbackSpeed;
            
            console.log('Starting audio playback from CDN');
            
            // Add a retry mechanism for play
            let retryCount = 0;
            const maxRetries = isIOSSafari() ? 3 : 2;  // Increased retries for iOS Safari
            
            const attemptPlay = async (): Promise<void> => {
              try {
                if (audioRef.current) {
                  await audioRef.current.play();
                  console.log('Audio playback started successfully');
                } else {
                  throw new Error('Audio element is null');
                }
              } catch (playError: unknown) {
                retryCount++;
                const errorMessage = playError instanceof Error ? playError.message : 'Unknown error';
                console.warn(`Play attempt ${retryCount} failed: ${errorMessage}`);
                
                if (retryCount <= maxRetries) {
                  console.log(`Retrying playback (attempt ${retryCount}/${maxRetries})...`);
                  // Wait a moment before retrying
                  await new Promise(resolve => setTimeout(resolve, isIOSSafari() ? 500 : 300));  // Longer delay for iOS
                  return attemptPlay();
                } else {
                  throw new Error(`Audio playback failed after ${maxRetries} attempts: ${errorMessage}`);
                }
              }
            };
            
            await attemptPlay();
            
            // Set up the ended event for this chunk
            const handleEnded = () => {
              console.log('Audio ended event triggered', { isPlaying, paragraphIndex });
              
              if (paragraphIndex !== null) {
                // If in loop mode, replay the same paragraph
                if (loopModeRef.current) {
                  console.log('Loop mode: replaying current paragraph', { paragraphId });
                  // Small delay before replaying to avoid issues
                  setTimeout(() => {
                    if (playTTSRef.current) {
                      playTTSRef.current(paragraphId);
                    } else {
                      console.error('playTTS reference is not available');
                    }
                  }, 300);
                  return;
                }
                
                // If sequential mode (default), move to next paragraph
                const nextIndex = paragraphIndex + 1;
                console.log('Attempting to play next paragraph', { nextIndex, contentLength: content.length });
                if (nextIndex < content.length) {
                  const nextParagraph = content[nextIndex];
                  console.log('Playing next paragraph with ID:', nextParagraph.id);
                  setCurrentParagraphId(nextParagraph.id);
                  setCurrentParagraphIndex(nextIndex);
                  
                  // For iOS Safari, use a timeout to help with playback chain
                  if (isIOSSafari()) {
                    // Longer delay for iOS Safari to prevent autoplay restrictions
                    setTimeout(() => {
                      if (playTTSRef.current) {
                        playTTSRef.current(nextParagraph.id);
                      } else {
                        console.error('playTTS reference is not available');
                      }
                    }, 100);
                  } else {
                    if (playTTSRef.current) {
                      playTTSRef.current(nextParagraph.id);
                    } else {
                      console.error('playTTS reference is not available');
                    }
                  }
                } else {
                  // End of content
                  console.log('End of content reached, stopping TTS');
                  stopTTS();
                }
              }
            };
            
            // Remove any existing onended handler first
            if (audioRef.current) {
              audioRef.current.onended = null;
              // Then add the new handler
              audioRef.current.onended = handleEnded;
              console.log('Setting up onended handler, about to play audio...');
              
              // Add additional event to debug if ended event is not firing
              audioRef.current.addEventListener('ended', () => {
                console.log('Audio ended event fired via addEventListener - this is a secondary check');
              });
              
              // Check if the audio element has the expected duration
              audioRef.current.onloadedmetadata = () => {
                const audioDuration = audioRef.current?.duration || 0;
                console.log('Audio metadata loaded, duration:', audioDuration);
                if (audioDuration === 0) {
                  console.warn('Warning: Audio duration is zero, this may cause playback issues');
                }
              };
            } else {
              console.error('Audio element is null, cannot set event handlers');
            }
          } else {
            console.error('Audio element reference is not available');
            throw new Error('Audio player not available');
          }
        } else {
          // Fallback to TTS API if audioCdnUrl is not configured
          console.log('No audio CDN URL available, falling back to TTS API');
          
          const response = await fetch('/api/tts', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: text,
              voice: 'en-US-AvaMultilingualNeural' // Default voice
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
          console.log('TTS API response received with data');
          
          // Validate audio data exists
          if (!data || !data.audio) {
            console.error('TTS API response missing audio data:', data);
            throw new Error('No audio data received from TTS API');
          }
          
          console.log('Audio source created, length:', data.audio.length);
          
          // Set up audio playback with the TTS API response data
          if (audioRef.current) {
            // Reset audio element before setting new source
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            
            // Remove previous event listeners to avoid duplicates
            audioRef.current.onended = null;
            
            // Special handling for iOS Safari
            if (isIOSSafari()) {
              // For iOS Safari, use the globally stored audio element that's initialized on first user interaction
              const globalAudio = (window as unknown as { globalAudioElement?: HTMLAudioElement }).globalAudioElement;
              if (globalAudio) {
                audioRef.current = globalAudio;
              }
              
              // Ensure attributes for iOS playback
              if (audioRef.current) {
                audioRef.current.setAttribute('playsinline', '');
                audioRef.current.setAttribute('webkit-playsinline', '');
              }
            } else {
              // For other browsers, create a new Audio element to avoid state issues
              const oldElement = audioRef.current;
              audioRef.current = new Audio();
              
              // Transfer needed event handlers
              if (oldElement.onerror) audioRef.current.onerror = oldElement.onerror;
              if (oldElement.oncanplay) audioRef.current.oncanplay = oldElement.oncanplay;
              if (oldElement.oncanplaythrough) audioRef.current.oncanplaythrough = oldElement.oncanplaythrough;
            }
            
            // Create audio source from base64 data
            const audioSrc = `data:audio/mp3;base64,${data.audio}`;
            audioRef.current.src = audioSrc;
            
            // Apply the current playback speed
            audioRef.current.playbackRate = playbackSpeed;
            
            console.log('Starting audio playback from TTS API response');
            
            // Add a retry mechanism for play
            let retryCount = 0;
            const maxRetries = isIOSSafari() ? 3 : 2;  // Increased retries for iOS Safari
            
            const attemptPlay = async (): Promise<void> => {
              try {
                if (audioRef.current) {
                  await audioRef.current.play();
                  console.log('Audio playback started successfully');
                } else {
                  throw new Error('Audio element is null');
                }
              } catch (playError: unknown) {
                retryCount++;
                const errorMessage = playError instanceof Error ? playError.message : 'Unknown error';
                console.warn(`Play attempt ${retryCount} failed: ${errorMessage}`);
                
                if (retryCount <= maxRetries) {
                  console.log(`Retrying playback (attempt ${retryCount}/${maxRetries})...`);
                  // Wait a moment before retrying
                  await new Promise(resolve => setTimeout(resolve, isIOSSafari() ? 500 : 300));  // Longer delay for iOS
                  return attemptPlay();
                } else {
                  throw new Error(`Audio playback failed after ${maxRetries} attempts: ${errorMessage}`);
                }
              }
            };
            
            await attemptPlay();
            
            // Set up the ended event for this chunk
            const handleEnded = () => {
              console.log('Audio ended event triggered', { isPlaying, paragraphIndex });
              
              if (paragraphIndex !== null) {
                // If in loop mode, replay the same paragraph
                if (loopModeRef.current) {
                  console.log('Loop mode: replaying current paragraph', { paragraphId });
                  // Small delay before replaying to avoid issues
                  setTimeout(() => {
                    if (playTTSRef.current) {
                      playTTSRef.current(paragraphId);
                    } else {
                      console.error('playTTS reference is not available');
                    }
                  }, 300);
                  return;
                }
                
                // If sequential mode (default), move to next paragraph
                const nextIndex = paragraphIndex + 1;
                console.log('Attempting to play next paragraph', { nextIndex, contentLength: content.length });
                if (nextIndex < content.length) {
                  const nextParagraph = content[nextIndex];
                  console.log('Playing next paragraph with ID:', nextParagraph.id);
                  setCurrentParagraphId(nextParagraph.id);
                  setCurrentParagraphIndex(nextIndex);
                  
                  // For iOS Safari, use a timeout to help with playback chain
                  if (isIOSSafari()) {
                    // Longer delay for iOS Safari to prevent autoplay restrictions
                    setTimeout(() => {
                      if (playTTSRef.current) {
                        playTTSRef.current(nextParagraph.id);
                      } else {
                        console.error('playTTS reference is not available');
                      }
                    }, 100);
                  } else {
                    if (playTTSRef.current) {
                      playTTSRef.current(nextParagraph.id);
                    } else {
                      console.error('playTTS reference is not available');
                    }
                  }
                } else {
                  // End of content
                  console.log('End of content reached, stopping TTS');
                  stopTTS();
                }
              }
            };
            
            // Remove any existing onended handler first
            if (audioRef.current) {
              audioRef.current.onended = null;
              // Then add the new handler
              audioRef.current.onended = handleEnded;
              console.log('Setting up onended handler, about to play audio...');
              
              // Add additional event to debug if ended event is not firing
              audioRef.current.addEventListener('ended', () => {
                console.log('Audio ended event fired via addEventListener - this is a secondary check');
              });
              
              // Check if the audio element has the expected duration
              audioRef.current.onloadedmetadata = () => {
                const audioDuration = audioRef.current?.duration || 0;
                console.log('Audio metadata loaded, duration:', audioDuration);
                if (audioDuration === 0) {
                  console.warn('Warning: Audio duration is zero, this may cause playback issues');
                }
              };
            } else {
              console.error('Audio element is null, cannot set event handlers');
            }
          } else {
            console.error('Audio element reference is not available for TTS playback');
            throw new Error('Audio player not available');
          }
        }
      } else {
        console.error('Audio element reference is not available');
        throw new Error('Audio player not available');
      }
    } catch (error) {
      console.error('Audio playback or TTS request error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [content, stopTTS, isPlaying, isIOSSafari, bookId, playbackSpeed]);

  // Store the function in the ref so it can be accessed by other functions
  useEffect(() => {
    playTextChunkRef.current = playTextChunk;
  }, [playTextChunk]);

  // Play TTS for a specific paragraph
  const playTTS = useCallback(async (paragraphId: string): Promise<void> => {
    console.log('playTTS called with paragraph ID:', paragraphId);
    console.log('Current time:', new Date().toISOString());
    console.log('Is iOS Safari:', isIOSSafari());
    
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
    
    // Set current paragraph state
    setCurrentParagraphId(paragraphId);
    setCurrentParagraphIndex(paragraphIndex);
    setIsPlaying(true);
    
    // Take a different approach for iOS Safari
    if (isIOSSafari() && !audioInitializedRef.current) {
      console.log('iOS Safari detected but audio not initialized - trying to initialize');
      
      // For iOS, we need user interaction to initialize audio
      const silentAudio = new Audio("data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//tQwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAACAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV6urq6urq6urq6urq6urq6urq6urq6v///////////////////////////////////////////wAAADlMQVZDNTguNTQuMTAwAAAAAAAAAAAUBAj/4QAAMAAAAQAAAQAB//8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/7UMQAAAppSqVGiACsCH2qVYYAQABkb3duAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUUAAIAAABkb3duAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVU=");
      try {
        await silentAudio.play();
        audioInitializedRef.current = true;
        console.log('Silent audio initialized successfully for iOS on-demand');
      } catch (e) {
        console.log("Silent audio initialization failed - continuing anyway:", e);
      }
    }
    
    // Extract text from the current paragraph - English only for TTS
    const text = content[paragraphIndex].english;
    
    try {
      console.log('Starting playback with text length:', text.length);
      // Play the paragraph using our playTextChunk function
      await playTextChunkRef.current(text, paragraphIndex);
    } catch (error) {
      console.error('Error playing paragraph:', error);
      
      // Reset state on failure
      stopTTS();
      
      // Show error message to user - a more user-friendly version
      alert('朗读失败，请尝试再次点击朗读按钮。在iOS Safari中可能需要多次尝试，或切换到Chrome浏览器获得更好体验。');
    }
  }, [content, stopTTS, isIOSSafari]);

  // Store the function in the ref so it can be accessed by other functions
  useEffect(() => {
    playTTSRef.current = playTTS;
  }, [playTTS]);

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
      if (playTTSRef.current) {
        playTTSRef.current(currentParagraphId);
      } else {
        console.error('playTTS reference is not available');
      }
    }
  }, [currentParagraphId, playTTSRef]);

  // Add tap-to-play functionality for paragraphs
  const handleParagraphTap = useCallback((paragraphId: string, event?: React.MouseEvent<HTMLElement>) => {
    if (!isAudioEnabled) return;
    // The hover button is explicitly clicked, so we should NOT prevent playback
    // This check was preventing the hover button from working on desktop
    // Only prevent automatic paragraph taps (not button clicks) on desktop
    const isHoverButtonClick = window.innerWidth > 768 && hoverParagraphId === paragraphId && event?.type === 'click';
    
    // If it's a paragraph tap (not button click) on desktop, ignore it
    if (window.innerWidth > 768 && hoverParagraphId === paragraphId && !isHoverButtonClick) {
      return;
    }
    
    // Don't play if already playing this paragraph
    if (currentParagraphId === paragraphId) {
      // Toggle play/pause instead
      if (isPlaying) {
        pauseTTS();
      } else {
        resumeTTS();
      }
      return;
    }
    
    // Start playing from this paragraph
    if (playTTSRef.current) {
      playTTSRef.current(paragraphId);
    } else {
      console.error('playTTS reference is not available');
    }
  }, [currentParagraphId, hoverParagraphId, isPlaying, pauseTTS, resumeTTS, playTTSRef, isAudioEnabled]);

  // Set up intersection observer to track visible paragraphs
  useEffect(() => {
    if (typeof window === 'undefined' || !showVocabulary || !(bookId === '7' || bookId === '8' || bookId === '9')) return;
    
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

  // Extract chapter or part information from content to limit vocabulary requests
  const currentChapterInfo = useMemo(() => {
    // console.log(`[ChapterInfo] Extracting chapter/part info for book ${bookId}`);
    if (!content || content.length === 0) return null;

    // Check if *any* book IDs that use vocabulary are present
    const supportedBookIds = ['7', '8', '9']; // Add '7' for Principles
    if (!supportedBookIds.includes(bookId)) return null;

    const firstParagraphId = content[0]?.id;
    if (!firstParagraphId) return null;

    const idParts = firstParagraphId.split('-');

    // Handle Principles (bookId 7): bookId-partIndex-paragraphIdSuffix
    if (bookId === '7') {
      if (idParts.length >= 3) {
        return {
            partIndex: idParts[1], // Use partIndex for Principles
            part: '0', // Not used for Principles lookup
            chapter: '0' // Not used for Principles lookup
        };
      } else {
        console.warn(`[ChapterInfo] Invalid ID format for Principles: ${firstParagraphId}`);
        return null;
      }
    }
    // Handle The Little Prince (bookId 9): bookId-chapterNumber-paragraphNumber
    else if (bookId === '9') {
      if (idParts.length >= 3) {
          return {
              partIndex: '0', // Not used for Little Prince
              part: '0', // Little Prince doesn't use parts
              chapter: idParts[1]
          };
      } else {
          console.warn(`[ChapterInfo] Invalid ID format for The Little Prince: ${firstParagraphId}`);
          return null;
      }
    }
    // Handle Madame Bovary (bookId 8): bookId-part-chapter-paragraphNumber
    else if (bookId === '8') {
        if (idParts.length >= 4) {
            return {
                partIndex: '0', // Not used for Madame Bovary
                part: idParts[1],
                chapter: idParts[2]
            };
        } else {
             console.warn(`[ChapterInfo] Invalid ID format for Madame Bovary: ${firstParagraphId}`);
             return null;
        }
    }

    return null; // Fallback
  }, [content, bookId]);

  // Effect to fetch vocabulary for visible paragraphs
  useEffect(() => {
    // Check if vocabulary should be shown and if the book supports it
    const supportedBookIds = ['7', '8', '9']; // Add '7' here as well
    if (!showVocabulary || !supportedBookIds.includes(bookId) || !currentChapterInfo) {
      // console.log('[Vocab Fetch Effect] Vocabulary disabled or book not supported.');
      return;
    }

    // Use a debounce timer to avoid excessive API calls
    let debounceTimer: NodeJS.Timeout | null = null;
    
    const fetchVocabulary = async () => {
      // Keep existing vocabulary items
      const newVocabularyItems = {...vocabularyItems};

      // Get visible paragraphs and add adjacent paragraphs for preloading
      const visibleParagraphIds = Array.from(visibleParagraphs);
      const paragraphIdsToCheck = new Set<string>(visibleParagraphIds);
      
      // Generate IDs for adjacent paragraphs to preload
      visibleParagraphIds.forEach(paragraphId => {
        const idParts = paragraphId.split('-');
        
        // Handle different ID formats based on book ID
        if (bookId === '7') {
          // Principles: bookId-partIndex-paragraphIdSuffix
          if (idParts.length >= 3) {
            const theBookId = idParts[0];
            const partIndex = idParts[1];
            const numStr = idParts[2];
            const paragraphNum = parseInt(numStr, 10);
            
            // Add 5 paragraphs ahead for preloading within the same partIndex
            for (let i = 1; i <= 5; i++) {
              const adjacentNum = paragraphNum + i;
              if (adjacentNum > 0) { // Basic check, actual existence checked by vocab fetch
                const adjacentId = `${theBookId}-${partIndex}-${adjacentNum}`;
                paragraphIdsToCheck.add(adjacentId);
              }
            }
          }
        } else if (bookId === '9') {
          // The Little Prince: bookId-chapterNumber-paragraphNumber
          if (idParts.length >= 3) {
            const theBookId = idParts[0];
            const chapter = idParts[1];
            const numStr = idParts[2];
            
            const paragraphNum = parseInt(numStr, 10);
            
            // Add 5 paragraphs ahead for preloading
            for (let i = 1; i <= 5; i++) {
              const adjacentNum = paragraphNum + i;
              if (adjacentNum > 0) {
                const adjacentId = `${theBookId}-${chapter}-${adjacentNum}`;
                paragraphIdsToCheck.add(adjacentId);
              }
            }
          }
        } else {
          // For Madame Bovary: bookId-part-chapter-paragraphNumber
          if (idParts.length >= 4) {
            const theBookId = idParts[0];
            const part = idParts[1];
            const chapter = idParts[2];
            const numStr = idParts[3];
            
            const paragraphNum = parseInt(numStr, 10);
            
            // Add 5 paragraphs ahead for preloading
            for (let i = 1; i <= 5; i++) {
              const adjacentNum = paragraphNum + i;
              if (adjacentNum > 0) {
                const adjacentId = `${theBookId}-${part}-${chapter}-${adjacentNum}`;
                paragraphIdsToCheck.add(adjacentId);
              }
            }
          }
        }
      });
      
      // Get only paragraphs that aren't already loaded and belong to the current chapter/part
      const paragraphsToFetch = Array.from(paragraphIdsToCheck).filter(paragraphId => {
        // Skip if already loaded
        if (newVocabularyItems[paragraphId]) {
          return false;
        }
        
        // Verify paragraph belongs to current chapter/part
        const idParts = paragraphId.split('-');
        
        // Handle different ID formats
        if (bookId === '7') {
          // Principles: bookId-partIndex-paragraphIdSuffix
          if (idParts.length < 3) return false;
          const paragraphPartIndex = idParts[1];
          // Check if the partIndex matches the current view
          return paragraphPartIndex === currentChapterInfo?.partIndex;
        } else if (bookId === '9') {
          // For The Little Prince: bookId-chapterNumber-paragraphNumber
          if (idParts.length < 3) {
            return false;
          }
          
          const paragraphChapter = idParts[1];
          
          // For The Little Prince, we only care if the chapter matches
          const matches = paragraphChapter === currentChapterInfo.chapter;
          return matches;
        } else {
          // For Madame Bovary: bookId-part-chapter-paragraphNumber
          if (idParts.length < 4) {
            return false;
          }
          
          const paragraphPart = idParts[1];
          const paragraphChapter = idParts[2];
          
          // For Madame Bovary, we need both part and chapter to match
          const matches = paragraphPart === currentChapterInfo.part && 
                 paragraphChapter === currentChapterInfo.chapter;
          return matches;
        }
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

  // Add CSS for the pulse animation and mobile optimizations
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
        
        /* Mobile optimization styles */
        @media (max-width: 768px) {
          .mobile-compact-header {
            padding: 0.5rem 0;
          }
          .mobile-nav {
            font-size: 0.875rem;
            display: flex;
            align-items: center;
            padding: 0.5rem 0;
            overflow-x: auto;
            white-space: nowrap;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          .mobile-nav::-webkit-scrollbar {
            display: none;
          }
          .mobile-controls {
            flex-wrap: wrap;
            gap: 0.5rem;
          }
          .mobile-controls > button {
            padding: 0.375rem 0.625rem;
            font-size: 0.75rem;
          }
          .mobile-vocabulary-toggle {
            position: fixed;
            bottom: 1rem;
            right: 1rem;
            z-index: 50;
            border-radius: 9999px;
            padding: 0.75rem;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .mobile-vocabulary-panel {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            max-height: 40vh;
            z-index: 40;
            border-top-left-radius: 1rem;
            border-top-right-radius: 1rem;
            box-shadow: 0 -4px 6px rgba(0, 0, 0, 0.1);
            overflow-y: auto;
            opacity: 1;
            backdrop-filter: blur(8px);
          }
          /* Add a visual cue for tappable paragraphs on mobile */
          .prose .relative {
            position: relative;
          }
          .prose .relative::after {
            content: '';
            position: absolute;
            right: -8px;
            top: 50%;
            transform: translateY(-50%);
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background-color: var(--color-primary-500);
            opacity: 0.6;
          }
          /* Highlight the active paragraph more prominently on mobile */
          .prose .relative:has(.pulse-animation) {
            background-color: rgba(var(--color-primary-500-rgb), 0.05);
            border-radius: 0.25rem;
            padding-left: 0.5rem;
          }
        }
      `;
      document.head.appendChild(style);
      
      return () => {
        document.head.removeChild(style);
      };
    }
  }, []);

  // Add state for mobile vocabulary panel
  const [showMobileVocabulary, setShowMobileVocabulary] = useState<boolean>(false);
  
  // Toggle mobile vocabulary panel
  const toggleMobileVocabulary = useCallback(() => {
    setShowMobileVocabulary(prev => !prev);
  }, []);
  
  // Add refs for speed selector dropdowns
  const topSpeedSelectorRef = useRef<HTMLDivElement>(null);
  const mobileSpeedSelectorRef = useRef<HTMLDivElement>(null);
  const floatingSpeedSelectorRef = useRef<HTMLDivElement>(null);
  
  // Add refs for speed selector buttons to exclude them from the click-outside handler
  const topSpeedButtonRef = useRef<HTMLButtonElement>(null);
  const mobileSpeedButtonRef = useRef<HTMLButtonElement>(null);
  const floatingSpeedButtonRef = useRef<HTMLButtonElement>(null);

  // Add click outside effect to close speed selector
  useEffect(() => {
    if (!showSpeedSelector) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      // Check if the click was on any of the speed buttons (which should toggle, not close)
      const isSpeedButton = 
        topSpeedButtonRef.current?.contains(event.target as Node) ||
        mobileSpeedButtonRef.current?.contains(event.target as Node) ||
        floatingSpeedButtonRef.current?.contains(event.target as Node);
      
      // If it's a speed button click, let the toggle handler manage it
      if (isSpeedButton) return;
      
      // Check if the click was outside all dropdowns
      const isOutsideTopSelector = !topSpeedSelectorRef.current?.contains(event.target as Node);
      const isOutsideMobileSelector = !mobileSpeedSelectorRef.current?.contains(event.target as Node);
      const isOutsideFloatingSelector = !floatingSpeedSelectorRef.current?.contains(event.target as Node);
      
      // If click is outside all selectors, close the dropdown
      if (isOutsideTopSelector && isOutsideMobileSelector && isOutsideFloatingSelector) {
        setShowSpeedSelector(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSpeedSelector]);

  // Add CSS for the speed selector dropdown
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
        
        /* Speed selector styles */
        .speed-selector-dropdown {
          position: relative;
          z-index: 100;
          background: white;
          border-radius: 0.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        
        .dark .speed-selector-dropdown {
          background: #1e293b;
        }
        
        .speed-selector-dropdown::after {
          content: '';
          position: absolute;
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 8px solid white;
        }
        
        .dark .speed-selector-dropdown::after {
          border-top-color: #1e293b;
        }
        
        .floating-speed-dropdown {
          position: absolute;
          bottom: calc(100% + 16px);
          left: 50%;
          transform: translateX(-50%);
          background: white;
          border-radius: 0.75rem;
          padding: 0.75rem;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          min-width: 180px;
          z-index: 100;
        }
        
        .dark .floating-speed-dropdown {
          background: #1e293b;
        }
        
        /* Add style to ensure clickable area at the bottom */
        .floating-speed-dropdown::before {
          content: '';
          position: absolute;
          bottom: -16px;
          left: 0;
          right: 0;
          height: 16px;
          background: transparent;
        }
        
        .floating-speed-dropdown .grid-cols-2 {
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }
        
        .floating-speed-dropdown button {
          padding: 8px 12px;
          border-radius: 6px;
          font-weight: 500;
          transition: all 0.2s ease;
          background-color: #f8fafc;
        }
        
        .dark .floating-speed-dropdown button {
          background-color: #334155;
        }
        
        .floating-speed-dropdown button:hover {
          transform: translateY(-1px);
        }
        
        .floating-speed-dropdown button.active {
          background-color: #dbeafe;
          color: #1d4ed8;
        }
        
        .dark .floating-speed-dropdown button.active {
          background-color: #1e3a8a;
          color: #93c5fd;
        }
        
        .top-speed-dropdown {
          position: absolute;
          top: calc(100% + 5px);
          right: 0;
          background: white;
          border-radius: 0.5rem;
          padding: 0.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          min-width: 140px;
          z-index: 100;
        }
        
        .dark .top-speed-dropdown {
          background: #1e293b;
        }
        
        .top-speed-dropdown::after {
          content: '';
          position: absolute;
          top: -8px;
          right: 16px;
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-bottom: 8px solid white;
        }
        
        .dark .top-speed-dropdown::after {
          border-bottom-color: #1e293b;
        }
        
        .mobile-speed-dropdown {
          position: absolute;
          bottom: calc(100% + 5px);
          right: 0;
          background: white;
          border-radius: 0.5rem;
          padding: 0.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          min-width: 140px;
          z-index: 100;
        }
        
        .dark .mobile-speed-dropdown {
          background: #1e293b;
        }
        
        .mobile-speed-dropdown::after {
          content: '';
          position: absolute;
          bottom: -8px;
          right: 16px;
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 8px solid white;
        }
        
        .dark .mobile-speed-dropdown::after {
          border-top-color: #1e293b;
        }
        
        /* Mobile optimization styles */
        @media (max-width: 768px) {
          .mobile-compact-header {
            padding: 0.5rem 0;
          }
          .mobile-nav {
            font-size: 0.875rem;
            display: flex;
            align-items: center;
            padding: 0.5rem 0;
            overflow-x: auto;
            white-space: nowrap;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          .mobile-nav::-webkit-scrollbar {
            display: none;
          }
          .mobile-controls {
            flex-wrap: wrap;
            gap: 0.5rem;
          }
          .mobile-controls > button {
            padding: 0.375rem 0.625rem;
            font-size: 0.75rem;
          }
          .mobile-vocabulary-toggle {
            position: fixed;
            bottom: 1rem;
            right: 1rem;
            z-index: 50;
            border-radius: 9999px;
            padding: 0.75rem;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .mobile-vocabulary-panel {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            max-height: 40vh;
            z-index: 40;
            border-top-left-radius: 1rem;
            border-top-right-radius: 1rem;
            box-shadow: 0 -4px 6px rgba(0, 0, 0, 0.1);
            overflow-y: auto;
            opacity: 1;
            backdrop-filter: blur(8px);
          }
          /* Add a visual cue for tappable paragraphs on mobile */
          .prose .relative {
            position: relative;
          }
          .prose .relative::after {
            content: '';
            position: absolute;
            right: -8px;
            top: 50%;
            transform: translateY(-50%);
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background-color: var(--color-primary-500);
            opacity: 0.6;
          }
          /* Highlight the active paragraph more prominently on mobile */
          .prose .relative:has(.pulse-animation) {
            background-color: rgba(var(--color-primary-500-rgb), 0.05);
            border-radius: 0.25rem;
            padding-left: 0.5rem;
          }
        }
      `;
      document.head.appendChild(style);
      
      return () => {
        document.head.removeChild(style);
      };
    }
  }, []);
  
  // Update loopModeRef whenever loopMode changes
  useEffect(() => {
    loopModeRef.current = loopMode;
  }, [loopMode]);

  // Scroll to the paragraph corresponding to currentParagraphId when it changes
  useEffect(() => {
    if (!currentParagraphId) return;

    const el = paragraphRefs.current.get(currentParagraphId);
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const fullyVisible = rect.top >= 0 &&
                         rect.bottom <= (window.innerHeight || document.documentElement.clientHeight);
    if (fullyVisible) return;

    el.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
  }, [currentParagraphId]);
  
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      {/* Mobile-optimized header navigation */}
      <div className="mobile-nav md:hidden bg-secondary-100 dark:bg-secondary-900 -mx-4 px-4 mb-4">
        <Link href="/" className="text-primary-600 dark:text-primary-400 mr-2">首页</Link>
        <span className="text-secondary-400 mx-1">/</span>
        <Link href="/library" className="text-primary-600 dark:text-primary-400 mr-2">书库</Link>
        <span className="text-secondary-400 mx-1">/</span>
        <span className="text-secondary-600 dark:text-secondary-400 truncate">{chapterTitle}</span>
      </div>
      
      {/* Desktop header - hidden on mobile */}
      <div className="mb-6 hidden md:flex justify-between items-center">
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
          {isAudioEnabled && currentParagraphId && (
            <div className="flex items-center space-x-2">
              {/* Loading indicator */}
              {isLoading && (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary-600 dark:border-primary-300"></div>
              )}
              
              {/* Play/Pause button */}
              <button
                onClick={() => isPlaying ? pauseTTS() : resumeTTS()}
                className="p-2 rounded-md text-white text-sm hover:bg-primary-700 dark:hover:bg-primary-600 disabled:opacity-50"
                style={{ backgroundColor: '#e2e8f0' }}
                aria-label={isPlaying ? "Pause" : "Resume"}
                title={isPlaying ? "暂停朗读" : "继续朗读"}
                disabled={isLoading}
              >
                {isPlaying ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="black" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="#3B82F6" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </button>
              
              {/* Loop Mode Toggle Button */}
              <button
                onClick={togglePlaybackMode}
                className="p-2 rounded-md text-secondary-800 dark:text-secondary-200 hover:bg-secondary-300 dark:hover:bg-secondary-600 disabled:opacity-50"
                style={{ backgroundColor: '#e2e8f0' }}
                aria-label={loopMode ? "Sequential Mode" : "Loop Mode"}
                title={loopMode ? "顺序播放" : "循环播放当前段落"}
                disabled={isLoading}
              >
                {loopMode ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="#3B82F6" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="#64748b" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                )}
              </button>
              
              {/* Playback Speed Dropdown */}
              <div className="relative">
                <button
                  ref={topSpeedButtonRef}
                  onClick={toggleSpeedSelector}
                  className="px-2 py-1 rounded-md text-secondary-800 dark:text-secondary-200 bg-secondary-200 hover:bg-secondary-300 dark:bg-secondary-700 dark:hover:bg-secondary-600 text-sm"
                  disabled={isLoading}
                >
                  {playbackSpeed}x
                </button>
                
                {showSpeedSelector && (
                  <div 
                    ref={topSpeedSelectorRef}
                    className="top-speed-dropdown"
                  >
                    <div className="grid grid-cols-3 gap-1">
                      {[0.5, 1, 1.5, 2, 2.5, 3].map(speed => (
                        <button
                          key={speed}
                          onClick={() => changePlaybackSpeed(speed)}
                          className={`px-2 py-1 rounded text-xs ${
                            playbackSpeed === speed 
                              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300 font-medium' 
                              : 'hover:bg-secondary-100 dark:hover:bg-secondary-700 text-secondary-700 dark:text-secondary-300'
                          }`}
                        >
                          {speed}x
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Stop TTS button */}
              <button
                onClick={stopTTS}
                className="p-2 rounded-md text-secondary-800 dark:text-secondary-200 hover:bg-secondary-300 dark:hover:bg-secondary-600 disabled:opacity-50"
                style={{ backgroundColor: '#e2e8f0' }}
                aria-label="Stop"
                title="停止朗读"
                disabled={isLoading}
              >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="#64748b" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
              </button>
            </div>
          )}
          
          <button
            onClick={toggleLanguage}
            className="px-3 py-1 rounded-md bg-primary-600 dark:bg-primary-500 dark:bg-secondary-800 text-white dark:text-secondary-200 text-sm hover:bg-primary-700 dark:hover:bg-primary-600"
          >
            {showBoth ? '仅显示英文' : showEnglish ? '仅显示中文' : '双语对照'}
          </button>
          {(bookId === '8' || bookId === '9') && (
            <button
              onClick={toggleVocabulary}
              className={`px-3 py-1 rounded-md text-secondary-700 text-sm ${showVocabulary ? 'bg-yellow-200 hover:bg-yellow-300 dark:bg-yellow-700 dark:hover:bg-yellow-600' : 'bg-secondary-200 hover:bg-secondary-300 dark:bg-secondary-700 dark:hover:bg-secondary-600'}`}
            >
              {showVocabulary ? '隐藏词汇' : '显示词汇'}
            </button>
          )}
        </div>
      </div>
      
      {/* Mobile controls - visible only on mobile */}
      <div className="md:hidden mb-4">
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-xl font-serif font-bold text-secondary-900 dark:text-secondary-100 truncate">{chapterTitle}</h1>
          <div className="flex items-center space-x-2">
            <button
              onClick={decreaseFontSize}
              className="p-1 rounded-md text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-800"
              aria-label="Decrease font size"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </button>
            <span className="text-xs text-secondary-600 dark:text-secondary-400">{fontSize}px</span>
            <button
              onClick={increaseFontSize}
              className="p-1 rounded-md text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-800"
              aria-label="Increase font size"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 01-1 1h-3a1 1 0 110-2h3V8a1 1 0 011-1v3z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="mobile-controls flex flex-wrap gap-2">
          <button
            onClick={toggleLanguage}
            className="flex-1 px-2 py-1 rounded-md bg-primary-600 dark:bg-primary-500 dark:bg-secondary-800 text-white dark:text-secondary-200 text-xs hover:bg-primary-700 dark:hover:bg-primary-600"
          >
            {showBoth ? '仅英文' : showEnglish ? '仅中文' : '双语'}
          </button>
          
          {/* Vocab toggle for Little Prince and Madame Bovary */}
          {(bookId === '8' || bookId === '9') && (
            <button
              onClick={toggleVocabulary}
              className={`px-2 py-1 rounded-md text-secondary-700 text-xs ${showVocabulary ? 'bg-yellow-200 hover:bg-yellow-300 dark:bg-yellow-700 dark:hover:bg-yellow-600' : 'bg-secondary-200 hover:bg-secondary-300 dark:bg-secondary-700 dark:hover:bg-secondary-600'}`}
            >
              {showVocabulary ? '隐藏词汇' : '显示词汇'}
            </button>
          )}
          
          {/* TTS controls */}
          {isAudioEnabled && currentParagraphId && (
            <div className="flex items-center space-x-1">
              {isLoading && (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary-600 dark:border-primary-300"></div>
              )}
              <button
                onClick={() => isPlaying ? pauseTTS() : resumeTTS()}
                className="px-2 py-1 rounded-md bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-800 disabled:opacity-50 text-xs"
                disabled={isLoading}
              >
                {isPlaying ? "暂停" : "播放"}
              </button>
              <button
                onClick={stopTTS}
                className="px-2 py-1 rounded-md bg-secondary-100 text-secondary-600 dark:bg-secondary-800 dark:text-secondary-300 hover:bg-secondary-200 dark:hover:bg-secondary-700 disabled:opacity-50 text-xs"
                disabled={isLoading}
              >
                停止
              </button>
              
              {/* Mobile Loop Mode Toggle Button */}
              <button
                onClick={togglePlaybackMode}
                className={`px-2 py-1 rounded-md text-xs ${
                  loopMode 
                    ? 'bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-800' 
                    : 'bg-secondary-100 text-secondary-600 dark:bg-secondary-800 dark:text-secondary-300 hover:bg-secondary-200 dark:hover:bg-secondary-700'
                }`}
                disabled={isLoading}
              >
                {loopMode ? "循环" : "顺序"}
              </button>
              
              {/* Mobile Playback Speed Button */}
              <div className="relative">
                <button
                  ref={mobileSpeedButtonRef}
                  onClick={toggleSpeedSelector}
                  className="px-2 py-1 rounded-md bg-secondary-100 text-secondary-600 dark:bg-secondary-800 dark:text-secondary-300 hover:bg-secondary-200 dark:hover:bg-secondary-700 disabled:opacity-50 text-xs"
                  disabled={isLoading}
                >
                  {playbackSpeed}x
                </button>
                
                {showSpeedSelector && (
                  <div 
                    ref={mobileSpeedSelectorRef}
                    className="mobile-speed-dropdown"
                  >
                    <div className="grid grid-cols-3 gap-1">
                      {[0.5, 1, 1.5, 2, 2.5, 3].map(speed => (
                        <button
                          key={speed}
                          onClick={() => changePlaybackSpeed(speed)}
                          className={`px-2 py-1 rounded text-xs ${
                            playbackSpeed === speed 
                              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300 font-medium' 
                              : 'hover:bg-secondary-100 dark:hover:bg-secondary-700 text-secondary-700 dark:text-secondary-300'
                          }`}
                        >
                          {speed}x
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex md:gap-10">  
        <div className="prose prose-lg flex-grow" style={{ fontSize: `${fontSize}px` }}>
          {content.map((item) => {
            // Get vocabulary for this paragraph
            // This is important because the vocabulary is used in both English and Chinese display
            const supportedBookIds = ['7', '8', '9']; // Add '7' here
            const isVocabBook = supportedBookIds.includes(bookId);
            const vocabulary = isVocabBook && showVocabulary ? vocabularyItems[item.id] || [] : [];
            const hasVocabulary = vocabulary.length > 0;
            
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
                    onClick={(e) => handleParagraphTap(item.id, e)}
                  >
                    <p className="text-secondary-900 dark:text-secondary-100 leading-relaxed">
                      {isVocabBook && showVocabulary ? (
                        vocabulary.length > 0 ? (
                          <>
                            {highlightText(item.english, vocabulary, true)}
                          </>
                        ) : (
                          <>
                            {item.english}
                          </>
                        )
                      ) : item.english}
                    </p>
                    
                    {/* Play button that appears on hover - only on desktop */}
                    {isAudioEnabled && hoverParagraphId === item.id && !isPlaying && currentParagraphId !== item.id && (
                      <button 
                        onClick={(e) => {
                          handleParagraphTap(item.id, e);
                        }}
                        className="absolute right-0 top-0 bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-300 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden md:block"
                        aria-label="Play paragraph"
                        title="从此段开始朗读"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="black" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        </svg>
                      </button>
                    )}
                    
                    {/* Add play/pause button for currently playing paragraph */}
                    {isAudioEnabled && currentParagraphId === item.id && isPlaying && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          pauseTTS();
                        }}
                        className="absolute right-0 top-0 bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-300 rounded-full p-1 opacity-80 group-hover:opacity-100 transition-opacity duration-200 z-10"
                        aria-label="Pause paragraph"
                        title="暂停朗读"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="black" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6" />
                        </svg>
                      </button>
                    )}
                    
                    {/* Current playing indicator */}
                    {isAudioEnabled && currentParagraphId === item.id && (
                      <div className="absolute left-0 top-0 h-full w-1 bg-primary-500 rounded-full pulse-animation"></div>
                    )}
                  </div>
                )}

                {(showBoth || !showEnglish) && (
                  <p className="text-secondary-700 dark:text-secondary-300 leading-relaxed">
                    {isVocabBook && showVocabulary ? (
                      vocabulary.length > 0 ? (
                        <>
                          {highlightText(item.chinese, vocabulary, false)}
                        </>
                      ) : (
                        <>
                          {item.chinese}
                        </>
                      )
                    ) : item.chinese}
                  </p>
                )}

                {/* 显示图片，如果存在 - 移动到中文文本后面显示 */}
                {item.image && (
                  <div className="my-4 flex justify-center">
                    <Image 
                      src={item.image} 
                      alt="Book illustration" 
                      className="max-w-full rounded-md shadow-md"
                      width={500}
                      height={400}
                      style={{ maxHeight: '400px', objectFit: 'contain' }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Desktop Vocabulary sidebar - hidden on mobile */}
        {showVocabulary && Object.keys(vocabularyItems).length > 0 && (
          <div className="hidden md:block w-64 shrink-0 border-l border-secondary-200 dark:border-secondary-800 pl-6 ml-2 sticky top-8 max-h-screen overflow-y-auto pb-8">
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
      
      {/* Floating play controls for both mobile and desktop */}
      {isAudioEnabled && currentParagraphId && showFloatingControls && (
        <div 
          className="fixed bottom-16 md:bottom-8 left-1/2 transform -translate-x-1/2 rounded-full shadow-md p-2 flex items-center space-x-2 z-50 transition-opacity duration-300 opacity-90" 
          style={{ backgroundColor: 'rgba(248, 250, 252, 0.95)', backdropFilter: 'blur(4px)' }}
        >
          {/* Loading indicator */}
          {isLoading && (
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-600 dark:border-primary-300"></div>
          )}
          
          {/* Play/Pause button */}
          <button
            onClick={() => isPlaying ? pauseTTS() : resumeTTS()}
            className="p-2 rounded-full flex items-center justify-center"
            style={{ backgroundColor: '#e2e8f0' }}
            aria-label={isPlaying ? "Pause" : "Resume"}
            title={isPlaying ? "暂停朗读" : "继续朗读"}
            disabled={isLoading}
          >
            {isPlaying ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="black" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="#3B82F6" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </button>
          
          {/* Loop Mode Toggle Button */}
          <button
            onClick={togglePlaybackMode}
            className="p-2 rounded-full flex items-center justify-center"
            style={{ backgroundColor: '#e2e8f0' }}
            aria-label={loopMode ? "Sequential Mode" : "Loop Mode"}
            title={loopMode ? "顺序播放" : "循环播放当前段落"}
            disabled={isLoading}
          >
            {loopMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="#3B82F6" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="#64748b" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            )}
          </button>
          
          {/* Playback Speed Selector Button */}
          <div className="relative">
            <button
              ref={floatingSpeedButtonRef}
              onClick={toggleSpeedSelector}
              className="p-2 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#e2e8f0' }}
              aria-label="Playback Speed"
              title="播放速度"
              disabled={isLoading}
            >
              <span className="text-sm font-medium text-secondary-800">{playbackSpeed}x</span>
            </button>
            
            {/* Speed Selector Dropdown */}
            {showSpeedSelector && (
              <div 
                ref={floatingSpeedSelectorRef}
                className="floating-speed-dropdown"
              >
                <div className="grid grid-cols-2 gap-2">
                  {[0.5, 1, 1.5, 2, 2.5, 3].map(speed => (
                    <button
                      key={speed}
                      onClick={() => changePlaybackSpeed(speed)}
                      className={playbackSpeed === speed ? 'active' : ''}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Stop TTS button */}
          <button
            onClick={stopTTS}
            className="p-2 rounded-full flex items-center justify-center"
            style={{ backgroundColor: '#e2e8f0' }}
            aria-label="Stop"
            title="停止朗读"
            disabled={isLoading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="#64748b" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
            </svg>
          </button>
        </div>
      )}
      
      {/* Mobile vocabulary floating button - only on mobile and when vocabulary is available */}
      {(bookId === '8' || bookId === '9') && showVocabulary && Object.keys(vocabularyItems).length > 0 && (
        <button 
          onClick={toggleMobileVocabulary}
          className="md:hidden mobile-vocabulary-toggle bg-yellow-400 dark:bg-yellow-600 text-secondary-900 dark:text-secondary-100"
        >
          {showMobileVocabulary ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      )}
      
      {/* Mobile vocabulary bottom panel */}
      {showMobileVocabulary && showVocabulary && (bookId === '8' || bookId === '9') && Object.keys(vocabularyItems).length > 0 && (
        <div className="md:hidden mobile-vocabulary-panel bg-secondary-50 dark:bg-secondary-900 p-4" style={{ backgroundColor: 'var(--bg-secondary-50, #f9fafb)', opacity: 1 }}>
          <div className="space-y-3">
            {visibleParagraphs.size > 0 ? (
              Array.from(visibleParagraphs)
                .sort((a, b) => {
                  const aNum = parseInt(a.split('-')[3], 10);
                  const bNum = parseInt(b.split('-')[3], 10);
                  return aNum - bNum;
                })
                .filter(paragraphId => vocabularyItems[paragraphId] && vocabularyItems[paragraphId].length > 0)
                .map(paragraphId => (
                  <div key={paragraphId} className="border-b border-secondary-200 dark:border-secondary-800 pb-2">
                    <ul className="space-y-2">
                      {vocabularyItems[paragraphId].map((word, index) => (
                        <li key={index} className="p-2 bg-white dark:bg-secondary-800 rounded shadow-sm">
                          <div className="font-medium text-secondary-900 dark:text-secondary-100">{word.raw_en} - {word.raw_cn}</div>
                          <div className="text-xs text-secondary-600 dark:text-secondary-400">{word.en} - {word.cn}</div>
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
  );
} 