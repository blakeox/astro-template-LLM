import crypto from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { z } from "zod";
import type { SiteConfig, Feature } from "../types/site-config.js";

// Zod schema for site config validation matching site.config.schema.json
const SiteConfigSchema = z.object({
	name: z.string().min(1).max(100),
	description: z.string().min(1).max(200),
	pages: z.object({
		home: z.object({
			hero: z.object({
				title: z.string().min(1).max(60),
				subtitle: z.string().min(1).max(300),
				cta: z
					.object({
						primary: z
							.object({
								text: z.string().min(1).max(50),
								href: z.string().min(1),
							})
							.optional(),
						secondary: z
							.object({
								text: z.string().min(1).max(50),
								href: z.string().min(1),
							})
							.optional(),
					})
					.optional(),
			}),
			features: z
				.array(
					z.object({
						icon: z.string().max(10).optional(),
						title: z.string().min(1).max(50),
						description: z.string().min(1).max(120),
					}),
				)
				.min(1)
				.max(6),
		}),
		about: z
			.object({
				hero: z
					.object({
						title: z.string().min(1).max(60),
						subtitle: z.string().min(1).max(300),
					})
					.optional(),
				blurb: z.string().min(1).max(500).optional(),
			})
			.optional(),
		contact: z
			.object({
				hero: z
					.object({
						title: z.string().min(1).max(60),
						subtitle: z.string().min(1).max(300),
					})
					.optional(),
				emailPlaceholder: z.string().min(1).max(100).optional(),
			})
			.optional(),
		services: z
			.object({
				hero: z
					.object({
						title: z.string().min(1).max(60),
						subtitle: z.string().min(1).max(300),
					})
					.optional(),
				services: z
					.array(
						z.object({
							title: z.string().min(1).max(50),
							description: z.string().min(1).max(200),
							features: z.array(z.string().max(100)).optional(),
						}),
					)
					.optional(),
			})
			.optional(),
	}),
	images: z
		.array(
			z.object({
				url: z.string().url(),
				alt: z.string().min(1),
			}),
		)
		.optional(),
});

export interface MCPServerConfig {
	url: string;
	apiKey?: string;
	timeout?: number;
	retries?: number;
}

export interface GenerateSiteConfigOptions {
	prompt: string;
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

/**
 * Generate site configuration from a prompt using an actual MCP server
 * @param prompt - The user prompt describing the desired site
 * @param options - Generation options
 * @param serverConfig - MCP server configuration
 * @returns Promise<MCPResponse<SiteConfig>>
 */
export async function generateSiteConfigFromMCP(
	prompt: string,
	options: GenerateSiteConfigOptions = {},
	serverConfig?: MCPServerConfig,
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

		// If no server config, fall back to local generation
		if (!serverConfig?.url) {
			return generateSiteConfig(prompt, options);
		}

		// Make request to actual MCP server
		const requestBody = {
			prompt,
			schema: "site-config",
			options: {
				maxFeatures: options.maxFeatures || 3,
				includeImages: options.includeImages || false,
				format: options.format || "json",
			},
		};

		const controller = new AbortController();
		const timeoutId = setTimeout(
			() => controller.abort(),
			(serverConfig.timeout || 30) * 1000,
		);

		try {
			const response = await fetch(serverConfig.url, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					...(serverConfig.apiKey && {
						Authorization: `Bearer ${serverConfig.apiKey}`,
					}),
				},
				body: JSON.stringify(requestBody),
				signal: controller.signal,
			});

			clearTimeout(timeoutId);

			if (!response.ok) {
				throw new Error(`MCP server responded with ${response.status}: ${response.statusText}`);
			}

			const mcpResponse = await response.json();

			// Validate the response structure
			if (!mcpResponse.success) {
				return {
					success: false,
					error: mcpResponse.error || "MCP server returned unsuccessful response",
				};
			}

			// Validate the generated config against schema
			const validation = await validateArtifact(mcpResponse.data);
			if (!validation.valid) {
				return {
					success: false,
					error: `Generated config failed validation: ${validation.errors?.join(", ")}`,
				};
			}

