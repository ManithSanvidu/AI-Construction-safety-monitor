/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
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