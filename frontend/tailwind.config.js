/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          deep: '#0B0F19',     // Rich dark blue-gray (background)
          card: '#151D30',     // Premium card background
          border: '#242F48',   // Border highlight
          muted: '#8A99AD',    // Subdued gray text
          light: '#F8FAFC'     // Clean off-white
        },
        brand: {
          primary: '#6366F1',  // Indigo-500
          secondary: '#06B6D4',// Cyan-500
          purple: '#A855F7',   // Purple-500
          success: '#10B981',  // Emerald-500
          danger: '#EF4444',   // Red-500
          warning: '#F59E0B'   // Amber-500
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'glow-primary': '0 0 15px rgba(99, 102, 241, 0.15)',
        'glow-secondary': '0 0 15px rgba(6, 182, 212, 0.15)',
        'glow-success': '0 0 15px rgba(16, 185, 129, 0.15)',
      }
    },
  },
  plugins: [],
}
