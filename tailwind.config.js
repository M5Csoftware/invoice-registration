/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: '#F8FAFC',
          line: 'rgba(148,163,184,0.08)',
        },
        ink: {
          DEFAULT: '#0F172A',
          dark: '#020617',
        },
        brass: {
          DEFAULT: '#4F46E5',
          light: '#818CF8',
        },
        red: {
          DEFAULT: '#DC2626',
        },
        green: {
          DEFAULT: '#16A34A',
        },
        slate: {
          DEFAULT: '#334155',
        },
        card: {
          DEFAULT: '#FFFFFF',
        }
      },
      fontFamily: {
        heading: ['"Plus Jakarta Sans"', 'sans-serif'],
        ui: ['"DM Sans"', '"Plus Jakarta Sans"', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      animation: {
        'stamp-new': 'stampSlam 0.35s ease-out forwards',
      },
      keyframes: {
        stampSlam: {
          '0%': { transform: 'scale(2.2) rotate(-7deg)', opacity: '0' },
          '60%': { transform: 'scale(0.92) rotate(-7deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(-7deg)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
