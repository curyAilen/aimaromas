import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                bg: {
                    main: "#F7F7F9",
                    card: "#FFFFFF",
                },
                text: {
                    primary: "#1A1A1A",
                    secondary: "#8A8A8A",
                },
                accent: {
                    pink: "#FF4D8D",
                    orange: "#FF7A45",
                    purple: "#A855F7",
                },
            },
            fontFamily: {
                sans: ["var(--font-jakarta)", "system-ui", "sans-serif"],
            },
            borderRadius: {
                "4xl": "32px",
            },
            boxShadow: {
                card: "0 4px 20px rgba(0,0,0,0.04)",
                popup: "0 12px 40px rgba(0,0,0,0.12)",
            },
            backgroundImage: {
                "gradient-main": "linear-gradient(135deg, #FF4D8D 0%, #FF7A45 50%, #A855F7 100%)",
                "gradient-soft": "linear-gradient(135deg, #FFE5EE 0%, #FFF0E5 50%, #F3E5FF 100%)",
            },
        },
    },
    plugins: [],
};

export default config;