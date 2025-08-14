#!/usr/bin/env tsx
// Comprehensive demo of enhanced MCP capabilities

import * as fs from "node:fs";
import * as path from "node:path";
import { generateSiteConfig } from "../src/lib/mcp-client.js";
import { getMCPConfig } from "../src/lib/mcp-config.js";

console.log("🚀 MCP Integration Enhancement Demo");
console.log("=====================================\n");

// Demo prompts showcasing improved business type detection
const demoPrompts = [
	"Create a law firm website for Smith & Associates specializing in corporate law",
	"Build a restaurant website for Bella's Italian Cafe with authentic cuisine",
	"Design a consulting website for Strategic Solutions LLC focusing on business optimization",
	"Make a portfolio site for Creative Studio showcasing design and branding work",
	"Create a medical practice website for Valley Health Clinic",
	"Build an agency website for Digital Innovations specializing in web development",
];

async function runDemo() {
	// Show MCP configuration
	const { config, validation } = getMCPConfig();
	console.log("🔧 Current MCP Configuration:");
	console.log(`   Server URL: ${config.serverUrl || "Not configured (local fallback)"}`);
	console.log(`   Timeout: ${config.timeout}s`);
	console.log(`   Retries: ${config.retries}`);
	console.log(`   Webhooks: ${config.enableWebhooks ? "Enabled" : "Disabled"}`);
	
	if (validation.warnings.length > 0) {
		console.log("   Warnings:");
		for (const warning of validation.warnings) {
			console.log(`     - ${warning}`);
		}
	}
	console.log("");

	// Demo enhanced prompt parsing
	console.log("🤖 Testing Enhanced Prompt Parsing:");
	console.log("==================================\n");

	for (const prompt of demoPrompts) {
		console.log(`💬 Prompt: "${prompt}"`);
		
		try {
			const result = await generateSiteConfig(prompt, { maxFeatures: 3 });
			
			if (result.success && result.data) {
				console.log(`✅ Generated: ${result.data.name}`);
				console.log(`   Description: ${result.data.description}`);
				console.log(`   Hero Title: ${result.data.pages.home.hero.title}`);
				console.log(`   Features: ${result.data.pages.home.features.length} contextual features`);
				
				// Show first feature to demonstrate contextual generation
				const firstFeature = result.data.pages.home.features[0];
				console.log(`   Sample Feature: ${firstFeature.icon} ${firstFeature.title}`);
			} else {
				console.log(`❌ Failed: ${result.error}`);
			}
		} catch (error) {
			console.log(`❌ Error: ${(error as Error).message}`);
		}
		
		console.log("");
	}

	// Demo validation capabilities  
	console.log("🔍 Testing Enhanced Validation:");
	console.log("==============================\n");

	// Test with a good config
	const goodConfig = {
		name: "Test Company",
		description: "A test company for validation demo",
		pages: {
			home: {
				hero: {
					title: "Test Title",
					subtitle: "Test subtitle for demo purposes"
				},
				features: [
					{
						icon: "🎯",
						title: "Test Feature",
						description: "A test feature with proper length and formatting"
					}
				]
			}
		}
	};

	console.log("✅ Testing valid configuration...");
	const { validateArtifact } = await import("../src/lib/mcp-client.js");
	const goodValidation = await validateArtifact(goodConfig);
	console.log(`   Result: ${goodValidation.valid ? "VALID" : "INVALID"}`);
	
	// Test with a bad config
	console.log("❌ Testing invalid configuration...");
	const badConfig = {
		name: "", // Too short
		description: "Test",
		// Missing pages
	};
	
	const badValidation = await validateArtifact(badConfig);
	console.log(`   Result: ${badValidation.valid ? "VALID" : "INVALID"}`);
	if (badValidation.errors) {
		console.log(`   Errors: ${badValidation.errors.length} validation errors found`);
		console.log(`   Sample: ${badValidation.errors[0]}`);
	}

	console.log("\n🎉 Demo Complete!");
	console.log("\n📚 Key Improvements Demonstrated:");
	console.log("   ✅ Enhanced business type detection (law, restaurant, consulting, etc.)");
	console.log("   ✅ Contextual feature generation based on business type");
	console.log("   ✅ Sophisticated name extraction from natural language");
	console.log("   ✅ Comprehensive schema validation with detailed error reporting");
	console.log("   ✅ Robust error handling and configuration management");
	console.log("   ✅ Environment-based MCP server configuration");
	console.log("   ✅ Fallback to local generation when server unavailable");
	
	console.log("\n🚀 Ready for LLM Integration!");
	console.log("   The codebase now provides a robust foundation for MCP server");
	console.log("   interaction, enabling LLMs to rapidly build websites with:");
	console.log("   - Schema-first validation ensuring output quality");
	console.log("   - Intelligent prompt parsing for better content generation");
	console.log("   - Flexible deployment options (local + server)");
	console.log("   - Comprehensive error handling and retry logic");
}

// Run the demo
if (import.meta.url === `file://${process.argv[1]}`) {
	await runDemo();
}