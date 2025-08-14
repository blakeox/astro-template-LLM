// Webhook handler for LLM integration callbacks
// POST /api/webhook/llm - Handle async LLM responses and events

import type { APIRoute } from "astro";
import { parseAndValidateLLMResponse } from "../../../lib/llm-client.js";
import type { LLMResponse } from "../../../lib/llm-client.js";
import { verifyWebhookSignature } from "../../../lib/mcp-client.js";
import type { SiteConfig } from "../../../lib/schemas.js";
import {
	validateContentLimits,
	validateSecurityConstraints,
} from "../../../lib/schemas.js";

export interface WebhookPayload {
	event: "generation.completed" | "generation.failed" | "validation.requested";
	requestId: string;
	timestamp: string;
	data?: {
		prompt?: string;
		response?: LLMResponse | unknown;
		config?: SiteConfig | unknown;
		errors?: string[];
	};
}

export interface WebhookResponse {
	received: boolean;
	processed: boolean;
	requestId: string;
	validationResult?: {
		valid: boolean;
		warnings: string[];
		errors: string[];
	};
	error?: string;
}

// Log sink for validation results (in production, this would go to a proper log store)
const validationLogs: Array<{
	timestamp: string;
	requestId: string;
	event: string;
	valid: boolean;
	errors: string[];
	warnings: string[];
}> = [];

export const POST: APIRoute = async ({ request }) => {
	try {
		// Get webhook signature from headers
		const signature = request.headers.get("x-webhook-signature");
		const webhookSecret = process.env.WEBHOOK_SECRET;

		if (!signature) {
			return new Response(
				JSON.stringify({ error: "Missing webhook signature" }),
				{
					status: 401,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		// Read the payload
		const payloadText = await request.text();

		// Verify webhook signature if secret is configured
		if (webhookSecret) {
			const isValid = verifyWebhookSignature(
				payloadText,
				signature,
				webhookSecret,
			);
			if (!isValid) {
				return new Response(
					JSON.stringify({ error: "Invalid webhook signature" }),
					{
						status: 401,
						headers: { "Content-Type": "application/json" },
					},
				);
			}
		}

		// Parse webhook payload
		let payload: WebhookPayload;
		try {
			payload = JSON.parse(payloadText);
		} catch (error) {
			return new Response(JSON.stringify({ error: "Invalid JSON payload" }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		// Process webhook based on event type
		const response: WebhookResponse = {
			received: true,
			processed: false,
			requestId: payload.requestId,
		};

		try {
			switch (payload.event) {
				case "generation.completed": {
					if (payload.data?.response) {
						// Parse and validate the LLM response
						const parseResult = parseAndValidateLLMResponse(
							payload.data.response as LLMResponse,
						);

						if (parseResult.success && parseResult.data) {
							// Additional validation
							const contentValidation = validateContentLimits(parseResult.data);
							const securityValidation = validateSecurityConstraints(
								parseResult.data,
							);

							response.validationResult = {
								valid: contentValidation.valid && securityValidation.valid,
								warnings: [
									...(parseResult.warnings || []),
									...contentValidation.warnings,
								],
								errors: securityValidation.errors,
							};
						} else {
							response.validationResult = {
								valid: false,
								warnings: parseResult.warnings || [],
								errors: [
									parseResult.parseError ||
										parseResult.validationError ||
										"Validation failed",
								],
							};
						}
					}

					response.processed = true;
					break;
				}

				case "generation.failed": {
					// Log the failure for monitoring
					logValidationResult(
						payload.requestId,
						"generation.failed",
						false,
						payload.data?.errors || ["Generation failed"],
						[],
					);

					response.processed = true;
					break;
				}

				case "validation.requested": {
					if (payload.data?.config) {
						// Validate provided config
						const contentValidation = validateContentLimits(
							payload.data.config as SiteConfig,
						);
						const securityValidation = validateSecurityConstraints(
							payload.data.config as SiteConfig,
						);

						response.validationResult = {
							valid: contentValidation.valid && securityValidation.valid,
							warnings: contentValidation.warnings,
							errors: securityValidation.errors,
						};
					}

					response.processed = true;
					break;
				}

				default:
					response.error = `Unknown event type: ${payload.event}`;
			}

			// Log the validation result
			if (response.validationResult) {
				logValidationResult(
					payload.requestId,
					payload.event,
					response.validationResult.valid,
					response.validationResult.errors,
					response.validationResult.warnings,
				);
			}
		} catch (processingError) {
			console.error("Webhook processing error:", processingError);
			response.error = "Failed to process webhook";
		}

		const statusCode = response.error ? 400 : 200;

		return new Response(JSON.stringify(response, null, 2), {
			status: statusCode,
			headers: {
				"Content-Type": "application/json",
			},
		});
	} catch (error) {
		console.error("Webhook handler error:", error);

		return new Response(
			JSON.stringify({
				received: false,
				processed: false,
				error: "Internal server error",
			} as WebhookResponse),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
};

/**
 * Log validation results for monitoring and analysis
 */
function logValidationResult(
	requestId: string,
	event: string,
	valid: boolean,
	errors: string[],
	warnings: string[],
): void {
	const logEntry = {
		timestamp: new Date().toISOString(),
		requestId,
		event,
		valid,
		errors,
		warnings,
	};

	// Store in memory for development (in production, use proper logging service)
	validationLogs.push(logEntry);

	// Keep only last 1000 entries to prevent memory issues
	if (validationLogs.length > 1000) {
		validationLogs.splice(0, validationLogs.length - 1000);
	}

	// Log to console for development
	console.log(
		`[${logEntry.timestamp}] ${event} - ${requestId}: ${valid ? "VALID" : "INVALID"}`,
	);
	if (errors.length > 0) {
		console.error(`  Errors: ${errors.join(", ")}`);
	}
	if (warnings.length > 0) {
		console.warn(`  Warnings: ${warnings.join(", ")}`);
	}
}

/**
 * Get validation logs for monitoring (GET endpoint)
 */
export const GET: APIRoute = async ({ url }) => {
	const limit = Number.parseInt(url.searchParams.get("limit") || "50", 10);
	const validLimit = Math.min(Math.max(limit, 1), 1000);

	const logs = validationLogs.slice(-validLimit);

	const summary = {
		total: validationLogs.length,
		valid: validationLogs.filter((log) => log.valid).length,
		invalid: validationLogs.filter((log) => !log.valid).length,
		recentLogs: logs,
		stats: {
			successRate:
				validationLogs.length > 0
					? `${(
							(validationLogs.filter((log) => log.valid).length /
								validationLogs.length) *
								100
						).toFixed(2)}%`
					: "N/A",
			totalErrors: validationLogs.reduce(
				(sum, log) => sum + log.errors.length,
				0,
			),
			totalWarnings: validationLogs.reduce(
				(sum, log) => sum + log.warnings.length,
				0,
			),
		},
	};

	return new Response(JSON.stringify(summary, null, 2), {
		headers: {
			"Content-Type": "application/json",
			"Cache-Control": "no-cache",
		},
	});
};
