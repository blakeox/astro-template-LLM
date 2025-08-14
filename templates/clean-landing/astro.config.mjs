import cloudflare from "@astrojs/cloudflare";
import tailwind from "@astrojs/tailwind";
import { defineConfig } from "astro/config";

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
	},
	security: {
		checkOrigin: true,
	},
});
