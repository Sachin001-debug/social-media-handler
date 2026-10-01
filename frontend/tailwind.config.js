/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
      },
      colors: {
        surface: {
          bg: '#F8FAFC',
          card: '#FFFFFF',
          border: '#E5E7EB',
        },
        brand: {
          dark: '#172033',
          darkHover: '#1F2B45',
          primary: '#111827',
          secondary: '#6B7280',
          success: '#16A34A',
          warning: '#D97706',
          danger: '#DC2626',
        }
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'modal': '0 8px 24px -4px rgba(0, 0, 0, 0.08), 0 4px 8px -4px rgba(0, 0, 0, 0.03)',
      }
    },
  },
  plugins: [],
}
