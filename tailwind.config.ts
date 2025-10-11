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
        'luxury-primary': '#078FA5',
        'luxury-primary-dark': '#065a6b',
        'luxury-secondary': '#2D3748',
        'luxury-accent': '#E2E8F0',
        'luxury-dark': '#1A202C',
        'luxury-gray': '#718096',
        'luxury-light-gray': '#EDF2F7',
        'luxury-bg': '#FAFAFA',
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
        'luxury-gradient-primary': 'linear-gradient(135deg, #078FA5 0%, #065a6b 100%)',
        'luxury-gradient-secondary': 'linear-gradient(135deg, #2D3748 0%, #4A5568 100%)',
        'luxury-pattern': 'radial-gradient(circle at 25% 25%, rgba(7, 143, 165, 0.1) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(45, 55, 72, 0.05) 0%, transparent 50%)',
      },
      boxShadow: {
        'luxury': '0 20px 25px -5px rgba(7, 143, 165, 0.1), 0 10px 10px -5px rgba(7, 143, 165, 0.04)',
      },
    },
  },
  plugins: [],
};

export default config;