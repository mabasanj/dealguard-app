import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FF6314',
        'primary-dark': '#E5530A',
        'primary-light': '#FF8A4D',
        secondary: '#0D0D0D',
        'dark-hero': '#0D0D0D',
        success: '#22C55E',
        danger: '#FF4757',
        warning: '#FFA502',
        info: '#FF6314',
        background: '#F7F8FA',
        'card-bg': '#FFFFFF',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '20px',
        '3xl': '28px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
