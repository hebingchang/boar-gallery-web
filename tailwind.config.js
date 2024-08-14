const { nextui } = require("@nextui-org/react");

const generateGrid = (size) => {
  const gridColumn = {};
  const gridTemplateColumns = {};
  const gridRow = {};
  const gridTemplateRows = {};
  const gridRowStart = {};
  const gridRowEnd = {};
  const gridColumnStart = {};
  const gridColumnEnd = {};
  for (let i = 1; i <= size; i++) {
    gridRow[`span-${i}`] = `span ${i} / span ${i}`;
    gridColumn[`span-${i}`] = `span ${i} / span ${i}`;
    gridTemplateColumns[i] = `repeat(${i}, minmax(0, 1fr))`;
    gridTemplateRows[i] = `repeat(${i}, minmax(0, 1fr))`;
    gridRowStart[i] = `${i}`;
    gridRowEnd[i] = `${i}`;
    gridColumnStart[i] = `${i}`;
    gridColumnEnd[i] = `${i}`;
  }
  return {
    gridColumn,
    gridTemplateColumns,
    gridRow,
    gridTemplateRows,
    gridRowStart,
    gridRowEnd,
    gridColumnStart,
    gridColumnEnd,
  };
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      ...generateGrid(24),
    },
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
            DEFAULT: "#6E7685",
          }
        }
      }
    }
  })],
}

