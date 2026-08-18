/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Titan brand accent — used for primary buttons, active nav, links
        titan: {
          50: "#eef4ff",
          100: "#d9e6ff",
          500: "#3b5fe0",
          600: "#3049b8",
          700: "#26398f",
        },
      },
    },
  },
  plugins: [],
}