			return {
				success: true,
				data: mcpResponse.data as SiteConfig,
				metadata: {
					model: mcpResponse.metadata?.model || "mcp-server",
					tokens: mcpResponse.metadata?.tokens,
					timestamp: new Date().toISOString(),
				},
			};
		} catch (fetchError) {
			clearTimeout(timeoutId);
			
			// Implement retry logic
			const retries = serverConfig.retries || 2;
			if (retries > 0) {
				console.warn(`MCP request failed, retrying... (${retries} attempts left)`);
				return generateSiteConfigFromMCP(
					prompt,
					options,
					{ ...serverConfig, retries: retries - 1 },
				);
			}

			throw fetchError;
		}
	} catch (error) {
		return {
			success: false,
			error: (error as Error).message,
		};
	}
}

/**
 * Generate site configuration from a prompt (local fallback)
 * This provides local generation when MCP server is unavailable
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

		// In a real implementation, this would call your MCP server
		// For now, we'll return a structured response based on the prompt
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
		if (prompt.toLowerCase().includes("about")) {
			siteConfig.pages.about = {
				blurb: "We are a professional company dedicated to excellence.",
			};
		}

		if (prompt.toLowerCase().includes("contact")) {
			siteConfig.pages.contact = {
				emailPlaceholder: "Enter your email address",
			};
		}

		// Validate the generated config before returning
		const validation = await validateArtifact(siteConfig);
		if (!validation.valid) {
			return {
				success: false,
				error: `Generated config failed validation: ${validation.errors?.join(", ")}`,
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
			error: (error as Error).message,
		};
	}
}

/**
 * Validate an artifact against a schema
 * @param artifact - The artifact to validate (usually JSON)
 * @param schemaPath - Path to JSON schema file (optional, uses built-in Zod schema if not provided)
 * @returns Promise<ValidationResult>
 */
export async function validateArtifact(
	artifact: unknown,
	schemaPath?: string,
): Promise<ValidationResult> {
	try {
		// If no schema path provided, use built-in Zod validation
		if (!schemaPath) {
			const result = SiteConfigSchema.safeParse(artifact);
			if (result.success) {
				return {
					valid: true,
					warnings: [],
				};
			}
			return {
				valid: false,
				errors: result.error.errors.map(
					(err) => `${err.path.join(".")}: ${err.message}`,
				),
			};
		}

		// For external schema validation (future enhancement)
		if (!artifact || typeof artifact !== "object") {
			return {
				valid: false,
				errors: ["Artifact must be a valid object"],
			};
		}

		// Basic structure validation for SiteConfig
		if (!artifact || typeof artifact !== "object") {
			return {
				valid: false,
				errors: ["Invalid artifact structure"],
			};
		}

		const typedArtifact = artifact as Record<string, unknown>;
		if (!typedArtifact.name || !typedArtifact.description || !typedArtifact.pages) {
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
			errors: [(error as Error).message],
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
		console.error("Webhook verification error:", error.message);
		return false;
	}
}

// Enhanced helper functions for prompt parsing
function extractSiteName(prompt: string): string | null {
	// More sophisticated name extraction patterns
	const patterns = [
		// Quoted names
		/for ["']([^"']+)["']/i,
		/called ["']([^"']+)["']/i,
		/named ["']([^"']+)["']/i,
		/"([^"]+)"/,
		/'([^']+)'/,
		// Unquoted company names  
		/for ([A-Z][a-zA-Z\s&]+?)(?:\s+(?:company|corp|inc|llc|studio|agency|co\.?))/i,
		/create.*?(?:site|website).*?for ([A-Z][a-zA-Z\s&]+)/i,
		/build.*?(?:site|website).*?for ([A-Z][a-zA-Z\s&]+)/i,
		// Business type patterns
		/([A-Z][a-zA-Z\s&]+?)\s+(?:studio|agency|consulting|design|development)/i,
	];

	for (const pattern of patterns) {
		const match = prompt.match(pattern);
		if (match?.[1] && match[1].length > 2 && match[1].length < 50) {
			// Clean up the extracted name
			const name = match[1].trim()
				.replace(/\s+/g, " ")
				.replace(/^(the|a|an)\s+/i, "")
				.replace(/\s+(company|corp|inc|llc|co\.?)$/i, "");
			
			if (name.length > 2) {
				return name;
			}
		}
	}

	return null;
}

