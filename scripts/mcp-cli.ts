#!/usr/bin/env tsx
// Enhanced MCP CLI tool for better LLM interaction

import * as fs from "node:fs";
import * as path from "node:path";
import type { SiteConfig } from "../src/types/site-config.js";
import { generateSiteConfigFromMCP, generateSiteConfig, validateArtifact } from "../src/lib/mcp-client.js";
import { getMCPConfig } from "../src/lib/mcp-config.js";
import { generateAllPages } from "../src/lib/page-generator.js";

interface CLIOptions {
	prompt?: string;
	config?: string;
	output?: string;
	validate?: boolean;
	generatePages?: boolean;
	overwrite?: boolean;
	dry?: boolean;
	verbose?: boolean;
	format?: "json" | "yaml";
}

function showHelp() {
	console.log(`
🚀 Enhanced MCP CLI for LLM-driven Website Generation

Usage: tsx scripts/mcp-cli.ts [options]

Options:
  --prompt "<text>"     Generate site config from natural language prompt
  --config <path>       Use existing site config file
  --output <path>       Output file path (default: site.config.generated.json)
  --validate           Validate configuration against schema
  --generate-pages     Generate Astro page files from config
  --overwrite          Overwrite existing files
  --dry                Dry run - show what would be done
  --verbose            Show detailed output
  --format <format>    Output format: json or yaml (default: json)
  --help               Show this help message

Examples:
  # Generate config from prompt
  tsx scripts/mcp-cli.ts --prompt "Create a law firm website for Smith & Associates"
  
  # Generate and validate
  tsx scripts/mcp-cli.ts --prompt "Build a restaurant site" --validate --verbose
  
  # Generate pages from existing config
  tsx scripts/mcp-cli.ts --config site.config.json --generate-pages
  
  # Full workflow: prompt -> config -> pages
  tsx scripts/mcp-cli.ts --prompt "Portfolio for Creative Studio" --generate-pages --verbose

Environment Variables:
  MCP_SERVER_URL       MCP server endpoint URL
  MCP_API_KEY          API key for authentication
  MCP_WEBHOOK_SECRET   Secret for webhook signature verification
  MCP_TIMEOUT          Request timeout in seconds (default: 30)
  MCP_RETRIES          Number of retry attempts (default: 2)
`);
}

function parseArgs(args: string[]): CLIOptions {
	const options: CLIOptions = {};

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];

		switch (arg) {
			case "--prompt":
				if (i + 1 < args.length) {
					options.prompt = args[++i];
				}
				break;
			case "--config":
				if (i + 1 < args.length) {
					options.config = args[++i];
				}
				break;
			case "--output":
				if (i + 1 < args.length) {
					options.output = args[++i];
				}
				break;
			case "--format":
				if (i + 1 < args.length) {
					const format = args[++i];
					if (format === "json" || format === "yaml") {
						options.format = format;
					}
				}
				break;
			case "--validate":
				options.validate = true;
				break;
			case "--generate-pages":
				options.generatePages = true;
				break;
			case "--overwrite":
				options.overwrite = true;
				break;
			case "--dry":
				options.dry = true;
				break;
			case "--verbose":
				options.verbose = true;
				break;
			case "--help":
				showHelp();
				process.exit(0);
				break;
		}
	}

	return options;
}

