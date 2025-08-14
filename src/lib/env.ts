import { z } from "zod";

// Centralized, type-safe environment access
const envSchema = z.object({
	// Existing
	RESEND_API_KEY: z.string().optional(),
	TURNSTILE_SECRET_KEY: z.string().optional(),
	PUBLIC_SITE_NAME: z.string().default("Example Co."),

	// MCP / Cloudflare
	MCP_SERVER_URL: z.string().url().optional(),
	MCP_API_KEY: z.string().optional(),
	MCP_WEBHOOK_SECRET: z.string().optional(),
	USE_MCP: z
		.union([z.literal("true"), z.literal("false")])
		.optional()
		.default("false"),
	MCP_TIMEOUT_MS: z
		.string()
		.transform((v) => (v ? Number(v) : undefined))
		.pipe(z.number().positive().optional())
		.optional(),
});

export const env = envSchema.parse(process.env);

export const isMcpEnabled = env.USE_MCP === "true" && !!env.MCP_SERVER_URL;
export const mcpTimeoutMs = env.MCP_TIMEOUT_MS ?? 30000;