function extractSiteDescription(prompt: string): string | null {
	// Extract description from common patterns and business types
	const businessTypes = [
		{ keywords: ["brochure", "business"], description: "Professional business website" },
		{ keywords: ["portfolio"], description: "Creative portfolio website showcasing work and expertise" },
		{ keywords: ["consulting", "consultant"], description: "Strategic consulting services and business solutions" },
		{ keywords: ["studio", "design"], description: "Creative design studio providing innovative solutions" },
		{ keywords: ["agency", "digital"], description: "Professional digital agency delivering results-driven solutions" },
		{ keywords: ["restaurant", "cafe", "food"], description: "Restaurant and dining experience" },
		{ keywords: ["law", "legal", "attorney"], description: "Professional legal services and expertise" },
		{ keywords: ["medical", "healthcare", "clinic"], description: "Healthcare and medical services" },
		{ keywords: ["real estate", "property"], description: "Real estate and property services" },
		{ keywords: ["fitness", "gym", "wellness"], description: "Fitness and wellness services" },
		{ keywords: ["education", "school", "learning"], description: "Educational services and programs" },
		{ keywords: ["nonprofit", "charity", "foundation"], description: "Nonprofit organization making a positive impact" },
	];

	const lowerPrompt = prompt.toLowerCase();
	
	for (const type of businessTypes) {
		if (type.keywords.some(keyword => lowerPrompt.includes(keyword))) {
			return type.description;
		}
	}

	return null;
}

function extractHeroTitle(prompt: string): string | null {
	const siteName = extractSiteName(prompt);
	const lowerPrompt = prompt.toLowerCase();
	
	// Generate context-aware hero titles
	if (lowerPrompt.includes("portfolio")) {
		return siteName ? `${siteName} Portfolio` : "Creative Portfolio";
	}
	if (lowerPrompt.includes("consulting")) {
		return siteName ? `Expert Consulting from ${siteName}` : "Expert Consulting Services";
	}
	if (lowerPrompt.includes("studio") || lowerPrompt.includes("design")) {
		return siteName ? `Creative Solutions by ${siteName}` : "Creative Design Solutions";
	}
	if (lowerPrompt.includes("agency")) {
		return siteName ? `${siteName} Digital Agency` : "Digital Agency Services";
	}
	if (lowerPrompt.includes("restaurant") || lowerPrompt.includes("cafe")) {
		return siteName ? `Welcome to ${siteName}` : "Exceptional Dining Experience";
	}

	return siteName ? `Welcome to ${siteName}` : null;
}

function extractHeroSubtitle(prompt: string): string | null {
	const lowerPrompt = prompt.toLowerCase();
	
	// Generate context-aware subtitles based on business type
	if (lowerPrompt.includes("studio") || lowerPrompt.includes("design")) {
		return "We transform your vision into stunning digital experiences that captivate and convert.";
	}
	if (lowerPrompt.includes("consulting")) {
		return "Strategic consulting services to optimize operations, increase profitability, and drive growth.";
	}
	if (lowerPrompt.includes("portfolio")) {
		return "Showcasing innovative projects and creative solutions that make an impact.";
	}
	if (lowerPrompt.includes("agency")) {
		return "Professional digital services to help your business succeed in the modern marketplace.";
	}
	if (lowerPrompt.includes("restaurant") || lowerPrompt.includes("cafe")) {
		return "Crafting memorable dining experiences with exceptional food and outstanding service.";
	}
	if (lowerPrompt.includes("law") || lowerPrompt.includes("legal")) {
		return "Providing expert legal counsel and representation with integrity and dedication.";
	}
	if (lowerPrompt.includes("medical") || lowerPrompt.includes("healthcare")) {
		return "Comprehensive healthcare services focused on your well-being and recovery.";
	}

	return null;
}

