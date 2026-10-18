/** @type {import('tailwindcss').Config} */
// Tailwind is installed but no longer used for styling — the store's design
// system lives in src/theme/ (theme.js + global.css). This config only keeps
// create-react-app's PostCSS step quiet.
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  theme: {
    extend: {},
  },
  plugins: [],
};
