import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        surface: 'var(--surface)',
        border: 'var(--border)',
        accent: 'var(--accent)',
        text: {
          primary: 'var(--text-primary)',
          muted: 'var(--text-muted)',
        },
      },
    },
  },
  plugins: [],
}

export default config
