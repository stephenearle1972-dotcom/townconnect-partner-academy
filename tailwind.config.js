/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'forest': '#2D5016',
        'forest-dark': '#1f3a0f',
        'gold': '#c4a35a',
        'gold-dark': '#a8893d',
      },
    },
  },
  plugins: [],
}
