/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html", 
    "./*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./pages/**/*.{js,jsx}",
    "./context/**/*.{js,jsx}",
    "./layouts/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        safety: {
          orange: "#f97316",
          red: "#ef4444",
          green: "#22c55e",
          dark: "#0f172a",
        },
      },
    },
  },
  plugins: [],
}