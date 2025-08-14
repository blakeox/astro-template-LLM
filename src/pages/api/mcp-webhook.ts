// Webhook endpoint for MCP server integration
import type { APIRoute } from "astro";
import { verifyWebhookSignature, validateArtifact } from "../../lib/mcp-client.js";
import { getMCPConfig } from "../../lib/mcp-config.js";

export const POST: APIRoute = async ({ request }) => {
	try {
		const { config } = getMCPConfig();
		
		// Check if webhooks are enabled
		if (!config.enableWebhooks) {
			return new Response(JSON.stringify({ 
				error: "Webhooks not enabled" 
			}), {
				status: 403,
				headers: { "Content-Type": "application/json" }
			});
		}

		// Verify webhook signature
		const body = await request.text();
		const signature = request.headers.get("x-signature-256") || "";
		
		if (!config.webhookSecret) {
			return new Response(JSON.stringify({ 
				error: "Webhook secret not configured" 
			}), {
				status: 500,
				headers: { "Content-Type": "application/json" }
			});
		}

		const isValidSignature = verifyWebhookSignature(body, signature, config.webhookSecret);
		if (!isValidSignature) {
			return new Response(JSON.stringify({ 
				error: "Invalid webhook signature" 
			}), {
				status: 401,
				headers: { "Content-Type": "application/json" }
			});
		}

		// Parse webhook payload
		let payload: { type: string; data: unknown };
		try {
			payload = JSON.parse(body);
		} catch (error) {
			return new Response(JSON.stringify({ 
				error: "Invalid JSON payload" 
			}), {
				status: 400,
				headers: { "Content-Type": "application/json" }
			});
		}

		// Validate the webhook payload structure
		if (!payload.type || !payload.data) {
			return new Response(JSON.stringify({ 
				error: "Missing required fields: type, data" 
			}), {
				status: 400,
				headers: { "Content-Type": "application/json" }
			});
		}

		// Handle different webhook types
		switch (payload.type) {
			case "site-config-generated": {
				// Validate the generated site config
				const validation = await validateArtifact(payload.data);
				
				return new Response(JSON.stringify({
					success: true,
					validation: {
						valid: validation.valid,
						errors: validation.errors || [],
						warnings: validation.warnings || []
					},
					metadata: {
						timestamp: new Date().toISOString(),
						processed: true
					}
				}), {
					status: 200,
					headers: { "Content-Type": "application/json" }
				});
			}

			case "site-config-update": {
				// Handle site config updates
				const validation = await validateArtifact(payload.data);
				
				if (!validation.valid) {
					return new Response(JSON.stringify({
						success: false,
						error: "Invalid site configuration",
						validation: {
							valid: false,
							errors: validation.errors || []
						}
					}), {
						status: 400,
						headers: { "Content-Type": "application/json" }
					});
				}

				// In a real implementation, you might save this to a database
				// or trigger a deployment pipeline
				
				return new Response(JSON.stringify({
					success: true,
					message: "Site configuration updated successfully",
					validation: {
						valid: true,
						warnings: validation.warnings || []
					}
				}), {
					status: 200,
					headers: { "Content-Type": "application/json" }
				});
			}

			default:
				return new Response(JSON.stringify({ 
					error: `Unknown webhook type: ${payload.type}` 
				}), {
					status: 400,
					headers: { "Content-Type": "application/json" }
				});
		}

	} catch (error) {
		console.error("Webhook processing error:", error);
		return new Response(JSON.stringify({ 
			error: "Internal server error" 
		}), {
			status: 500,
			headers: { "Content-Type": "application/json" }
		});
	}
};

// Health check endpoint
export const GET: APIRoute = async () => {
	const { config, validation } = getMCPConfig();
	
	return new Response(JSON.stringify({
		status: "healthy",
		webhooks: {
			enabled: config.enableWebhooks,
			configured: !!config.webhookSecret
		},
		mcp: {
			serverConfigured: !!config.serverUrl,
			validation: validation.valid
		},
		timestamp: new Date().toISOString()
	}), {
		status: 200,
		headers: { "Content-Type": "application/json" }
	});
};