/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        copper: '#B87333',
      },
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
      },
      dropShadow: {
        'rose-glow': '0 0 25px rgba(251, 113, 133, 1)', // rose-400, even more intense
      },
    },
  },
  plugins: [],
};
