import crypto from "node:crypto";
import { z } from "zod";
import type { Feature, SiteConfig } from "../types/site-config.js";
import { env, isMcpEnabled, mcpTimeoutMs } from "./env.js";
import { SiteConfigSchema } from "./schemas.js";

// MCP Client Helper Functions
// This module provides typed functions for MCP integration
// without embedding secrets or credentials

export interface GenerateSiteConfigOptions {
	maxFeatures?: number;
	includeImages?: boolean;
	format?: "json" | "yaml";
}

export interface ValidationResult {
	valid: boolean;
	errors?: string[];
	warnings?: string[];
}

export interface MCPResponse<T = unknown> {
	success: boolean;
	data?: T;
	error?: string;
	metadata?: {
		model?: string;
		tokens?: number;
		timestamp?: string;
	};
}

type FetchLike = typeof fetch;

async function fetchWithRetry(
	url: string,
	init: RequestInit,
	opts: {
		retries?: number;
		backoffMs?: number;
		fetchImpl?: FetchLike;
		timeoutMs?: number;
	} = {},
) {
	const {
		retries = 2,
		backoffMs = 400,
		fetchImpl = fetch,
		timeoutMs = mcpTimeoutMs,
	} = opts;
	let lastErr: unknown;
	for (let attempt = 0; attempt <= retries; attempt++) {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), timeoutMs);
		try {
			const res = await fetchImpl(url, { ...init, signal: controller.signal });
			if (res.status === 429 || (res.status >= 500 && res.status < 600)) {
				if (attempt < retries) {
					// Small exponential backoff between retries
					await new Promise((r) => setTimeout(r, backoffMs * (attempt + 1)));
					continue;
				}
			}
			return res;
		} catch (err) {
			lastErr = err;
			if (attempt < retries) {
				await new Promise((r) => setTimeout(r, backoffMs * (attempt + 1)));
			}
		} finally {
			clearTimeout(timeout);
		}
	}
	throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

/**
 * Generate site configuration from a prompt
 * This would integrate with your MCP server in production
 * @param prompt - The user prompt describing the desired site
 * @param options - Generation options
 * @returns Promise<MCPResponse<SiteConfig>>
 */
export async function generateSiteConfig(
	prompt: string,
	options: GenerateSiteConfigOptions = {},
): Promise<MCPResponse<SiteConfig>> {
	try {
		// Validate input
		if (!prompt || prompt.trim().length === 0) {
			return {
				success: false,
				error: "Prompt is required",
			};
		}

		if (prompt.length > 1000) {
			return {
				success: false,
				error: "Prompt is too long (max 1000 characters)",
			};
		}

		// If MCP is enabled, call the external server; otherwise use local mock
		if (isMcpEnabled && env.MCP_SERVER_URL) {
			const url = `${env.MCP_SERVER_URL.replace(/\/$/, "")}/generate`;
			const body = JSON.stringify({ prompt, options });
			const headers: Record<string, string> = {
				"Content-Type": "application/json",
			};
			if (env.MCP_API_KEY) headers.Authorization = `Bearer ${env.MCP_API_KEY}`;

			const res = await fetchWithRetry(
				url,
				{ method: "POST", headers, body },
				{ retries: 2, backoffMs: 500, timeoutMs: mcpTimeoutMs },
			);

			if (!res.ok) {
				const text = await res.text().catch(() => "");
				return {
					success: false,
					error: `MCP error ${res.status}: ${text || res.statusText}`,
				};
			}

			const json = await res.json().catch(() => null);
			// Accept either wrapped { success, data } or raw SiteConfig
			const candidate = json?.data ?? json;
			const parsed = SiteConfigSchema.safeParse(candidate);
			if (!parsed.success) {
				return {
					success: false,
					error: `Schema validation failed: ${parsed.error.message}`,
				};
			}

			return {
				success: true,
				data: parsed.data,
				metadata: {
					model: json?.metadata?.model ?? "mcp",
					tokens: json?.metadata?.tokens,
					timestamp: json?.metadata?.timestamp ?? new Date().toISOString(),
				},
			};
		}

		// Fallback: local structured response based on the prompt
		const siteConfig: SiteConfig = {
			name: extractSiteName(prompt) || "Generated Site",
			description:
				extractSiteDescription(prompt) || "Site generated from MCP prompt",
			pages: {
				home: {
					hero: {
						title: extractHeroTitle(prompt) || "Welcome to Our Site",
						subtitle:
							extractHeroSubtitle(prompt) ||
							"Professional services and solutions for your business needs.",
					},
					features: generateFeatures(prompt, options.maxFeatures || 3),
				},
			},
		};

		// Add optional pages if detected in prompt
		if (prompt.toLowerCase().indexOf("about") !== -1) {
			siteConfig.pages.about = {
				blurb: "We are a professional company dedicated to excellence.",
			};
		}

		if (prompt.toLowerCase().indexOf("contact") !== -1) {
			siteConfig.pages.contact = {
				emailPlaceholder: "Enter your email address",
			};
		}

		return {
			success: true,
			data: siteConfig,
			metadata: {
				model: "mcp-generator",
				timestamp: new Date().toISOString(),
			},
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : String(error),
		};
	}
}

