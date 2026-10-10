/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          950: '#fcfdff',
          900: '#f4f7fa',
          850: '#edf2f6',
          800: '#e6edf3',
          700: '#d9e3ed',
          600: '#becedc',
          500: '#95a8ba',
        },
        accent: {
          DEFAULT: '#245f9e',
          hover: '#1c4c80',
          dim: '#4776a4',
        },
        ink: {
          base: '#fcfdff',
          main: '#182d41',
          muted: '#455d70',
          dim: '#4f6578',
        },
        line: { DEFAULT: '#d5e0e9', strong: '#74899c' },
        'on-accent': '#fcfdff',
      },
      fontFamily: {
        sans: ['var(--font-body)', '"Avenir Next"', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', '"Avenir Next Condensed"', '"Arial Narrow"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
