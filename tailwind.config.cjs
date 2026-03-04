/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      colors: {
        cream: '#f6eee6',
        title: '#2a3f64',
        text: '#3a2c23',
        muted: '#8a8f99',
        orange: '#f26a1d',
      },
      boxShadow: {
        card: '0 10px 18px rgba(0, 0, 0, 0.08)',
        soft: '0 6px 14px rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [],
};
