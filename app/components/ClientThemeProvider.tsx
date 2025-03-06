'use client';

import { ReactNode } from 'react';
import ThemeProvider from './ThemeProvider';

export default function ClientThemeProvider({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
} 