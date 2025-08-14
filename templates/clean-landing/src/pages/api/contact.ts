import { Hono } from "hono";
import { verifyTurnstile } from "@/lib/turnstile";
import { securityHeaders } from "@/lib/security/headers";
import { Resend } from "resend";

export interface Env {
	EDGE_STORE: KVNamespace;
	TURNSTILE_SECRET_KEY: string;
	RESEND_API_KEY: string;
}

const app = new Hono<{ Bindings: Env }>();

app.post("/", async (c) => {
	const ip = c.req.header("cf-connecting-ip") || "";
	const {
		name = "",
		email = "",
		message = "",
		turnstileToken,
	} = await c.req.json().catch(() => ({}));

	const v = await verifyTurnstile({
		EDGE_STORE: c.env.EDGE_STORE,
		secret: c.env.TURNSTILE_SECRET_KEY,
		token: String(turnstileToken || ""),
		ip,
		salt: "rotate-yearly",
	});

	if (!v.ok) {
		const errorResponse = v as {
			ok: false;
			code: number;
			err: string;
			details?: string[];
		};
		return c.json(
			{ error: errorResponse.err, details: errorResponse.details || [] },
			errorResponse.code,
		);
	}

	if (!email || !message) return c.json({ error: "invalid input" }, 400);

	const resend = new Resend(c.env.RESEND_API_KEY);
	await resend.emails.send({
		from: "Website <noreply@example.com>",
		to: ["you@example.com"],
		subject: `New message from ${name || "Website"}`,
		text: `From: ${email}\n\n${message}`,
	});

	return new Response(JSON.stringify({ ok: true }), {
		status: 202,
		headers: { "Content-Type": "application/json", ...securityHeaders() },
	});
});

export const onRequest = app.fetch;
export const onRequestPost = app.fetch;