/**
 * Validate an artifact against a schema
 * @param artifact - The artifact to validate (usually JSON)
 * @param schemaPath - Path to JSON schema file
 * @returns Promise<ValidationResult>
 */
export async function validateArtifact(
	artifact: unknown,
	schemaPath: string,
): Promise<ValidationResult> {
	try {
		// This would load and validate against the JSON schema
		// For now, basic validation
		if (!artifact || typeof artifact !== "object") {
			return {
				valid: false,
				errors: ["Artifact must be a valid object"],
			};
		}

		// Basic structure validation for SiteConfig
		const a: Record<string, unknown> = artifact as Record<string, unknown>;
		if (!a.name || !a.description || !a.pages) {
			return {
				valid: false,
				errors: ["Missing required fields: name, description, or pages"],
			};
		}

		return {
			valid: true,
			warnings: [],
		};
	} catch (error) {
		return {
			valid: false,
			errors: [error instanceof Error ? error.message : String(error)],
		};
	}
}

/**
 * Verify webhook signature for secure MCP communication
 * @param payload - Request payload
 * @param signature - Webhook signature
 * @param secret - Webhook secret (should be from environment)
 * @returns boolean
 */
export function verifyWebhookSignature(
	payload: string,
	signature: string,
	secret: string,
): boolean {
	try {
		if (!secret) {
			throw new Error("Webhook secret not configured");
		}

		const expectedSignature = crypto
			.createHmac("sha256", secret)
			.update(payload, "utf8")
			.digest("hex");

		const providedSignature = signature.replace("sha256=", "");

		return crypto.timingSafeEqual(
			Buffer.from(expectedSignature, "hex"),
			Buffer.from(providedSignature, "hex"),
		);
	} catch (error) {
		console.error(
			"Webhook verification error:",
			error instanceof Error ? error.message : String(error),
		);
		return false;
	}
}

// Helper functions for prompt parsing
function extractSiteName(prompt: string): string | null {
	const patterns = [
		/for ["']([^"']+)["']/i,
		/called ["']([^"']+)["']/i,
		/named ["']([^"']+)["']/i,
		/"([^"]+)"/,
		/'([^']+)'/,
	];

	for (const pattern of patterns) {
		const match = prompt.match(pattern);
		if (match?.[1] && match[1].length < 50) {
			return match[1];
		}
	}

	return null;
}

function extractSiteDescription(prompt: string): string | null {
	// Extract description from common patterns
	if (prompt.indexOf("brochure site") !== -1) {
		return "Professional brochure website";
	}
	if (prompt.indexOf("portfolio") !== -1) {
		return "Professional portfolio website";
	}
	if (prompt.indexOf("company") !== -1) {
		return "Professional company website";
	}

	return null;
}

function extractHeroTitle(prompt: string): string | null {
	const siteName = extractSiteName(prompt);
	if (siteName) {
		return `Welcome to ${siteName}`;
	}

	return null;
}

function extractHeroSubtitle(prompt: string): string | null {
	if (prompt.toLowerCase().indexOf("studio") !== -1) {
		return "Creative solutions for your business needs";
	}
	if (prompt.toLowerCase().indexOf("consulting") !== -1) {
		return "Expert consulting services to help your business succeed";
	}

	return null;
}

function generateFeatures(prompt: string, count: number): Feature[] {
	const defaultFeatures = [
		{
			title: "Professional Service",
			description: "High-quality solutions tailored to your needs",
			icon: "🎯",
		},
		{
			title: "Expert Team",
			description: "Experienced professionals dedicated to excellence",
			icon: "👥",
		},
		{
			title: "Reliable Support",
			description: "Ongoing support to ensure optimal performance",
			icon: "🛠️",
		},
	];

	// Return requested number of features
	return defaultFeatures.slice(0, count);
}

export default {
	generateSiteConfig,
	validateArtifact,
	verifyWebhookSignature,
};
