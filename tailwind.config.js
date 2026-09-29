/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          950: '#ffffff',
          900: '#f8f9fa',
          850: '#f1f3f5',
          800: '#e9ecef',
          700: '#dee2e6',
          600: '#ced4da',
          500: '#adb5bd',
        },
        accent: {
          DEFAULT: '#b26e2e',
          hover: '#9a5e25',
          dim: '#c99155',
        },
        ink: {
          main: '#1a1a1c',
          muted: '#495057',
          dim: '#868e96',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Inter', 'system-ui', 'sans-serif'],
        display: ['-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