function generateFeatures(prompt: string, count: number): Feature[] {
	const lowerPrompt = prompt.toLowerCase();
	
	// Business-type specific feature sets
	const featureSets: Record<string, Feature[]> = {
		design: [
			{
				icon: "🎨",
				title: "Brand Design",
				description: "Complete brand identity packages including logos, typography, and visual guidelines.",
			},
			{
				icon: "💻",
				title: "Web Development", 
				description: "Modern, responsive websites built with cutting-edge technology and optimization.",
			},
			{
				icon: "📱",
				title: "Digital Strategy",
				description: "Data-driven marketing strategies to reach and engage the right audience effectively.",
			},
			{
				icon: "🚀",
				title: "User Experience",
				description: "Intuitive user interfaces designed to enhance engagement and conversion rates.",
			},
		],
		consulting: [
			{
				icon: "📊",
				title: "Strategic Planning",
				description: "Comprehensive business strategy development to align operations with growth objectives.",
			},
			{
				icon: "⚡",
				title: "Process Optimization",
				description: "Streamline operations and eliminate inefficiencies to boost productivity and performance.",
			},
			{
				icon: "📈",
				title: "Performance Analytics",
				description: "Data-driven insights and KPI tracking to measure success and identify opportunities.",
			},
			{
				icon: "🎯",
				title: "Market Research",
				description: "In-depth market analysis to understand trends, competition, and opportunities.",
			},
		],
		agency: [
			{
				icon: "⚡",
				title: "Fast Development",
				description: "Rapid prototyping and development cycles to get your project to market quickly.",
			},
			{
				icon: "🛡️",
				title: "Secure & Scalable",
				description: "Enterprise-grade security and architecture designed to grow with your business.",
			},
			{
				icon: "🎯",
				title: "Custom Solutions",
				description: "Tailored applications built specifically for your business requirements and goals.",
			},
		],
		restaurant: [
			{
				icon: "🍽️",
				title: "Exceptional Dining",
				description: "Carefully crafted dishes using the finest ingredients and innovative techniques.",
			},
			{
				icon: "🏆",
				title: "Award-Winning Service",
				description: "Professional staff dedicated to creating memorable dining experiences.",
			},
			{
				icon: "🌟",
				title: "Ambiance & Atmosphere",
				description: "Thoughtfully designed spaces that enhance every aspect of your visit.",
			},
		],
		legal: [
			{
				icon: "⚖️",
				title: "Expert Representation",
				description: "Experienced legal counsel with a proven track record of successful outcomes.",
			},
			{
				icon: "🛡️",
				title: "Comprehensive Protection",
				description: "Full-service legal support to protect your interests and minimize risk.",
			},
			{
				icon: "📋",
				title: "Strategic Guidance",
				description: "Clear, actionable legal advice to help you make informed decisions.",
			},
		],
	};

	// Determine business type and select appropriate features
	let selectedFeatures: Feature[] = [];
	
	if (lowerPrompt.includes("studio") || lowerPrompt.includes("design") || lowerPrompt.includes("portfolio")) {
		selectedFeatures = featureSets.design;
	} else if (lowerPrompt.includes("consulting") || lowerPrompt.includes("consultant")) {
		selectedFeatures = featureSets.consulting;
	} else if (lowerPrompt.includes("agency") || lowerPrompt.includes("development")) {
		selectedFeatures = featureSets.agency;
	} else if (lowerPrompt.includes("restaurant") || lowerPrompt.includes("cafe") || lowerPrompt.includes("food")) {
		selectedFeatures = featureSets.restaurant;
	} else if (lowerPrompt.includes("law") || lowerPrompt.includes("legal") || lowerPrompt.includes("attorney")) {
		selectedFeatures = featureSets.legal;
	} else {
		// Default professional features
		selectedFeatures = [
			{
				icon: "🎯",
				title: "Professional Service",
				description: "High-quality solutions tailored to your specific business needs and requirements.",
			},
			{
				icon: "👥",
				title: "Expert Team",
				description: "Experienced professionals dedicated to delivering exceptional results for your projects.",
			},
			{
				icon: "🛠️",
				title: "Reliable Support",
				description: "Ongoing support and maintenance to ensure your solutions continue to perform optimally.",
			},
		];
	}

	// Return requested number of features
	return selectedFeatures.slice(0, Math.min(count, selectedFeatures.length));
}

export default {
	generateSiteConfig,
	generateSiteConfigFromMCP,
	validateArtifact,
	verifyWebhookSignature,
};
