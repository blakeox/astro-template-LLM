// Minimal LLM Client for JSON Parsing and Schema Validation
// This module provides a simple interface for LLM integration with proper validation

import { SiteConfigSchema, type SiteConfig } from "./schemas.js";
import type { MCPResponse, ValidationResult } from "./mcp-client.js";

export interface LLMClientOptions {
	model?: string;
	temperature?: number;
	maxTokens?: number;
	timeout?: number;
}

export interface LLMRequest {
	prompt: string;
	systemPrompt?: string;
	options?: LLMClientOptions;
}

export interface LLMResponse {
	content: string;
	usage?: {
		promptTokens: number;
		completionTokens: number;
		totalTokens: number;
	};
	model?: string;
	finishReason?: string;
}

export interface ParsedLLMResponse<T = SiteConfig> {
	success: boolean;
	data?: T;
	rawContent: string;
	parseError?: string;
	validationError?: string;
	warnings?: string[];
}

/**
 * Parse and validate LLM response as JSON
 */
export function parseAndValidateLLMResponse(
	response: LLMResponse,
	schema = SiteConfigSchema
): ParsedLLMResponse<SiteConfig> {
	const result: ParsedLLMResponse<SiteConfig> = {
		success: false,
		rawContent: response.content,
	};

	try {
		// Extract JSON from response content
		const jsonContent = extractJSONFromContent(response.content);
		if (!jsonContent) {
			result.parseError = "No valid JSON found in LLM response";
			return result;
		}

		// Parse JSON
		let parsedData: unknown;
		try {
			parsedData = JSON.parse(jsonContent);
		} catch (parseError) {
			result.parseError = `JSON parse error: ${parseError.message}`;
			return result;
		}

		// Validate against schema
		const validation = schema.safeParse(parsedData);
		if (!validation.success) {
			result.validationError = validation.error.errors
				.map(err => `${err.path.join('.')}: ${err.message}`)
				.join('; ');
			return result;
		}

		result.success = true;
		result.data = validation.data;
		return result;

	} catch (error) {
		result.parseError = `Unexpected error: ${error.message}`;
		return result;
	}
}

/**
 * Extract JSON content from LLM response that may contain extra text
 */
function extractJSONFromContent(content: string): string | null {
	// Try to find JSON block markers first
	const jsonBlockMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/i);
	if (jsonBlockMatch) {
		return jsonBlockMatch[1].trim();
	}

	// Look for JSON object boundaries
	const jsonMatch = content.match(/\{[\s\S]*\}/);
	if (jsonMatch) {
		return jsonMatch[0].trim();
	}

	// Try to extract from start/end if it looks like pure JSON
	const trimmed = content.trim();
	if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
		return trimmed;
	}

	return null;
}

/**
 * Sanitize LLM-generated content to remove potential security risks
 */
export function sanitizeLLMContent(content: string): string {
	// Remove potentially dangerous patterns
	const sanitized = content
		// Remove script tags
		.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
		// Remove on* event handlers
		.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
		// Remove javascript: protocols
		.replace(/javascript:/gi, '')
		// Remove data: protocols (except safe image formats)
		.replace(/data:(?!image\/(?:png|jpg|jpeg|gif|svg|webp))[^,]*,/gi, '');

	return sanitized.trim();
}

/**
 * Create an LLM request with proper system prompt and validation
 */
export function createLLMRequest(
	userPrompt: string,
	systemPromptPath?: string
): LLMRequest {
	// Basic input validation
	if (!userPrompt?.trim()) {
		throw new Error("User prompt is required");
	}

	if (userPrompt.length > 2000) {
		throw new Error("User prompt is too long (max 2000 characters)");
	}

	// Sanitize the prompt
	const sanitizedPrompt = sanitizeLLMContent(userPrompt);

	// Default system prompt for site config generation
	const defaultSystemPrompt = `You are an expert website generator specialized in creating production-ready Astro websites. 
Generate valid site configurations that strictly conform to the JSON schema.

Rules:
1. Return ONLY valid JSON that matches the schema
2. Keep hero titles under 8 words (60 chars max)
3. Keep feature descriptions under 120 characters
4. Never include API keys, secrets, or sensitive data
5. Use professional, business-appropriate language
6. Always provide alt text for images
7. Use placeholder contact information (no real data)

Respond with a JSON object that validates against /site.config.schema.json`;

	return {
		prompt: sanitizedPrompt,
		systemPrompt: defaultSystemPrompt,
		options: {
			model: "mock-gpt-4",
			temperature: 0.7,
			maxTokens: 2000,
			timeout: 30000,
		},
	};
}

