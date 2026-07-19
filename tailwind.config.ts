import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Vazirmatn FD', 'Vazirmatn', 'Tahoma', 'sans-serif'],
      },
      colors: {
        background: '#F4F7F8',
        foreground: '#0C272E',
        primary: {
          DEFAULT: '#0E7C86',
          foreground: '#FFFFFF',
        },
        sidebar: {
          DEFAULT: '#0B333B',
          hover: '#11424C',
          active: '#0E7C86',
          foreground: '#C8D8DC',
        },
        muted: {
          DEFAULT: '#E8EEF0',
          foreground: '#5B6B70',
        },
        destructive: {
          DEFAULT: '#D03B3B',
          foreground: '#FFFFFF',
        },
        border: '#DDE6E9',
        card: '#FFFFFF',
      },
      borderRadius: {
        lg: '0.75rem',
        md: '0.5rem',
      },
    },
  },
  plugins: [],
};

export default config;
