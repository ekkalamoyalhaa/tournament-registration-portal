import type { Config } from 'tailwindcss';

// Tokens transcribed from design.md ("Glassmorphism", v.alpha)
const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // design.md front-matter colors
        primary: '#0080FF', // Electric Blue
        secondary: '#8B00FF', // Neon Purple
        tertiary: '#FF1493', // Vivid Pink
        neutral: '#20B2AA', // Teal
        // surfaces — glass panels sit on a vibrant background, never pure black
        ink: '#14161A', // off-black, not #000
        glass: {
          DEFAULT: 'rgba(255,255,255,0.15)',
          light: 'rgba(255,255,255,0.30)',
          dark: 'rgba(255,255,255,0.10)',
          border: 'rgba(255,255,255,0.20)',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        hero: 'clamp(2.5rem, 5vw, 4rem)',
        h1: '2.25rem',
        h2: '1.5rem',
        body: '1rem',
        small: '0.875rem',
        'label-caps': '0.75rem',
      },
      spacing: {
        section: 'clamp(4rem, 8vw, 8rem)',
      },
      borderRadius: {
        base: '4px',
        control: '0.5rem', // buttons, cards
      },
      backdropBlur: {
        glass: '16px', // within the 10-20px range from design.md
      },
      boxShadow: {
        card: '0 2px 12px rgba(0,0,0,0.06)',
        lift: '0 8px 24px rgba(0,0,0,0.12)',
      },
      transitionDuration: {
        DEFAULT: '250ms',
      },
      zIndex: {
        base: '0',
        'sticky-nav': '100',
        overlay: '200',
        modal: '300',
        toast: '500',
      },
      maxWidth: {
        container: '1280px',
      },
    },
  },
  plugins: [],
};

export default config;
