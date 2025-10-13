import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        robotoCondensed: ['RobotoCondensed', 'sans-serif'],
        instrumentSerif: ['InstrumentSerif', 'serif'],
      },
    },
  },
  plugins: [],
}

export default config