/**
 * Mock LLM client for development/testing
 * In production, this would integrate with actual LLM providers
 */
export async function mockLLMGenerate(request: LLMRequest): Promise<LLMResponse> {
	// Simulate API delay
	await new Promise(resolve => setTimeout(resolve, 100));

	// Generate a mock response based on the prompt
	const mockSiteConfig = generateMockSiteConfig(request.prompt);

	return {
		content: JSON.stringify(mockSiteConfig, null, 2),
		usage: {
			promptTokens: request.prompt.length / 4, // Rough token estimation
			completionTokens: 500,
			totalTokens: (request.prompt.length / 4) + 500,
		},
		model: request.options?.model || "mock-gpt-4",
		finishReason: "stop",
	};
}

/**
 * Generate a mock site configuration for testing
 */
function generateMockSiteConfig(prompt: string): SiteConfig {
	const siteName = extractSiteName(prompt) || "Generated Site";
	const siteType = detectSiteType(prompt);

	const mockConfig: SiteConfig = {
		name: siteName,
		description: generateDescription(siteName, siteType),
		pages: {
			home: {
				hero: {
					title: generateHeroTitle(siteName, siteType),
					subtitle: generateHeroSubtitle(siteType),
				},
				features: generateFeatures(siteType, 3),
			},
		},
	};

	// Add optional pages based on prompt
	if (prompt.toLowerCase().includes("about")) {
		mockConfig.pages.about = {
			blurb: generateAboutBlurb(siteName, siteType),
		};
	}

	if (prompt.toLowerCase().includes("contact")) {
		mockConfig.pages.contact = {
			emailPlaceholder: "Enter your email address",
		};
	}

	return mockConfig;
}

// Helper functions for mock generation
function extractSiteName(prompt: string): string | null {
	const patterns = [
		/for ["']([^"']+)["']/i,
		/called ["']([^"']+)["']/i,
		/named ["']([^"']+)["']/i,
		/site for "([^"]+)"/i,
		/website for "([^"]+)"/i,
		/for ([A-Z][A-Za-z\s]+?)(?:\s+with|\s+-|\s*$)/i,
	];

	for (const pattern of patterns) {
		const match = prompt.match(pattern);
		if (match?.[1] && match[1].length < 50) {
			return match[1].trim();
		}
	}
	return null;
}

function detectSiteType(prompt: string): string {
	const lowerPrompt = prompt.toLowerCase();
	if (lowerPrompt.includes("studio")) return "studio";
	if (lowerPrompt.includes("agency")) return "agency";
	if (lowerPrompt.includes("consulting")) return "consulting";
	if (lowerPrompt.includes("portfolio")) return "portfolio";
	if (lowerPrompt.includes("restaurant")) return "restaurant";
	if (lowerPrompt.includes("company")) return "company";
	return "business";
}

function generateDescription(siteName: string, siteType: string): string {
	const descriptions = {
		studio: "Creative design studio providing innovative solutions for modern brands",
		agency: "Full-service digital agency delivering results-driven marketing solutions",
		consulting: "Strategic business consulting firm helping companies achieve growth",
		portfolio: "Professional portfolio showcasing exceptional work and capabilities",
		restaurant: "Fine dining restaurant offering exceptional culinary experiences",
		company: "Professional company website highlighting services and expertise",
		business: "Professional business website providing quality services to clients",
	};
	
	return descriptions[siteType] || descriptions.business;
}

