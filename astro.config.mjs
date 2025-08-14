import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
	output: "hybrid",
	adapter: cloudflare(),
	integrations: [tailwind()],
	site: "https://example.com",
	vite: {
		resolve: {
			alias: {
				"@": new URL("./src", import.meta.url).pathname,
			},
		},
		ssr: {
			external: ["crypto"],
		},
	},
	security: {
		checkOrigin: true,
	},
});
