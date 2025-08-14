// Test suite for prompt→LLM→validation flow
// Tests the complete integration pipeline

import { describe, it, expect, beforeEach } from "vitest";
import { createLLMRequest, mockLLMGenerate, parseAndValidateLLMResponse } from "../lib/llm-client.js";
import { validateContentLimits, validateSecurityConstraints, SiteConfigSchema } from "../lib/schemas.js";
import type { SiteConfig } from "../types/site-config.js";

describe("LLM Integration Flow", () => {
	describe("Prompt Processing", () => {
		it("should create valid LLM request from prompt", () => {
			const prompt = "Create a portfolio site for Design Studio Pro";
			const request = createLLMRequest(prompt);

			expect(request.prompt).toBe(prompt);
			expect(request.systemPrompt).toContain("website generator");
			expect(request.options?.model).toBe("mock-gpt-4");
		});

		it("should reject empty prompts", () => {
			expect(() => createLLMRequest("")).toThrow("User prompt is required");
			expect(() => createLLMRequest("   ")).toThrow("User prompt is required");
		});

		it("should reject overly long prompts", () => {
			const longPrompt = "a".repeat(2001);
			expect(() => createLLMRequest(longPrompt)).toThrow("too long");
		});

		it("should sanitize prompts with dangerous content", () => {
			const maliciousPrompt = 'Create site <script>alert("xss")</script>';
			const request = createLLMRequest(maliciousPrompt);
			expect(request.prompt).not.toContain("<script>");
		});
	});

	describe("LLM Response Generation", () => {
		it("should generate valid response from business prompt", async () => {
			const request = createLLMRequest("Create a consulting website for Apex Advisory");
			const response = await mockLLMGenerate(request);

			expect(response.content).toBeTruthy();
			expect(response.model).toBe("mock-gpt-4");
			expect(response.usage?.totalTokens).toBeGreaterThan(0);
		});

		it("should generate different content for different site types", async () => {
			const studioRequest = createLLMRequest("Create a design studio site for Creative Works");
			const consultingRequest = createLLMRequest("Create a consulting site for Business Advisors");

			const studioResponse = await mockLLMGenerate(studioRequest);
			const consultingResponse = await mockLLMGenerate(consultingRequest);

			expect(studioResponse.content).not.toBe(consultingResponse.content);
		});
	});

	describe("Response Parsing and Validation", () => {
		it("should parse valid JSON response", async () => {
			const request = createLLMRequest("Create a portfolio site for Test Studio");
			const llmResponse = await mockLLMGenerate(request);
			const result = parseAndValidateLLMResponse(llmResponse);

			expect(result.success).toBe(true);
			expect(result.data).toBeTruthy();
			expect(result.data?.name).toBe("Test Studio");
		});

		it("should handle malformed JSON", () => {
			const malformedResponse = {
				content: '{"name": "Test", invalid json}',
				usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
			};

			const result = parseAndValidateLLMResponse(malformedResponse);
			
			expect(result.success).toBe(false);
			expect(result.parseError).toContain("JSON parse error");
		});

		it("should validate against schema", async () => {
			const invalidConfig = {
				content: JSON.stringify({
					name: "", // Invalid: empty name
					description: "Test description",
					pages: { home: { hero: { title: "Test" } } }, // Missing required fields
				}),
				usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
			};

			const result = parseAndValidateLLMResponse(invalidConfig);
			
			expect(result.success).toBe(false);
			expect(result.validationError).toBeTruthy();
		});

		it("should extract JSON from markdown code blocks", () => {
			const responseWithMarkdown = {
				content: `
Here's your site config:

\`\`\`json
{
  "name": "Test Site",
  "description": "Test description",
  "pages": {
    "home": {
      "hero": {
        "title": "Welcome to Test",
        "subtitle": "This is a test site"
      },
      "features": [{
        "title": "Test Feature",
        "description": "Test description"
      }]
    }
  }
}
\`\`\`

Let me know if you need any changes!
				`,
				usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
			};

			const result = parseAndValidateLLMResponse(responseWithMarkdown);
			
			expect(result.success).toBe(true);
			expect(result.data?.name).toBe("Test Site");
		});
	});

	describe("Content Validation", () => {
		let validConfig: SiteConfig;

		beforeEach(() => {
			validConfig = {
				name: "Test Company",
				description: "Test description for validation",
				pages: {
					home: {
						hero: {
							title: "Welcome to Test", // 3 words - good
							subtitle: "Professional services for your business needs",
						},
						features: [
							{
								title: "Quality Service",
								description: "High-quality solutions for your needs", // Under 120 chars
								icon: "🎯",
							},
						],
					},
				},
			};
		});

		it("should validate content limits", () => {
			const result = validateContentLimits(validConfig);
			expect(result.valid).toBe(true);
			expect(result.warnings).toHaveLength(0);
		});

		it("should warn about long hero titles", () => {
			validConfig.pages.home.hero.title = "This is a very long hero title with many words exceeding recommendations";
			
			const result = validateContentLimits(validConfig);
			expect(result.valid).toBe(false);
			expect(result.warnings[0]).toContain("Hero title has");
		});

		it("should warn about long feature descriptions", () => {
			validConfig.pages.home.features[0].description = "This is an extremely long feature description that exceeds the recommended character limit of 120 characters and should trigger a warning in the validation system";
			
			const result = validateContentLimits(validConfig);
			expect(result.valid).toBe(false);
			expect(result.warnings.some(w => w.includes("Feature 1 description is"))).toBe(true);
		});

		it("should detect security issues", () => {
			const unsafeConfig = {
				...validConfig,
				name: "Test Company with API_KEY=secret123",
			};
			
			const result = validateSecurityConstraints(unsafeConfig);
			expect(result.valid).toBe(false);
			expect(result.errors.some(e => e.includes("pattern"))).toBe(true);
		});

		it("should pass security validation for clean content", () => {
			const result = validateSecurityConstraints(validConfig);
			expect(result.valid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});
	});

	describe("Full Integration Flow", () => {
		it("should complete full prompt→LLM→validation cycle", async () => {
			// Start with a realistic prompt
			const prompt = "Create a consulting website for Strategic Advisors with 3 features and contact page";
			
			// Step 1: Create LLM request
			const request = createLLMRequest(prompt);
			expect(request.prompt).toBe(prompt);
			
			// Step 2: Generate LLM response
			const llmResponse = await mockLLMGenerate(request);
			expect(llmResponse.content).toBeTruthy();
			
			// Step 3: Parse and validate response
			const parseResult = parseAndValidateLLMResponse(llmResponse);
			expect(parseResult.success).toBe(true);
			expect(parseResult.data).toBeTruthy();
			
			// Step 4: Additional validation checks
			if (parseResult.data) {
				const contentValidation = validateContentLimits(parseResult.data);
				const securityValidation = validateSecurityConstraints(parseResult.data);
				
				expect(securityValidation.valid).toBe(true);
				// Content validation may have warnings but should not fail completely
				expect(parseResult.data.name).toBeTruthy();
				expect(parseResult.data.pages.home.hero.title).toBeTruthy();
				expect(parseResult.data.pages.home.features).toHaveLength(3);
			}
		});

		it("should handle different site types correctly", async () => {
			const testCases = [
				{ 
					prompt: "Create a design studio site for Creative Vision",
					expectedName: "Creative Vision",
					shouldInclude: ["creative", "design"],
				},
				{
					prompt: "Build a restaurant website for Bella Vista with contact info",
					expectedName: "Bella Vista", 
					shouldInclude: ["restaurant"],
				},
			];

			for (const testCase of testCases) {
				const request = createLLMRequest(testCase.prompt);
				const llmResponse = await mockLLMGenerate(request);
				const result = parseAndValidateLLMResponse(llmResponse);

				expect(result.success).toBe(true);
				expect(result.data?.name).toBe(testCase.expectedName);
				
				const configStr = JSON.stringify(result.data).toLowerCase();
				for (const keyword of testCase.shouldInclude) {
					expect(configStr).toContain(keyword.toLowerCase());
				}
			}
		});

		it("should maintain schema compliance across multiple generations", async () => {
			const prompts = [
				"Create a tech startup site for InnovateCorp",
				"Build a consulting firm site for Strategic Partners",
				"Generate a design agency site for Creative Studio",
			];

			for (const prompt of prompts) {
				const request = createLLMRequest(prompt);
				const llmResponse = await mockLLMGenerate(request);
				const result = parseAndValidateLLMResponse(llmResponse);

				expect(result.success).toBe(true);
				
				// Validate against Zod schema directly
				if (result.data) {
					const schemaValidation = SiteConfigSchema.safeParse(result.data);
					expect(schemaValidation.success).toBe(true);
				}
			}
		});
	});

	describe("Error Handling", () => {
		it("should handle LLM failures gracefully", async () => {
			// Simulate LLM failure by providing invalid response
			const invalidResponse = {
				content: "Sorry, I cannot generate that content.",
				usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
			};

			const result = parseAndValidateLLMResponse(invalidResponse);
			
			expect(result.success).toBe(false);
			expect(result.parseError).toContain("No valid JSON found");
		});

		it("should provide meaningful error messages", async () => {
			const brokenJsonResponse = {
				content: '{"name": "Test", "description": missing quote}',
				usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
			};

			const result = parseAndValidateLLMResponse(brokenJsonResponse);
			
			expect(result.success).toBe(false);
			expect(result.parseError).toContain("JSON parse error");
		});
	});
});

describe("Schema Synchronization", () => {
	it("should keep TypeScript types in sync with Zod schemas", () => {
		// This test ensures that our TypeScript types match our Zod schemas
		const sampleConfig: SiteConfig = {
			name: "Test Site",
			description: "Test description",
			pages: {
				home: {
					hero: {
						title: "Test Title",
						subtitle: "Test subtitle",
					},
					features: [
						{
							title: "Test Feature",
							description: "Test description",
							icon: "🎯",
						},
					],
				},
			},
		};

		const validation = SiteConfigSchema.safeParse(sampleConfig);
		expect(validation.success).toBe(true);
	});

	it("should enforce character limits consistently", () => {
		const configWithLongFields = {
			name: "a".repeat(101), // Exceeds 100 char limit
			description: "Valid description",
			pages: {
				home: {
					hero: {
						title: "a".repeat(61), // Exceeds 60 char limit
						subtitle: "Valid subtitle",
					},
					features: [
						{
							title: "Valid title", 
							description: "a".repeat(121), // Exceeds 120 char limit
						},
					],
				},
			},
		};

		const validation = SiteConfigSchema.safeParse(configWithLongFields);
		expect(validation.success).toBe(false);
		expect(validation.error?.errors).toHaveLength(3);
	});
});