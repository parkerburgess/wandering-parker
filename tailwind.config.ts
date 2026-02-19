import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './projects/*/component.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0d0d0d',
        surface: '#1a1a1a',
        border: '#2e2e2e',
        'text-primary': '#f0ede8',
        'text-muted': '#8a8480',
        accent: '#c9a96e',
      },
    },
  },
  plugins: [],
}

export default config
