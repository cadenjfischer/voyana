import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Map legacy luxury colors to OKLCH token variables for themeability
        'luxury-primary': 'var(--color-primary-600)',
        'luxury-primary-dark': 'var(--color-primary-700)',
        'luxury-secondary': 'var(--color-neutral-800)',
        'luxury-accent': 'var(--color-neutral-200)',
        'luxury-dark': 'var(--color-neutral-900)',
        'luxury-gray': 'var(--color-neutral-500)',
        'luxury-light-gray': 'var(--color-neutral-100)',
        'luxury-bg': 'var(--color-neutral-50)',
      },
      fontFamily: {
        'sans': ['var(--font-inter)', 'system-ui', 'sans-serif'],
        'serif': ['var(--font-playfair)', 'serif'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float-delayed 8s ease-in-out infinite',
        'float-slow': 'float-slow 10s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '33%': { transform: 'translateY(-10px) rotate(1deg)' },
          '66%': { transform: 'translateY(5px) rotate(-1deg)' },
        },
        'float-delayed': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '33%': { transform: 'translateY(8px) rotate(-1deg)' },
          '66%': { transform: 'translateY(-12px) rotate(1deg)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-8px) rotate(0.5deg)' },
        },
      },
      backgroundImage: {
        'luxury-gradient-primary': 'linear-gradient(135deg, var(--color-primary-600) 0%, var(--color-primary-700) 100%)',
        'luxury-gradient-secondary': 'linear-gradient(135deg, var(--color-neutral-800) 0%, var(--color-neutral-900) 100%)',
        'luxury-pattern': 'radial-gradient(circle at 25% 25%, oklch(var(--primary-600) / 0.1) 0%, transparent 50%), radial-gradient(circle at 75% 75%, oklch(var(--neutral-700) / 0.05) 0%, transparent 50%)',
      },
      boxShadow: {
        'luxury': '0 20px 25px -5px oklch(var(--primary-600) / 0.10), 0 10px 10px -5px oklch(var(--primary-600) / 0.04)',
      },
    },
  },
  plugins: [],
};

export default config;