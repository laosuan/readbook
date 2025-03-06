'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Footer() {
  const [mounted, setMounted] = useState(false);
  const [year, setYear] = useState(2024);

  useEffect(() => {
    setMounted(true);
    setYear(new Date().getFullYear());
  }, []);

  // If not mounted yet, render a simplified footer to prevent hydration issues
  if (!mounted) {
    return (
      <footer className="bg-card-light dark:bg-card-dark border-t border-secondary-100 dark:border-secondary-800">
        <div className="max-w-7xl mx-auto py-12 px-4 overflow-hidden sm:px-6 lg:px-8">
          <p className="mt-8 text-center text-base text-secondary-500 dark:text-secondary-400">
            &copy; 2024 阅词名著. 保留所有权利.
          </p>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-card-light dark:bg-card-dark border-t border-secondary-100 dark:border-secondary-800">
      <div className="max-w-7xl mx-auto pt-12 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-primary dark:text-primary-light">
                <path d="M11.25 4.533A9.707 9.707 0 0 0 6 3a9.735 9.735 0 0 0-3.25.555.75.75 0 0 0-.5.707v14.25a.75.75 0 0 0 1 .707A8.237 8.237 0 0 1 6 18.75c1.995 0 3.823.707 5.25 1.886V4.533ZM12.75 20.636A8.214 8.214 0 0 1 18 18.75c.966 0 1.89.166 2.75.47a.75.75 0 0 0 1-.708V4.262a.75.75 0 0 0-.5-.707A9.735 9.735 0 0 0 18 3a9.707 9.707 0 0 0-5.25 1.533v16.103Z" />
              </svg>
              <span className="ml-2 text-xl font-serif font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent dark:from-primary-light dark:to-accent">阅词名著</span>
            </div>
            <p className="mt-4 text-sm text-secondary-600 dark:text-secondary-400 max-w-xs">
              中英对照阅读经典名著，提升您的英语阅读能力，感受文学的魅力。
            </p>
            <div className="mt-6 flex space-x-6">
              <a href="#" className="text-secondary-500 dark:text-secondary-400 hover:text-primary dark:hover:text-primary-light transition-colors duration-300">
                <span className="sr-only">微信</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M9.5,4C5.36,4 2,6.69 2,10C2,11.89 3.08,13.56 4.78,14.66L4,17L6.5,15.5C7.39,15.81 8.37,16 9.41,16C9.15,15.37 9,14.7 9,14C9,10.69 12.13,8 16,8C16.19,8 16.38,8 16.56,8.03C15.54,5.69 12.78,4 9.5,4M6.5,6.5A1,1 0 0,1 7.5,7.5A1,1 0 0,1 6.5,8.5A1,1 0 0,1 5.5,7.5A1,1 0 0,1 6.5,6.5M11.5,6.5A1,1 0 0,1 12.5,7.5A1,1 0 0,1 11.5,8.5A1,1 0 0,1 10.5,7.5A1,1 0 0,1 11.5,6.5M16,9C13.24,9 11,11.24 11,14C11,16.76 13.24,19 16,19C16.67,19 17.31,18.85 17.89,18.61L20,20L19.38,18.13C20.38,17.29 21,15.7 21,14C21,11.24 18.76,9 16,9M14,11.5A1,1 0 0,1 15,12.5A1,1 0 0,1 14,13.5A1,1 0 0,1 13,12.5A1,1 0 0,1 14,11.5M18,11.5A1,1 0 0,1 19,12.5A1,1 0 0,1 18,13.5A1,1 0 0,1 17,12.5A1,1 0 0,1 18,11.5Z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-secondary-500 dark:text-secondary-400 hover:text-primary dark:hover:text-primary-light transition-colors duration-300">
                <span className="sr-only">微博</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M10.9,18.3C6.5,18.3 3,16.4 3,13.9C3,12.7 3.7,11.3 5.2,10.3C7.2,8.9 10.1,8.5 12.4,9.4C13.2,9.7 14.8,10.4 14.6,11.7C14.5,12.4 13.7,12.7 13.1,12.4C12.8,12.3 12.6,12 12.6,11.7C12.6,11.5 12.6,11.3 12.5,11.2C11.9,9.8 9.2,9.8 7.7,10.5C6.6,11 5.7,11.8 5.7,12.7C5.7,14.7 8.7,16.1 12,15.8C14.8,15.6 17,14.1 17.5,12.3C17.8,11.2 17.4,10.1 16.7,9.3C16.4,8.9 16.2,8.5 16.2,8C16.2,7.5 16.7,7 17.2,7C17.8,7 18.3,7.4 18.6,7.8C19.7,9.2 20.1,10.8 19.8,12.5C19.1,15.6 15.8,18.2 11.6,18.3C11.4,18.3 11.1,18.3 10.9,18.3M17.5,5.5C17.5,6.1 17,6.6 16.4,6.6C15.8,6.6 15.3,6.1 15.3,5.5C15.3,4.9 15.8,4.4 16.4,4.4C17,4.4 17.5,4.9 17.5,5.5M20.2,5.5C20.2,6.1 19.7,6.6 19.1,6.6C18.5,6.6 18,6.1 18,5.5C18,4.9 18.5,4.4 19.1,4.4C19.7,4.4 20.2,4.9 20.2,5.5Z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-secondary-500 dark:text-secondary-400 hover:text-primary dark:hover:text-primary-light transition-colors duration-300">
                <span className="sr-only">GitHub</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
          
          <div className="col-span-1">
            <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase">导航</h3>
            <ul className="mt-4 space-y-3">
              {[
                { name: '首页', href: '/' },
                { name: '书库', href: '/library' },
                { name: '关于我们', href: '/about' },
              ].map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="text-base text-secondary-600 dark:text-secondary-400 hover:text-primary dark:hover:text-primary-light transition-colors duration-300">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="col-span-1">
            <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase">法律</h3>
            <ul className="mt-4 space-y-3">
              {[
                { name: '使用条款', href: '/terms' },
                { name: '隐私政策', href: '/privacy' },
                { name: '版权声明', href: '/copyright' },
              ].map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="text-base text-secondary-600 dark:text-secondary-400 hover:text-primary dark:hover:text-primary-light transition-colors duration-300">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="col-span-1">
            <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase">联系我们</h3>
            <ul className="mt-4 space-y-3">
              <li className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-secondary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a href="mailto:contact@yueciminzhu.com" className="text-secondary-600 dark:text-secondary-400 hover:text-primary dark:hover:text-primary-light transition-colors duration-300">
                  contact@yueciminzhu.com
                </a>
              </li>
              <li className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-secondary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <span className="text-secondary-600 dark:text-secondary-400">
                  +86 123 4567 8910
                </span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-secondary-100 dark:border-secondary-800">
          <p className="text-center text-sm text-secondary-500 dark:text-secondary-400">
            &copy; {year} 阅词名著. 保留所有权利.
          </p>
        </div>
      </div>
    </footer>
  );
} 