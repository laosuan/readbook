/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f2ff',
          100: '#cce4ff',
          200: '#99c9ff',
          300: '#66adff',
          400: '#3392ff',
          500: '#0077ed', // macOS blue
          600: '#0066cc', // iOS blue
          700: '#0051a8',
          800: '#003d80',
          900: '#002855',
          950: '#001c40',
        },
        secondary: {
          50: '#f5f5f7', // macOS light background
          100: '#e5e5e7', // macOS light border
          200: '#d2d2d7',
          300: '#b0b0b8',
          400: '#98989d',
          500: '#8e8e93', // iOS gray
          600: '#6e6e73', // macOS secondary text
          700: '#636366', // iOS dark gray
          800: '#3a3a3c', // macOS dark border
          900: '#2c2c2e', // macOS dark card background
          950: '#1d1d1f', // macOS dark background
        },
        accent: '#f56300', // macOS/iOS orange
        success: '#34c759', // iOS green
        warning: '#ff9f0a', // iOS orange
        error: '#ff3b30', // iOS red
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        serif: ['Merriweather', 'serif'],
      },
      backgroundColor: {
        'light': 'var(--background)',
        'dark': 'var(--background)',
        'card-light': 'var(--card-background)',
        'card-dark': 'var(--card-background)',
      },
      textColor: {
        'light': 'var(--foreground)',
        'dark': 'var(--foreground)',
      },
      borderColor: {
        'light': 'var(--card-border)',
        'dark': 'var(--card-border)',
      },
    },
  },
  plugins: [],
  darkMode: 'class', // Enable dark mode with class
} 