async function main() {
	const args = process.argv.slice(2);
	
	if (args.length === 0 || args.includes("--help")) {
		showHelp();
		return;
	}

	const options = parseArgs(args);

	try {
		// Load MCP configuration
		const { config: mcpConfig, serverConfig, validation } = getMCPConfig();

		if (options.verbose) {
			console.log("🔧 MCP Configuration:");
			console.log(`   Server URL: ${mcpConfig.serverUrl || "Not configured (using local fallback)"}`);
			console.log(`   Timeout: ${mcpConfig.timeout}s`);
			console.log(`   Retries: ${mcpConfig.retries}`);
			console.log(`   Webhooks: ${mcpConfig.enableWebhooks ? "Enabled" : "Disabled"}`);
			console.log("");
		}

		// Show configuration warnings
		if (validation.warnings.length > 0) {
			for (const warning of validation.warnings) {
				console.warn(`⚠️  ${warning}`);
			}
			console.log("");
		}

		// Show configuration errors
		if (!validation.valid) {
			console.error("❌ MCP Configuration errors:");
			for (const error of validation.errors) {
				console.error(`   ${error}`);
			}
			process.exit(1);
		}

		let siteConfig: SiteConfig | null = null;

		// Generate from prompt
		if (options.prompt) {
			console.log("🤖 Generating site configuration from prompt...");
			if (options.verbose) {
				console.log(`   Prompt: "${options.prompt}"`);
			}

			const result = serverConfig
				? await generateSiteConfigFromMCP(options.prompt, {
						maxFeatures: 3,
						includeImages: false,
						format: options.format || "json",
					}, serverConfig)
				: await generateSiteConfig(options.prompt, {
						maxFeatures: 3,
						includeImages: false,
						format: options.format || "json",
					});

			if (!result.success) {
				console.error(`❌ Generation failed: ${result.error}`);
				process.exit(1);
			}

			siteConfig = result.data;
			console.log(`✅ Generated configuration for: ${siteConfig.name}`);

			// Save generated config
			const outputPath = options.output || "site.config.generated.json";
			if (!options.dry) {
				fs.writeFileSync(outputPath, JSON.stringify(siteConfig, null, 2));
				console.log(`💾 Saved to: ${outputPath}`);
			} else {
				console.log(`💾 Would save to: ${outputPath}`);
			}
		}

		// Load from config file
		if (options.config) {
			if (!fs.existsSync(options.config)) {
				console.error(`❌ Config file not found: ${options.config}`);
				process.exit(1);
			}

			const configContent = fs.readFileSync(options.config, "utf-8");
			siteConfig = JSON.parse(configContent);
			console.log(`📁 Loaded configuration from: ${options.config}`);
		}

		// Validate configuration
		if (options.validate && siteConfig) {
			console.log("🔍 Validating site configuration...");
			const validation = await validateArtifact(siteConfig);

			if (validation.valid) {
				console.log("✅ Configuration is valid!");
				if (validation.warnings && validation.warnings.length > 0) {
					console.log("⚠️  Warnings:");
					for (const warning of validation.warnings) {
						console.log(`   - ${warning}`);
					}
				}
			} else {
				console.error("❌ Validation failed:");
				if (validation.errors) {
					for (const error of validation.errors) {
						console.error(`   - ${error}`);
					}
				}
				process.exit(1);
			}
		}

		// Generate pages
		if (options.generatePages && siteConfig) {
			console.log("📄 Generating Astro pages...");
			
			if (options.dry) {
				console.log("🔍 Dry run mode - no files will be written");
				
				// Show what would be generated
				const pageNames = Object.keys(siteConfig.pages);
				for (const pageName of pageNames) {
					const fileName = pageName === "home" ? "index.astro" : `${pageName}.astro`;
					console.log(`   Would generate: src/pages/${fileName}`);
				}
			} else {
				const results = await generateAllPages(siteConfig, "src/pages", options.overwrite);
				
				console.log("📊 Generation Results:");
				console.log(`   Written: ${results.written} files`);
				console.log(`   Skipped: ${results.skipped} files`);
				
				if (results.errors.length > 0) {
					console.log("❌ Errors:");
					for (const error of results.errors) {
						console.log(`   - ${error}`);
					}
				}
			}
		}

		// Show summary
		if (options.verbose && siteConfig) {
			console.log("\n📋 Site Configuration Summary:");
			console.log(`   Name: ${siteConfig.name}`);
			console.log(`   Description: ${siteConfig.description}`);
			console.log(`   Pages: ${Object.keys(siteConfig.pages).join(", ")}`);
			console.log(`   Features: ${siteConfig.pages.home.features?.length || 0}`);
		}

	} catch (error) {
		console.error("❌ Error:", (error as Error).message);
		process.exit(1);
	}
}

// Run CLI if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
	await main();
}