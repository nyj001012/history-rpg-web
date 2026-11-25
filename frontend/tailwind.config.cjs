module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
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