function generateHeroTitle(siteName: string, siteType: string): string {
	const templates = {
		studio: `Creative Solutions by ${siteName}`,
		agency: `Digital Growth with ${siteName}`,
		consulting: `Strategic Success with ${siteName}`,
		portfolio: `Professional Work by ${siteName}`,
		company: `Welcome to ${siteName}`,
		business: `Professional Services by ${siteName}`,
	};
	
	return templates[siteType] || templates.business;
}

function generateHeroSubtitle(siteType: string): string {
	const subtitles = {
		studio: "We transform your brand vision into stunning digital experiences that captivate and convert.",
		agency: "Data-driven marketing strategies and creative solutions that drive measurable business growth.",
		consulting: "Expert consulting services to optimize operations, increase profitability, and achieve sustainable growth.",
		portfolio: "Showcasing exceptional work and proven results across diverse projects and industries.",
		company: "Professional services and solutions tailored to meet your specific business needs and goals.",
		business: "Quality services and expert solutions to help your business succeed in today's competitive market.",
	};
	
	return subtitles[siteType] || subtitles.business;
}

function generateFeatures(siteType: string, count: number): Feature[] {
	const featuresByType = {
		studio: [
			{ icon: "🎨", title: "Brand Design", description: "Complete brand identity packages including logos, typography, and visual guidelines." },
			{ icon: "💻", title: "Web Development", description: "Modern, responsive websites built with cutting-edge technology and performance optimization." },
			{ icon: "📱", title: "Digital Strategy", description: "Data-driven marketing strategies that help your brand reach and engage the right audience." },
		],
		agency: [
			{ icon: "📊", title: "Analytics & Insights", description: "Deep data analysis and reporting to guide strategic marketing decisions and optimization." },
			{ icon: "🚀", title: "Growth Marketing", description: "Scalable marketing systems designed to drive sustainable business growth and customer acquisition." },
			{ icon: "🎯", title: "Targeted Campaigns", description: "Precision-targeted advertising campaigns that maximize ROI and reach your ideal customers." },
		],
		consulting: [
			{ icon: "📈", title: "Strategic Planning", description: "Comprehensive business strategy development to align operations with long-term growth objectives." },
			{ icon: "⚡", title: "Process Optimization", description: "Streamline operations and eliminate inefficiencies to boost productivity and reduce costs." },
			{ icon: "🤝", title: "Change Management", description: "Expert guidance through organizational transformations and business restructuring." },
		],
		business: [
			{ icon: "🎯", title: "Professional Service", description: "High-quality solutions tailored to your specific business needs and requirements." },
			{ icon: "👥", title: "Expert Team", description: "Experienced professionals dedicated to delivering excellence in every project." },
			{ icon: "🛠️", title: "Reliable Support", description: "Ongoing support and maintenance to ensure optimal performance and satisfaction." },
		],
	};
	
	const features = featuresByType[siteType] || featuresByType.business;
	return features.slice(0, count);
}

function generateAboutBlurb(siteName: string, siteType: string): string {
	const blurbs = {
		studio: `${siteName} is a creative design studio specializing in brand identity and digital experiences. We help businesses shine brighter in the digital landscape.`,
		agency: `${siteName} is a full-service digital agency focused on delivering measurable results. We combine creativity with data-driven strategies to accelerate business growth.`,
		consulting: `${siteName} provides strategic business consulting services to help companies optimize operations and achieve sustainable growth. Our experienced team delivers proven solutions.`,
		portfolio: `${siteName} showcases exceptional work across diverse industries and projects. We bring expertise, creativity, and proven results to every engagement.`,
		company: `${siteName} is a professional company dedicated to providing quality services and solutions. We help businesses succeed through expertise and reliability.`,
		business: `${siteName} delivers professional services and expert solutions to help businesses grow. We are committed to excellence and customer satisfaction.`,
	};
	
	return blurbs[siteType] || blurbs.business;
}

export default {
	parseAndValidateLLMResponse,
	createLLMRequest,
	mockLLMGenerate,
	sanitizeLLMContent,
	extractJSONFromContent,
};