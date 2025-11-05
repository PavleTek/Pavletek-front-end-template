/** @type {import('tailwindcss').Config} */

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#7ad9c5",
        secondary: "#220070",
      },
    },
  },
  plugins: [],
};
