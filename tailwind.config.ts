import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    screens: {
      xs: "400px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
    },
    extend: {
      fontFamily: {
        outfit: ["Outfit", "system-ui", "sans-serif"],
      },
      colors: {
        bauhaus: {
          red: "#D02020",
          blue: "#1040C0",
          yellow: "#F0C020",
          black: "#121212",
          gray: "#F0F0F0",
          muted: "#E0E0E0",
          white: "#FFFFFF",
        },
        background: "#F0F0F0",
        foreground: "#121212",
        border: "#121212",
      },
      boxShadow: {
        "bauhaus-sm": "3px 3px 0px 0px #121212",
        bauhaus: "4px 4px 0px 0px #121212",
        "bauhaus-md": "6px 6px 0px 0px #121212",
        "bauhaus-lg": "8px 8px 0px 0px #121212",
      },
      borderWidth: {
        "3": "3px",
      },
    },
  },
  plugins: [],
} satisfies Config;
