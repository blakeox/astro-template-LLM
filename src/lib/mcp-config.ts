// MCP Configuration Module
// Handles environment-based configuration for MCP server integration

import type { MCPServerConfig } from "./mcp-client.js";

export interface MCPEnvironmentConfig {
	serverUrl?: string;
	apiKey?: string;
	webhookSecret?: string;
	timeout?: number;
	retries?: number;
	enableWebhooks?: boolean;
	enableValidation?: boolean;
}

/**
 * Load MCP configuration from environment variables
 * @returns MCPEnvironmentConfig
 */
export function loadMCPConfig(): MCPEnvironmentConfig {
	return {
		serverUrl: process.env.MCP_SERVER_URL,
		apiKey: process.env.MCP_API_KEY,
		webhookSecret: process.env.MCP_WEBHOOK_SECRET,
		timeout: process.env.MCP_TIMEOUT ? Number.parseInt(process.env.MCP_TIMEOUT, 10) : 30,
		retries: process.env.MCP_RETRIES ? Number.parseInt(process.env.MCP_RETRIES, 10) : 2,
		enableWebhooks: process.env.MCP_ENABLE_WEBHOOKS === "true",
		enableValidation: process.env.MCP_ENABLE_VALIDATION !== "false", // default true
	};
}

/**
 * Convert environment config to server config
 * @param envConfig - Environment configuration
 * @returns MCPServerConfig or null if not configured
 */
export function createServerConfig(envConfig: MCPEnvironmentConfig): MCPServerConfig | null {
	if (!envConfig.serverUrl) {
		return null;
	}

	return {
		url: envConfig.serverUrl,
		apiKey: envConfig.apiKey,
		timeout: envConfig.timeout || 30,
		retries: envConfig.retries || 2,
	};
}

/**
 * Validate MCP environment configuration
 * @param config - Environment configuration to validate
 * @returns Validation result with warnings for missing optional config
 */
export function validateMCPConfig(config: MCPEnvironmentConfig): {
	valid: boolean;
	errors: string[];
	warnings: string[];
} {
	const errors: string[] = [];
	const warnings: string[] = [];

	// Check for production readiness
	if (config.serverUrl && !config.apiKey) {
		warnings.push("MCP_API_KEY not set - authentication may fail");
	}

	if (config.enableWebhooks && !config.webhookSecret) {
		errors.push("MCP_WEBHOOK_SECRET required when webhooks are enabled");
	}

	if (config.timeout && (config.timeout < 5 || config.timeout > 300)) {
		warnings.push("MCP_TIMEOUT should be between 5 and 300 seconds");
	}

	if (config.retries && (config.retries < 0 || config.retries > 5)) {
		warnings.push("MCP_RETRIES should be between 0 and 5");
	}

	// Inform about fallback behavior
	if (!config.serverUrl) {
		warnings.push("MCP_SERVER_URL not set - using local generation fallback");
	}

	return {
		valid: errors.length === 0,
		errors,
		warnings,
	};
}

/**
 * Get MCP configuration with validation
 * @returns Validated MCP configuration
 */
export function getMCPConfig(): {
	config: MCPEnvironmentConfig;
	serverConfig: MCPServerConfig | null;
	validation: { valid: boolean; errors: string[]; warnings: string[] };
} {
	const config = loadMCPConfig();
	const validation = validateMCPConfig(config);
	const serverConfig = createServerConfig(config);

	return {
		config,
		serverConfig,
		validation,
	};
}