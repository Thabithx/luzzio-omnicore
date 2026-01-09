/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-grey': '#EDEDED',
        'brand-black': '#000000',
        'brand-white': '#FFFFFF',
        'brand-border': '#000000',
      }
    },
  },
  plugins: [],
}

