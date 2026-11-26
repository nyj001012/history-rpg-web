module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-ui)'],
        serif: ['var(--font-display)'],
        handwriting: ['var(--font-handwriting)'],
        pixel: ['var(--font-pixel)'],
      },
    },
  },
};
