import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#14F195',
          dark: '#0FA66A',
        },
        secondary: {
          DEFAULT: '#9945FF',
          dark: '#7035CC',
        },
      },
    },
  },
  plugins: [],
};

export default config;
