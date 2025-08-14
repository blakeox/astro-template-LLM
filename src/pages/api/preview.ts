// Preview API endpoint for LLM-generated site configurations
// POST /api/preview - Generate and validate site config from prompt

import type { APIRoute } from "astro";
import { isMcpEnabled } from "../../lib/env.js";
import {
	type LLMResponse,
	createLLMRequest,
	mockLLMGenerate,
	parseAndValidateLLMResponse,
} from "../../lib/llm-client.js";
import { generateSiteConfig } from "../../lib/mcp-client.js";
import {
	type SiteConfig,
	validateContentLimits,
	validateSecurityConstraints,
} from "../../lib/schemas.js";
import {
	recordError,
	recordLLMRequest,
	recordValidationResult,
} from "./monitor.js";

export interface PreviewRequest {
	prompt: string;
	options?: {
		includeAbout?: boolean;
		includeContact?: boolean;
		includeServices?: boolean;
		maxFeatures?: number;
	};
}

export interface PreviewResponse {
	success: boolean;
	config?: SiteConfig;
	validationResult?: {
		schemaValid: boolean;
		contentValid: boolean;
		securityValid: boolean;
		warnings: string[];
		errors: string[];
	};
	metadata?: {
		promptLength: number;
		responseTime: number;
		tokenUsage?: LLMResponse["usage"];
	};
	error?: string;
}

export const POST: APIRoute = async ({ request }) => {
	const startTime = Date.now();

	try {
		// Parse request body
		const body = (await request.json()) as PreviewRequest;

		if (!body.prompt?.trim()) {
			return new Response(
				JSON.stringify({
					success: false,
					error: "Prompt is required",
				} as PreviewResponse),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		// Rate limiting check (basic)
		if (body.prompt.length > 2000) {
			return new Response(
				JSON.stringify({
					success: false,
					error: "Prompt too long (max 2000 characters)",
				} as PreviewResponse),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		let parseResult: ReturnType<typeof parseAndValidateLLMResponse>;

		if (isMcpEnabled) {
			// Use MCP server to generate a SiteConfig directly
			const mcp = await generateSiteConfig(body.prompt, {
				maxFeatures: body.options?.maxFeatures,
			});
			if (!mcp.success || !mcp.data) {
				return new Response(
					JSON.stringify({
						success: false,
						error: mcp.error || "MCP generation failed",
					} as PreviewResponse),
					{ status: 502, headers: { "Content-Type": "application/json" } },
				);
			}
			// Wrap into the shape expected by existing validators
			parseResult = {
				success: true,
				data: mcp.data,
				warnings: [],
				rawContent: JSON.stringify(mcp.data),
			};
		} else {
			// Local mock LLM flow
			const llmRequest = createLLMRequest(body.prompt);
			const llmResponse = await mockLLMGenerate(llmRequest);
			parseResult = parseAndValidateLLMResponse(llmResponse);
		}

		const response: PreviewResponse = {
			success: parseResult.success,
			metadata: {
				promptLength: body.prompt.length,
				responseTime: Date.now() - startTime,
				// tokenUsage is only available in mock LLM mode; MCP may provide tokens in future
			},
		};

		if (parseResult.success && parseResult.data) {
			// Additional validation checks
			const contentValidation = validateContentLimits(parseResult.data);
			const securityValidation = validateSecurityConstraints(parseResult.data);

			// Record validation metrics
			recordValidationResult("schema", true);
			recordValidationResult(
				"content",
				contentValidation.valid,
				contentValidation.warnings.length,
			);
			recordValidationResult("security", securityValidation.valid);

			if (!securityValidation.valid) {
				for (const error of securityValidation.errors) {
					recordError("security_violation", error, body.prompt.length);
				}
			}

			response.config = parseResult.data;
			response.validationResult = {
				schemaValid: true,
				contentValid: contentValidation.valid,
				securityValid: securityValidation.valid,
				warnings: [
					...(parseResult.warnings || []),
					...contentValidation.warnings,
				],
				errors: securityValidation.errors,
			};
		} else {
			recordValidationResult("schema", false);

			response.validationResult = {
				schemaValid: false,
				contentValid: false,
				securityValid: false,
				warnings: parseResult.warnings || [],
				errors: [
					parseResult.parseError ||
						parseResult.validationError ||
						"Unknown error",
				],
			};
		}

		const statusCode = response.success ? 200 : 400;

		return new Response(JSON.stringify(response, null, 2), {
			status: statusCode,
			headers: {
				"Content-Type": "application/json",
				"Cache-Control": "no-cache",
			},
		});
	} catch (error) {
		console.error("Preview API error:", error);
		recordError(
			"llm_generation",
			error instanceof Error ? error.message : String(error),
		);

		return new Response(
			JSON.stringify({
				success: false,
				error: "Internal server error",
				metadata: {
					responseTime: Date.now() - startTime,
				},
			} as PreviewResponse),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
};

// GET endpoint for API documentation
export const GET: APIRoute = async () => {
	const docs = {
		endpoint: "/api/preview",
		method: "POST",
		description:
			"Generate and validate site configuration from natural language prompt",
		request: {
			prompt: "string (required, max 2000 chars)",
			options: {
				includeAbout: "boolean (optional)",
				includeContact: "boolean (optional)",
				includeServices: "boolean (optional)",
				maxFeatures: "number (optional, 1-6)",
			},
		},
		response: {
			success: "boolean",
			config: "SiteConfig object (if successful)",
			validationResult: {
				schemaValid: "boolean",
				contentValid: "boolean",
				securityValid: "boolean",
				warnings: "string[]",
				errors: "string[]",
			},
			metadata: {
				promptLength: "number",
				responseTime: "number",
				tokenUsage: "object",
			},
		},
		examples: [
			{
				prompt: "Create a portfolio site for 'Design Studio Pro'",
				description: "Generates a creative design studio site",
			},
			{
				prompt:
					"Build a consulting website for Apex Advisory with 4 features and contact page",
				description:
					"Generates a business consulting site with specific requirements",
			},
		],
	};

	return new Response(JSON.stringify(docs, null, 2), {
		headers: { "Content-Type": "application/json" },
	});
};
