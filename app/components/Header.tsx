'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useTheme } from './ThemeProvider';

// 添加Theme类型定义
type Theme = 'light' | 'dark' | 'system';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [fallbackTheme, setFallbackTheme] = useState<Theme>('system');
  
  // 获取主题上下文，如果上下文不可用则使用本地状态
  const themeContext = useTheme();
  
  // 确定要使用的主题和设置主题的函数
  const theme = themeContext?.theme || fallbackTheme;
  const setTheme = (newTheme: Theme) => {
    if (themeContext?.setTheme) {
      themeContext.setTheme(newTheme);
    } else {
      setFallbackTheme(newTheme);
    }
  };

  // Handle mounting to prevent hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  const getThemeIcon = () => {
    if (theme === 'light') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
        </svg>
      );
    } else if (theme === 'dark') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
        </svg>
      );
    } else {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25" />
        </svg>
      );
    }
  };

  if (!mounted) {
    return (
      <header className="fixed w-full top-0 z-50 bg-card-light/80 dark:bg-card-dark/80 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex-shrink-0 flex items-center">
                <span className="text-2xl font-serif font-bold text-primary-600 dark:text-primary-500">阅词名著</span>
              </Link>
            </div>
          </div>
        </div>
      </header>
    );
  }

  const headerClasses = scrolled 
    ? "fixed w-full top-0 z-50 bg-card-light/80 dark:bg-card-dark/80 backdrop-blur-lg shadow-md transition-all duration-300" 
    : "fixed w-full top-0 z-50 bg-card-light/60 dark:bg-card-dark/60 backdrop-blur-sm transition-all duration-300";

  return (
    <header className={headerClasses}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-primary-600 dark:text-primary-500">
                <path d="M11.25 4.533A9.707 9.707 0 0 0 6 3a9.735 9.735 0 0 0-3.25.555.75.75 0 0 0-.5.707v14.25a.75.75 0 0 0 1 .707A8.237 8.237 0 0 1 6 18.75c1.995 0 3.823.707 5.25 1.886V4.533ZM12.75 20.636A8.214 8.214 0 0 1 18 18.75c.966 0 1.89.166 2.75.47a.75.75 0 0 0 1-.708V4.262a.75.75 0 0 0-.5-.707A9.735 9.735 0 0 0 18 3a9.707 9.707 0 0 0-5.25 1.533v16.103Z" />
              </svg>
              <span className="text-2xl font-serif font-bold bg-gradient-to-r from-primary-600 to-accent bg-clip-text text-transparent dark:from-primary-500 dark:to-accent">阅词名著</span>
            </Link>
            <nav className="hidden md:ml-10 md:flex md:space-x-8">
              {[
                { name: '首页', href: '/' },
                { name: '书库', href: '/library' },
                { name: '关于我们', href: '/about' },
              ].map((item) => (
                <Link 
                  key={item.name}
                  href={item.href} 
                  className="relative inline-flex items-center px-1 pt-1 text-sm font-medium text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-500 group"
                >
                  {item.name}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-600 dark:bg-primary-500 transition-all duration-300 group-hover:w-full"></span>
                </Link>
              ))}
            </nav>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <button 
              onClick={toggleTheme}
              className="inline-flex items-center justify-center p-2 rounded-full text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-500 hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors duration-300"
              aria-label="Toggle theme"
            >
              {getThemeIcon()}
            </button>
            <Link href="/login" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-300 shadow-sm">
              登录
            </Link>
          </div>
          
          <div className="flex items-center md:hidden">
            <button
              onClick={toggleTheme}
              className="inline-flex items-center justify-center p-2 rounded-full text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-500 hover:bg-secondary-100 dark:hover:bg-secondary-800 mr-2 transition-colors duration-300"
              aria-label="Toggle theme"
            >
              {getThemeIcon()}
            </button>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-500 hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors duration-300"
              aria-expanded={isMenuOpen ? 'true' : 'false'}
            >
              <span className="sr-only">打开主菜单</span>
              <svg
                className={`${isMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              <svg
                className={`${isMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className={`${isMenuOpen ? 'block' : 'hidden'} md:hidden`}>
        <div className="pt-2 pb-3 space-y-1 bg-card-light dark:bg-card-dark shadow-lg rounded-b-lg">
          {[
            { name: '首页', href: '/' },
            { name: '书库', href: '/library' },
            { name: '关于我们', href: '/about' },
            { name: '登录', href: '/login' }
          ].map((item) => (
            <Link 
              key={item.name}
              href={item.href} 
              className="block pl-3 pr-4 py-2 mx-2 my-1 rounded-md text-base font-medium text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-500 hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors duration-300"
              onClick={() => setIsMenuOpen(false)}
            >
              {item.name}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
} 