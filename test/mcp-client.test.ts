import { describe, it, expect, vi } from "vitest";
import { 
	generateSiteConfig, 
	validateArtifact,
	verifyWebhookSignature 
} from "../src/lib/mcp-client.js";
import { getMCPConfig } from "../src/lib/mcp-config.js";

describe("MCP Client", () => {
	describe("generateSiteConfig", () => {
		it("should generate valid site config from prompt", async () => {
			const prompt = "Create a portfolio site for Design Co";
			const result = await generateSiteConfig(prompt);

			expect(result.success).toBe(true);
			expect(result.data).toBeDefined();
			expect(result.data?.name).toBe("Design");
			expect(result.data?.pages.home).toBeDefined();
			expect(result.data?.pages.home.features).toHaveLength(3);
		});

		it("should handle empty prompt", async () => {
			const result = await generateSiteConfig("");
			
			expect(result.success).toBe(false);
			expect(result.error).toBe("Prompt is required");
		});

		it("should handle overly long prompt", async () => {
			const longPrompt = "a".repeat(1001);
			const result = await generateSiteConfig(longPrompt);
			
			expect(result.success).toBe(false);
			expect(result.error).toBe("Prompt is too long (max 1000 characters)");
		});

		it("should extract different business types correctly", async () => {
			const prompts = [
				{ text: "Create a consulting website for Acme Consulting", expectedType: "consulting" },
				{ text: "Build a portfolio site for Creative Studio", expectedType: "design" },
				{ text: "Make a restaurant website for Bella's Cafe", expectedType: "restaurant" },
			];

			for (const { text, expectedType } of prompts) {
				const result = await generateSiteConfig(text);
				expect(result.success).toBe(true);
				
				// Validate that the features match the business type
				const features = result.data?.pages.home.features || [];
				expect(features.length).toBeGreaterThan(0);
				
				// Check that features are contextually appropriate
				if (expectedType === "consulting") {
					expect(features.some(f => f.title.toLowerCase().includes("strategic") || f.title.toLowerCase().includes("planning"))).toBe(true);
				}
			}
		});
	});

	describe("validateArtifact", () => {
		it("should validate correct site config", async () => {
			const validConfig = {
				name: "Test Site",
				description: "Test description",
				pages: {
					home: {
						hero: {
							title: "Test Title",
							subtitle: "Test subtitle"
						},
						features: [
							{
								title: "Feature 1",
								description: "Feature description",
								icon: "🎯"
							}
						]
					}
				}
			};

			const result = await validateArtifact(validConfig);
			expect(result.valid).toBe(true);
		});

		it("should reject invalid config", async () => {
			const invalidConfig = {
				name: "", // Too short
				description: "Test",
				// Missing pages
			};

			const result = await validateArtifact(invalidConfig);
			expect(result.valid).toBe(false);
			expect(result.errors).toBeDefined();
			expect(result.errors?.length).toBeGreaterThan(0);
		});

		it("should reject non-object artifacts", async () => {
			const result = await validateArtifact("not an object");
			expect(result.valid).toBe(false);
			expect(result.errors).toBeDefined();
			expect(result.errors?.length).toBeGreaterThan(0);
			// String will fail Zod validation, not our custom check
			expect(result.errors?.some(err => err.includes("Expected object"))).toBe(true);
		});
	});

	describe("verifyWebhookSignature", () => {
		it("should verify valid signature", () => {
			const payload = JSON.stringify({ test: "data" });
			const secret = "test-secret";
			
			// Generate a proper signature using the same method
			const crypto = require("node:crypto");
			const expectedSignature = crypto
				.createHmac("sha256", secret)
				.update(payload, "utf8")
				.digest("hex");
			
			const result = verifyWebhookSignature(payload, `sha256=${expectedSignature}`, secret);
			expect(result).toBe(true);
		});

		it("should reject invalid signature", () => {
			const payload = JSON.stringify({ test: "data" });
			const secret = "test-secret";
			const invalidSignature = "sha256=invalid";
			
			const result = verifyWebhookSignature(payload, invalidSignature, secret);
			expect(result).toBe(false);
		});

		it("should handle missing secret", () => {
			const payload = JSON.stringify({ test: "data" });
			const result = verifyWebhookSignature(payload, "sha256=test", "");
			expect(result).toBe(false);
		});
	});
});

describe("MCP Configuration", () => {
	it("should load default config when no env vars set", () => {
		// Mock empty environment
		vi.stubEnv("MCP_SERVER_URL", undefined);
		vi.stubEnv("MCP_API_KEY", undefined);
		
		const { config, validation } = getMCPConfig();
		
		expect(config.timeout).toBe(30);
		expect(config.retries).toBe(2);
		expect(validation.warnings).toContain("MCP_SERVER_URL not set - using local generation fallback");
	});

	it("should validate production configuration", () => {
		const { validation } = getMCPConfig();
		
		// Should not have any errors in basic configuration
		expect(validation.valid).toBe(true);
	});
});