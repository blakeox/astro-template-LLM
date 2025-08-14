import type { Config } from "tailwindcss";

export default {
	content: ["./src/**/*.{astro,html,ts,tsx}"],
	theme: {
		extend: {
			colors: {
				primary: "hsl(var(--color-primary))",
			},
			borderRadius: {
				xl: "var(--radius)",
			},
			container: {
				center: true,
				screens: {
					lg: "var(--container)",
				},
			},
			fontFamily: {
				sans: ["var(--font-sans)"],
			},
		},
	},
} satisfies Config;
