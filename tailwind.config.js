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
        // More vibrant color palette
        primary: {
          400: '#8E2DE2',
          500: '#6A11CB',
          600: '#4A00E0',
          700: '#3A00B0',
        },
        secondary: {
          400: '#5B8DFD',
          500: '#2575FC',
          600: '#1A56B8',
          700: '#154592',
        },
        accent: {
          500: '#F107A3', // Vibrant pink
          600: '#D1068F',
        },
        success: { 
          400: '#55D98D',
          500: '#2ECC71',
          600: '#239D57',
          700: '#1A7A42',
        },
        error: { 
          400: '#EC7063',
          500: '#E74C3C',
          600: '#B03A2E',
          700: '#872D23',
        },
        warning: { 
          400: '#F4D03F',
          500: '#F1C40F',
          600: '#B8970B',
          700: '#8C7308',
        },
        info: { 
          400: '#5DADE2',
          500: '#3498DB',
          600: '#2874A6',
          700: '#1F5A80',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#E0E0FF',
          tertiary: '#B0B0E0',
        },
        surface: {
          light: '#1F1D36',
          dark: '#0F0C29',
          card: '#2A2845',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-primary': 'linear-gradient(135deg, #6A11CB 0%, #2575FC 100%)',
        'gradient-alt': 'linear-gradient(135deg, #8E2DE2 0%, #F107A3 100%)',
        'gradient-dark': 'linear-gradient(135deg, #0F0C29 0%, #302b63 100%)',
        'gradient-success': 'linear-gradient(135deg, #2ECC71 0%, #2575FC 100%)',
      },
      animation: {
        'bounce-slow': 'bounce 3s infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'shimmer': 'shimmer 2s linear infinite',
        'calm': 'calm 3s linear infinite',
        'wave': 'wave 2s ease-in-out infinite',
        'ripple': 'ripple 1.5s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(106, 17, 203, 0.5)' },
          '100%': { boxShadow: '0 0 40px rgba(37, 117, 252, 0.8)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        calm: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        wave: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(5deg)' },
          '75%': { transform: 'rotate(-5deg)' },
        },
        ripple: {
          '0%': { transform: 'scale(0)', opacity: '1' },
          '100%': { transform: 'scale(4)', opacity: '0' },
        },
      },
      boxShadow: {
        'glow': '0 0 20px rgba(106, 17, 203, 0.5)',
        'glow-lg': '0 0 40px rgba(106, 17, 203, 0.3)',
        'calm': '0 0 20px rgba(106, 17, 203, 0.5), 0 0 40px rgba(37, 117, 252, 0.3), 0 0 60px rgba(52, 152, 219, 0.2)',
        'purple': '0 10px 25px rgba(106, 17, 203, 0.15)',
        'indigo': '0 10px 25px rgba(37, 117, 252, 0.15)',
        'lavender': '0 10px 25px rgba(142, 45, 226, 0.15)',
        'success': '0 10px 25px rgba(46, 204, 113, 0.15)',
      },
    },
  },
  plugins: [],
}