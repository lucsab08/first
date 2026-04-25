/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        ink: {
          primary: "#0A0A0A",
          secondary: "#5C5C5C",
          tertiary: "#9A9A9A",
        },
        paper: "#FAFAF7",
        surface: "#FFFFFF",
        elevated: "#F5F3EF",
        dusk: "#1B3A4B",
        seaglass: "#D4E4E8",
        sage: "#8FA896",
        sand: "#E8DFD0",
        coral: "#E87B5F",
        hairline: "#ECEAE4",
      },
      fontFamily: {
        display: ["Fraunces_600SemiBold"],
        displayItalic: ["Fraunces_600SemiBold_Italic"],
        sans: ["Inter_400Regular"],
        sansMedium: ["Inter_500Medium"],
        sansSemibold: ["Inter_600SemiBold"],
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
        "3xl": "24px",
      },
    },
  },
  plugins: [],
};
