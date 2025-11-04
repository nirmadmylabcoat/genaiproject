module.exports = {
  content: [
    './src/**/*.{ts,tsx,html}',
    './src/popup/index.html'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#5B21B6',
          foreground: '#000000'
        }
      }
    }
  },
  plugins: []
}

