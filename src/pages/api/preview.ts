// Preview API endpoint for LLM-generated site configurations
// POST /api/preview - Generate and validate site config from prompt

import type { APIRoute } from "astro";
import { createLLMRequest, mockLLMGenerate, parseAndValidateLLMResponse } from "../../lib/llm-client.js";
import { validateContentLimits, validateSecurityConstraints } from "../../lib/schemas.js";
import { recordLLMRequest, recordValidationResult, recordError } from "./monitor.js";

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
	config?: any;
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
		tokenUsage?: any;
	};
	error?: string;
}

export const POST: APIRoute = async ({ request }) => {
	const startTime = Date.now();
	
	try {
		// Parse request body
		const body = await request.json() as PreviewRequest;
		
		if (!body.prompt?.trim()) {
			return new Response(
				JSON.stringify({
					success: false,
					error: "Prompt is required",
				} as PreviewResponse),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				}
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
				}
			);
		}

		// Create LLM request
		const llmRequest = createLLMRequest(body.prompt);

		// Generate response using mock LLM
		const llmResponse = await mockLLMGenerate(llmRequest);

		// Parse and validate response
		const parseResult = parseAndValidateLLMResponse(llmResponse);
		
		const response: PreviewResponse = {
			success: parseResult.success,
			metadata: {
				promptLength: body.prompt.length,
				responseTime: Date.now() - startTime,
				tokenUsage: llmResponse.usage,
			},
		};

		if (parseResult.success && parseResult.data) {
			// Additional validation checks
			const contentValidation = validateContentLimits(parseResult.data);
			const securityValidation = validateSecurityConstraints(parseResult.data);
			
			// Record validation metrics
			recordValidationResult("schema", true);
			recordValidationResult("content", contentValidation.valid, contentValidation.warnings.length);
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
				errors: [parseResult.parseError || parseResult.validationError || "Unknown error"],
			};
		}

		const statusCode = response.success ? 200 : 400;
		
		return new Response(
			JSON.stringify(response, null, 2),
			{
				status: statusCode,
				headers: {
					"Content-Type": "application/json",
					"Cache-Control": "no-cache",
				},
			}
		);

	} catch (error) {
		console.error("Preview API error:", error);
		recordError("llm_generation", error.message);
		
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
			}
		);
	}
};

// GET endpoint for API documentation
export const GET: APIRoute = async () => {
	const docs = {
		endpoint: "/api/preview",
		method: "POST",
		description: "Generate and validate site configuration from natural language prompt",
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
				prompt: "Build a consulting website for Apex Advisory with 4 features and contact page",
				description: "Generates a business consulting site with specific requirements",
			},
		],
	};

	return new Response(JSON.stringify(docs, null, 2), {
		headers: { "Content-Type": "application/json" },
	});
};