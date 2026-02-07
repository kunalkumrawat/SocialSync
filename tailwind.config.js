/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // STAGE OTT Brand Colors
        stage: {
          maroon: '#7a0600',
          red: '#c60c0c',
          ribbon: '#e10d37',
          black: '#191919',
          gray: {
            900: '#0a0a0a',
            800: '#191919',
            700: '#2a2a2a',
            600: '#3a3a3a',
            500: '#4a4a4a',
          }
        },
        // Semantic colors for UI states
        semantic: {
          success: {
            500: '#22c55e',  // Green for posted/success states
            600: '#16a34a',
          },
          error: {
            500: '#ef4444',  // Red for failed states
            600: '#dc2626',
          },
          warning: {
            500: '#eab308',  // Yellow for pending/attention
            600: '#ca8a04',
          },
          info: {
            500: '#3b82f6',  // Blue for informational
            600: '#2563eb',
          },
        },
        // Platform brand colors
        platform: {
          instagram: '#E4405F',
          youtube: '#FF0000',
          google: '#4285F4',
        },
        // Theme System
        netflix: {
          black: '#141414',
          red: '#E50914',
          darkRed: '#B20710',
          gray: '#2F2F2F',
          lightGray: '#808080',
        },
        cinema: {
          purple: '#1a0a2e',
          violet: '#2d1b69',
          crimson: '#d32f2f',
          gold: '#ffd700',
          dark: '#0f0617',
        },
        midnight: {
          navy: '#0a1929',
          blue: '#1e3a5f',
          ruby: '#dc2626',
          cyan: '#06b6d4',
          dark: '#020617',
        },
        luxury: {
          charcoal: '#1c1c1e',
          slate: '#2c2c2e',
          gold: '#d4af37',
          rose: '#e11d48',
          bronze: '#cd7f32',
        },
        electric: {
          teal: '#0d2a3a',
          deepTeal: '#1a4d5e',
          neon: '#ff006e',
          cyan: '#00d9ff',
          dark: '#051622',
        }
      },
      fontFamily: {
        sans: ['Noto Sans', 'system-ui', 'sans-serif'],
        poppins: ['Poppins', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
