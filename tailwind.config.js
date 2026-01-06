/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gyn: {
          'blue-dark': 'var(--gyn-blue-dark)',
          'blue-medium': 'var(--gyn-blue-medium)',
          'blue-light': 'var(--gyn-blue-light)',
          orange: 'var(--gyn-orange)',
          tan: 'var(--gyn-tan)',
          white: 'var(--gyn-white)',
          'frame-bg': 'var(--gyn-frame-bg)',
          grey: 'var(--gyn-grey)',
          'bg-primary-light': '#ffffff',
          'bg-primary-dark': '#252A34',
          'bg-secondary-light': '#f3f4f6',
          'border-primary-light': '#e5e7eb',
          'text-primary-light': '#111827',
          'text-secondary-light': '#6b7280',
          // Sonized Enhancements
          'sonic-silver': '#757575',
          'supersonic-blue': '#0044ff',
          'hypersonic-teal': '#00ffcc',
          'ultra-violet': '#6b00ff',
        },
        // Legacy colors for Landing/Login
        deepBlue: '#0b0850ff',
        vibrantTeal: '#00A99D',
        energeticOrange: '#F37021',
        darkTitanium: '#252A34',
        brushedTitanium: '#4A5568',
        matteSilicone: '#374151',
        carbonFiberBase: '#111827',
        // Realistic Modern HUD & HDM (High Definition Material) Palette
        hud: {
          primary: '#00F0FF', // Electric Cyan - The core interface color
          secondary: '#7000FF', // Electric Purple - Secondary accents
          success: '#00FF94', // Neon Green - Success states
          warning: '#FFB800', // Amber Signal - Warnings
          danger: '#FF003C', // Crimson Alert - Critical errors
          info: '#00A3FF', // Deep Sky - Information
          'glass-low': 'rgba(0, 240, 255, 0.05)',
          'glass-med': 'rgba(0, 240, 255, 0.15)',
          'glass-high': 'rgba(0, 240, 255, 0.25)',
          border: 'rgba(0, 240, 255, 0.4)',
          'dark': '#050505', // Deep HUD background
          'panel': '#0a0a0a', // Panel background
        },
        // Realistic Materials
        material: {
          'obsidian': '#0B0C10', // Deepest background
          'gunmetal': '#1F2833', // Secondary background
          'carbon': '#121212', // Texture base
          'steel': '#45A29E', // Metallic accent
          'platinum': '#C5C6C7', // High contrast text
          'chrome': '#66FCF1', // Highlight
        },
        // Cutting Edge / Cyberpunk Palette
        neon: {
          blue: '#00f3ff',
          purple: '#bc13fe',
          green: '#0aff0a',
          pink: '#ff00ff',
          yellow: '#fcee0a',
        },
        glass: {
          100: 'rgba(255, 255, 255, 0.1)',
          200: 'rgba(255, 255, 255, 0.2)',
          300: 'rgba(255, 255, 255, 0.3)',
          dark: 'rgba(0, 0, 0, 0.6)',
          stroke: 'rgba(255, 255, 255, 0.15)',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
        'cyber-grid': 'linear-gradient(to right, #1f2937 1px, transparent 1px), linear-gradient(to bottom, #1f2937 1px, transparent 1px)',
        'holographic': 'linear-gradient(135deg, rgba(0, 243, 255, 0.1), rgba(188, 19, 254, 0.1))',
        'hud-scanline': 'linear-gradient(to bottom, transparent 50%, rgba(0, 240, 255, 0.05) 50%)',
        'vignette': 'radial-gradient(circle, transparent 60%, rgba(0, 0, 0, 0.8) 100%)',
        'sonic-burst': 'radial-gradient(circle at center, var(--gyn-blue-light) 0%, transparent 70%)',
        'speed-lines': 'repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(255,255,255,0.1) 20px, rgba(255,255,255,0.1) 21px)',
      },
      boxShadow: {
        'neu-flat': '5px 5px 10px #d1d9e6, -5px -5px 10px #ffffff',
        'neu-pressed': 'inset 5px 5px 10px #d1d9e6, inset -5px -5px 10px #ffffff',
        'glass-edge': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.4), 0 4px 30px rgba(0, 0, 0, 0.1)',
        'metal-bevel': 'inset 1px 1px 0px rgba(255,255,255,0.3), inset -1px -1px 0px rgba(0,0,0,0.5), 0 4px 6px rgba(0,0,0,0.3)',
        'neon-blue': '0 0 5px theme("colors.neon.blue"), 0 0 20px theme("colors.neon.blue")',
        'neon-purple': '0 0 5px theme("colors.neon.purple"), 0 0 20px theme("colors.neon.purple")',
        'holographic': '0 0 15px rgba(0, 243, 255, 0.3), inset 0 0 15px rgba(0, 243, 255, 0.1)',
        'hud-glow': '0 0 10px rgba(0, 240, 255, 0.5), 0 0 20px rgba(0, 240, 255, 0.3)',
        'hud-border': '0 0 2px rgba(0, 240, 255, 0.8), inset 0 0 10px rgba(0, 240, 255, 0.2)',
        'sonic-boom': '0 0 25px 5px rgba(0, 68, 255, 0.6)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', '"Noto Sans"', 'sans-serif'],
        machina: ['"Orbitron"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        sonic: ['"Exo 2"', 'sans-serif'], // Fast, futuristic font
      },
      animation: {
        pulseGlow: 'pulseGlow 2.5s infinite ease-in-out',
        subtleFlicker: 'subtleFlicker 1.5s infinite ease-in-out',
        slideInLeft: 'slideInLeft 0.7s ease-out forwards',
        slideInRight: 'slideInRight 0.7s ease-out forwards',
        fadeIn: 'fadeIn 1s ease-out forwards',
        'spin-slow': 'spin 8s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'glitch': 'glitch 1s linear infinite',
        'sonic-dash': 'dash 0.5s ease-in-out infinite',
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 15px 5px rgba(243, 112, 33, 0.7), 0 0 5px 2px rgba(243, 112, 33, 0.5) inset' },
          '50%': { boxShadow: '0 0 25px 10px rgba(243, 112, 33, 1), 0 0 10px 4px rgba(243, 112, 33, 0.7) inset' },
        },
        subtleFlicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.95' },
        },
        slideInLeft: {
          'from': { transform: 'translateX(-100%)', opacity: '0' },
          'to': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInRight: {
          'from': { transform: 'translateX(100%)', opacity: '0' },
          'to': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        glitch: {
          '2%, 64%': { transform: 'translate(2px,0) skew(0deg)' },
          '4%, 60%': { transform: 'translate(-2px,0) skew(0deg)' },
          '62%': { transform: 'translate(0,0) skew(5deg)' },
        },
        dash: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        }
      }
    },
  },
  plugins: [],
}
