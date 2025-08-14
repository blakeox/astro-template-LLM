import type { APIRoute } from "astro";
import schema from "../../../site.config.schema.json" assert { type: "json" };

export const GET: APIRoute = async () => {
	return new Response(JSON.stringify(schema, null, 2), {
		headers: {
			"Content-Type": "application/json",
			"Cache-Control": "public, max-age=300, s-maxage=600",
			"Access-Control-Allow-Origin": "*",
		},
	});
};
