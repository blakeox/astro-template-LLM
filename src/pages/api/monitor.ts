// Monitoring endpoint for LLM prompt/response errors and validation failures
// GET /api/monitor - View metrics and health status

import type { APIRoute } from "astro";

// In-memory metrics store (in production, use proper metrics service)
interface MetricsData {
	llm: {
		totalRequests: number;
		successfulRequests: number;
		failedRequests: number;
		averageResponseTime: number;
		totalTokensUsed: number;
	};
	validation: {
		totalValidations: number;
		schemaValidationFailures: number;
		contentValidationWarnings: number;
		securityValidationFailures: number;
	};
	errors: Array<{
		timestamp: string;
		type:
			| "llm_generation"
			| "json_parse"
			| "schema_validation"
			| "security_violation";
		error: string;
		promptLength?: number;
	}>;
}

const metrics: MetricsData = {
	llm: {
		totalRequests: 0,
		successfulRequests: 0,
		failedRequests: 0,
		averageResponseTime: 0,
		totalTokensUsed: 0,
	},
	validation: {
		totalValidations: 0,
		schemaValidationFailures: 0,
		contentValidationWarnings: 0,
		securityValidationFailures: 0,
	},
	errors: [],
};

export const GET: APIRoute = async ({ url }) => {
	const format = url.searchParams.get("format") || "summary";
	const limit = Number.parseInt(url.searchParams.get("limit") || "50", 10);

	switch (format) {
		case "detailed": {
			return new Response(JSON.stringify(metrics, null, 2), {
				headers: {
					"Content-Type": "application/json",
					"Cache-Control": "no-cache",
				},
			});
		}

		case "errors": {
			const recentErrors = metrics.errors.slice(-limit);
			return new Response(
				JSON.stringify(
					{
						total: metrics.errors.length,
						errors: recentErrors,
					},
					null,
					2,
				),
				{
					headers: {
						"Content-Type": "application/json",
						"Cache-Control": "no-cache",
					},
				},
			);
		}

		case "health": {
			const health = {
				status: "healthy",
				checks: {
					llm: {
						status:
							metrics.llm.failedRequests /
								Math.max(metrics.llm.totalRequests, 1) <
							0.1
								? "healthy"
								: "degraded",
						successRate:
							metrics.llm.totalRequests > 0
								? `${(
										(metrics.llm.successfulRequests /
											metrics.llm.totalRequests) *
											100
									).toFixed(2)}%`
								: "N/A",
					},
					validation: {
						status:
							metrics.validation.securityValidationFailures === 0
								? "healthy"
								: "warning",
						schemaFailureRate:
							metrics.validation.totalValidations > 0
								? `${(
										(metrics.validation.schemaValidationFailures /
											metrics.validation.totalValidations) *
											100
									).toFixed(2)}%`
								: "N/A",
					},
				},
				uptime: "N/A", // Would track actual uptime in production
				timestamp: new Date().toISOString(),
			};

			const statusCode =
				health.checks.llm.status === "healthy" &&
				health.checks.validation.status === "healthy"
					? 200
					: 503;

			return new Response(JSON.stringify(health, null, 2), {
				status: statusCode,
				headers: {
					"Content-Type": "application/json",
					"Cache-Control": "no-cache",
				},
			});
		}

		default: {
			// Summary format
			const summary = {
				overview: {
					totalLLMRequests: metrics.llm.totalRequests,
					llmSuccessRate:
						metrics.llm.totalRequests > 0
							? `${(
									(metrics.llm.successfulRequests / metrics.llm.totalRequests) *
										100
								).toFixed(2)}%`
							: "N/A",
					totalValidations: metrics.validation.totalValidations,
					recentErrors: metrics.errors.length,
				},
				performance: {
					averageResponseTime: `${metrics.llm.averageResponseTime}ms`,
					totalTokensUsed: metrics.llm.totalTokensUsed,
					averageTokensPerRequest:
						metrics.llm.totalRequests > 0
							? Math.round(
									metrics.llm.totalTokensUsed / metrics.llm.totalRequests,
								)
							: 0,
				},
				quality: {
					schemaValidationFailures: metrics.validation.schemaValidationFailures,
					contentWarnings: metrics.validation.contentValidationWarnings,
					securityViolations: metrics.validation.securityValidationFailures,
				},
				endpoints: {
					detailed: "/api/monitor?format=detailed",
					errors: "/api/monitor?format=errors&limit=100",
					health: "/api/monitor?format=health",
				},
			};

			return new Response(JSON.stringify(summary, null, 2), {
				headers: {
					"Content-Type": "application/json",
					"Cache-Control": "no-cache",
				},
			});
		}
	}
};

// Utility functions for updating metrics (called from other API endpoints)
export function recordLLMRequest(
	success: boolean,
	responseTime: number,
	tokenUsage?: { totalTokens?: number } | null,
): void {
	metrics.llm.totalRequests++;

	if (success) {
		metrics.llm.successfulRequests++;
	} else {
		metrics.llm.failedRequests++;
	}

	// Update average response time
	const totalResponseTime =
		metrics.llm.averageResponseTime * (metrics.llm.totalRequests - 1) +
		responseTime;
	metrics.llm.averageResponseTime = Math.round(
		totalResponseTime / metrics.llm.totalRequests,
	);

	if (tokenUsage?.totalTokens) {
		metrics.llm.totalTokensUsed += tokenUsage.totalTokens;
	}
}

export function recordValidationResult(
	type: "schema" | "content" | "security",
	success: boolean,
	warningCount = 0,
): void {
	metrics.validation.totalValidations++;

	switch (type) {
		case "schema":
			if (!success) metrics.validation.schemaValidationFailures++;
			break;
		case "content":
			if (warningCount > 0)
				metrics.validation.contentValidationWarnings += warningCount;
			break;
		case "security":
			if (!success) metrics.validation.securityValidationFailures++;
			break;
	}
}

export function recordError(
	type:
		| "llm_generation"
		| "json_parse"
		| "schema_validation"
		| "security_violation",
	error: string,
	promptLength?: number,
): void {
	metrics.errors.push({
		timestamp: new Date().toISOString(),
		type,
		error: error.substring(0, 500), // Limit error message length
		promptLength,
	});

	// Keep only last 1000 errors to prevent memory issues
	if (metrics.errors.length > 1000) {
		metrics.errors.splice(0, metrics.errors.length - 1000);
	}
}

// Export metrics for testing
export function getMetrics(): MetricsData {
	return { ...metrics };
}

export function resetMetrics(): void {
	metrics.llm.totalRequests = 0;
	metrics.llm.successfulRequests = 0;
	metrics.llm.failedRequests = 0;
	metrics.llm.averageResponseTime = 0;
	metrics.llm.totalTokensUsed = 0;
	metrics.validation.totalValidations = 0;
	metrics.validation.schemaValidationFailures = 0;
	metrics.validation.contentValidationWarnings = 0;
	metrics.validation.securityValidationFailures = 0;
	metrics.errors.length = 0;
}
