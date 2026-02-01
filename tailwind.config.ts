import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Nanny Whisperer brand palette
        'pastel-black': '#2E2E2E',
        'dark-green': '#3F4C44',
        'light-green': '#C8D5C4',
        'light-pink': '#EAD5D1',
        'off-white': '#F8F6F2',
      },
      fontFamily: {
        sans: ['var(--font-primary)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};

export default config;
