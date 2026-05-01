/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#eef2f7', 100: '#d5e0ed', 200: '#abc2db',
          300: '#82a3c9', 400: '#5885b7', 500: '#3e6fa0',
          600: '#2f5a87', 700: '#24466e', 800: '#1a3355',
          900: '#0f2035',
        },
        gold: {
          400: '#f5c842', 500: '#e6b800', 600: '#d97706',
        }
      },
      fontFamily: {
        heading: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
