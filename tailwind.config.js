const {nextui} = require("@nextui-org/react");

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  darkMode: "class",
  plugins: [nextui({
    themes: {
      light: {
        colors: {
          primary: {
            100: "#E9EEF4",
            200: "#D5DEEA",
            300: "#A7B2C2",
            400: "#6E7685",
            500: "#282C34",
            600: "#1D212C",
            700: "#141825",
            800: "#0C101E",
            900: "#070B18",
            DEFAULT: "#282C34",
          }
        }
      },
      dark: {
        colors: {
          primary: {
            100: "#E9EEF4",
            200: "#D5DEEA",
            300: "#A7B2C2",
            400: "#6E7685",
            500: "#282C34",
            600: "#1D212C",
            700: "#141825",
            800: "#0C101E",
            900: "#070B18",
            DEFAULT: "#282C34",
          }
        }
      }
    }
  })],
}

