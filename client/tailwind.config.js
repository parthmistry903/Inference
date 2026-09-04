/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        obsidian: '#0C0B09',
        kinpaku: '#B07A3E',
        verdigris: '#3A7A72',
        champagne: '#EDEAE5',
        primary: '#EDEAE5',
        secondary: '#928D88',
        muted: '#635E59',
        bg: {
          app: '#0C0B09',
          card: '#131110',
          elevated: '#1B1916',
          input: '#171512',
          inputFocus: '#1F1C19',
        },
        border: {
          subtle: '#1E1B18',
          strong: '#2A2420',
          focused: '#3D3630',
        }
      },
      fontFamily: {
        display: ['"Fraunces"', 'Georgia', 'serif'],
        sans:    ['"DM Sans"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        'dots-grid': 'radial-gradient(circle, rgba(237, 234, 229, 0.05) 1px, transparent 1px)',
      },
      backgroundSize: {
        'dots-grid': '24px 24px',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
};
