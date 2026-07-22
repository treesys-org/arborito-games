/** @type {import('tailwindcss').Config} */
// Built to public/tailwind.css — run npm run build:css (no CDN).
module.exports = {
  content: ["./index.html", "./cartridges/**/*.{html,js}"],
  darkMode: "class",
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {},
  },
  plugins: [],
};
