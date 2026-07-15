import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Vazirmatn', 'Tahoma', 'sans-serif'],
      },
      colors: {
        background: 'hsl(220 20% 97%)',
        foreground: 'hsl(224 30% 12%)',
        primary: {
          DEFAULT: 'hsl(221 70% 45%)',
          foreground: 'hsl(0 0% 100%)',
        },
        muted: {
          DEFAULT: 'hsl(220 15% 92%)',
          foreground: 'hsl(220 10% 42%)',
        },
        destructive: {
          DEFAULT: 'hsl(0 72% 48%)',
          foreground: 'hsl(0 0% 100%)',
        },
        border: 'hsl(220 15% 86%)',
        card: 'hsl(0 0% 100%)',
      },
      borderRadius: {
        lg: '0.6rem',
        md: '0.45rem',
      },
    },
  },
  plugins: [],
};

export default config;
