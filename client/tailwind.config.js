/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-grey': 'var(--brand-grey)',
        'brand-grey-dark': 'var(--brand-grey-dark)',
        'brand-black': 'var(--brand-black)',
        'brand-white': 'var(--brand-white)',
        'brand-border': 'var(--brand-border)',
      }
    },
  },
  plugins: [],
}

