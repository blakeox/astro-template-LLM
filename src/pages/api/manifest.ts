import type { APIRoute } from "astro";
import manifest from "../../../components/manifest.json" assert {
	type: "json",
};

export const GET: APIRoute = async () => {
	return new Response(JSON.stringify(manifest, null, 2), {
		headers: {
			"Content-Type": "application/json",
			"Cache-Control": "public, max-age=300, s-maxage=600",
			"Access-Control-Allow-Origin": "*",
		},
	});
};
