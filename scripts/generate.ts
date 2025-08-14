import * as fs from "node:fs";
import * as path from "node:path";
import { z } from "zod";
import type { Feature, SiteConfig } from "../src/types/site-config.js";

// Zod schema for validation - matches site.config.schema.json
const SiteConfigSchema = z.object({
	name: z.string().min(1).max(100),
	description: z.string().min(1).max(200),
	pages: z.object({
		home: z.object({
			hero: z.object({
				title: z.string().min(1).max(60),
				subtitle: z.string().min(1).max(300),
				cta: z
					.object({
						primary: z
							.object({
								text: z.string().min(1).max(50),
								href: z.string().min(1),
							})
							.optional(),
						secondary: z
							.object({
								text: z.string().min(1).max(50),
								href: z.string().min(1),
							})
							.optional(),
					})
					.optional(),
			}),
			features: z
				.array(
					z.object({
						icon: z.string().max(10).optional(),
						title: z.string().min(1).max(50),
						description: z.string().min(1).max(120),
					}),
				)
				.min(1)
				.max(6),
		}),
		about: z
			.object({
				hero: z
					.object({
						title: z.string().min(1).max(60),
						subtitle: z.string().min(1).max(300),
					})
					.optional(),
				blurb: z.string().min(1).max(500).optional(),
			})
			.optional(),
		contact: z
			.object({
				hero: z
					.object({
						title: z.string().min(1).max(60),
						subtitle: z.string().min(1).max(300),
					})
					.optional(),
				emailPlaceholder: z.string().min(1).max(100).optional(),
			})
			.optional(),
		services: z
			.object({
				hero: z
					.object({
						title: z.string().min(1).max(60),
						subtitle: z.string().min(1).max(300),
					})
					.optional(),
				services: z
					.array(
						z.object({
							title: z.string().min(1).max(50),
							description: z.string().min(1).max(200),
							features: z.array(z.string().max(100)).optional(),
						}),
					)
					.optional(),
			})
			.optional(),
	}),
	images: z
		.array(
			z.object({
				url: z.string().url(),
				alt: z.string().min(1),
			}),
		)
		.optional(),
});

interface GenerateOptions {
	check?: boolean;
	dry?: boolean;
	out?: string;
	prompt?: string;
	format?: "json" | "text";
	config?: string;
}

interface GenerateResult {
	written: number;
	skipped: number;
	warnings: string[];
	config?: SiteConfig;
	valid?: boolean;
	errors?: string[];
}

async function validateSiteConfig(
	configPath: string,
): Promise<{ valid: boolean; config?: SiteConfig; errors?: string[] }> {
	try {
		if (!fs.existsSync(configPath)) {
			return { valid: false, errors: ["Config file not found"] };
		}

		const configContent = fs.readFileSync(configPath, "utf-8");
		const config = JSON.parse(configContent);

		const result = SiteConfigSchema.safeParse(config);

		if (result.success) {
			return { valid: true, config: result.data as SiteConfig };
		}
		const errors = result.error.errors.map(
			(err) => `${err.path.join(".")}: ${err.message}`,
		);
		return { valid: false, errors };
	} catch (error) {
		return {
			valid: false,
			errors: [error instanceof Error ? error.message : String(error)],
		};
	}
}

async function generateFromPrompt(prompt: string): Promise<SiteConfig> {
	// Parse the prompt to extract site details
	const siteName = extractSiteName(prompt) || "Generated Site";
	const siteDescription =
		extractSiteDescription(prompt, siteName) ||
		"Professional website generated from prompt";

	const config: SiteConfig = {
		name: siteName,
		description: siteDescription,
		pages: {
			home: {
				hero: {
					title: generateHeroTitle(siteName, prompt),
					subtitle: generateHeroSubtitle(siteName, prompt),
				},
				features: generateFeatures(prompt),
			},
		},
	};

	// Add optional pages based on prompt
	if (prompt.toLowerCase().includes("about")) {
		config.pages.about = {
			blurb: generateAboutBlurb(siteName, prompt),
		};
	}

	if (prompt.toLowerCase().includes("contact")) {
		config.pages.contact = {
			emailPlaceholder: generateEmailPlaceholder(prompt),
		};
	}

	if (prompt.toLowerCase().includes("service")) {
		config.pages.services = {
			hero: {
				title: `${siteName} Services`,
				subtitle: `Professional services and solutions from ${siteName}`,
			},
		};
	}

	return config;
}

// Helper functions for prompt parsing
function extractSiteName(prompt: string): string | null {
	// Look for quoted site names
	const patterns = [
		/["']([^"']+)["']/g,
		/for ([A-Z][a-zA-Z\s&]+?)[\.\s]/g,
		/called ([A-Z][a-zA-Z\s&]+?)[\.\s]/g,
	];

	for (const pattern of patterns) {
		const matches = [...prompt.matchAll(pattern)];
		for (const match of matches) {
			const name = match[1].trim();
			if (name.length > 2 && name.length < 50) {
				return name;
			}
		}
	}

	return null;
}

function extractSiteDescription(prompt: string, siteName: string): string {
	if (prompt.toLowerCase().includes("brochure")) {
		return `Professional brochure website for ${siteName}`;
	}
	if (prompt.toLowerCase().includes("portfolio")) {
		return `Creative portfolio showcasing ${siteName}'s work and expertise`;
	}
	if (prompt.toLowerCase().includes("consulting")) {
		return `Strategic consulting services and business solutions from ${siteName}`;
	}
	if (prompt.toLowerCase().includes("studio")) {
		return "Creative design studio providing innovative solutions for modern brands";
	}
	if (prompt.toLowerCase().includes("agency")) {
		return "Professional digital agency delivering results-driven solutions";
	}

	return `Professional services and solutions from ${siteName}`;
}

function generateHeroTitle(siteName: string, prompt: string): string {
	if (prompt.toLowerCase().includes("studio")) {
		return `Creative Solutions by ${siteName}`;
	}
	if (prompt.toLowerCase().includes("consulting")) {
		return `Expert Consulting from ${siteName}`;
	}
	if (prompt.toLowerCase().includes("portfolio")) {
		return `${siteName} Portfolio`;
	}
	if (prompt.toLowerCase().includes("agency")) {
		return `${siteName} Digital Agency`;
	}

	return `Welcome to ${siteName}`;
}

function generateHeroSubtitle(siteName: string, prompt: string): string {
	if (prompt.toLowerCase().includes("studio")) {
		return "We transform your vision into stunning digital experiences that captivate and convert.";
	}
	if (prompt.toLowerCase().includes("consulting")) {
		return "Strategic consulting services to optimize operations, increase profitability, and drive growth.";
	}
	if (prompt.toLowerCase().includes("portfolio")) {
		return "Showcasing innovative projects and creative solutions that make an impact.";
	}
	if (prompt.toLowerCase().includes("agency")) {
		return "Professional digital services to help your business succeed in the modern marketplace.";
	}

	return "Professional services and solutions to help your business grow and succeed.";
}

function generateFeatures(prompt: string): Feature[] {
	if (
		prompt.toLowerCase().includes("studio") ||
		prompt.toLowerCase().includes("design")
	) {
		return [
			{
				icon: "🎨",
				title: "Brand Design",
				description:
					"Complete brand identity packages including logos, typography, and visual guidelines.",
			},
			{
				icon: "💻",
				title: "Web Development",
				description:
					"Modern, responsive websites built with cutting-edge technology and optimization.",
			},
			{
				icon: "📱",
				title: "Digital Strategy",
				description:
					"Data-driven marketing strategies to reach and engage the right audience effectively.",
			},
		];
	}

	if (prompt.toLowerCase().includes("consulting")) {
		return [
			{
				icon: "📊",
				title: "Strategic Planning",
				description:
					"Comprehensive business strategy development to align operations with growth objectives.",
			},
			{
				icon: "⚡",
				title: "Process Optimization",
				description:
					"Streamline operations and eliminate inefficiencies to boost productivity.",
			},
			{
				icon: "📈",
				title: "Performance Analytics",
				description:
					"Data-driven insights and KPI tracking to measure success and identify opportunities.",
			},
		];
	}

	if (
		prompt.toLowerCase().includes("agency") ||
		prompt.toLowerCase().includes("development")
	) {
		return [
			{
				icon: "⚡",
				title: "Fast Development",
				description:
					"Rapid prototyping and development cycles to get your project to market quickly.",
			},
			{
				icon: "🛡️",
				title: "Secure & Scalable",
				description:
					"Enterprise-grade security and architecture designed to grow with your business.",
			},
			{
				icon: "🎯",
				title: "Custom Solutions",
				description:
					"Tailored applications built specifically for your business requirements.",
			},
		];
	}

	// Default features
	return [
		{
			icon: "🎯",
			title: "Professional Service",
			description:
				"High-quality solutions tailored to your specific business needs and requirements.",
		},
		{
			icon: "👥",
			title: "Expert Team",
			description:
				"Experienced professionals dedicated to delivering exceptional results.",
		},
		{
			icon: "🛠️",
			title: "Reliable Support",
			description:
				"Ongoing support and maintenance to ensure optimal performance.",
		},
	];
}

function generateAboutBlurb(siteName: string, prompt: string): string {
	if (prompt.toLowerCase().includes("studio")) {
		return `${siteName} is a creative design studio specializing in brand identity and digital experiences. We help businesses shine brighter in the digital landscape.`;
	}
	if (prompt.toLowerCase().includes("consulting")) {
		return `${siteName} delivers proven consulting solutions to mid-market companies. Our experienced team helps businesses navigate complex challenges and achieve sustainable growth.`;
	}
	if (prompt.toLowerCase().includes("agency")) {
		return `${siteName} is a full-service digital agency focused on delivering results-driven solutions for modern businesses.`;
	}

	return `${siteName} is a professional services company dedicated to helping businesses succeed through innovative solutions and expert guidance.`;
}

function generateEmailPlaceholder(prompt: string): string {
	if (
		prompt.toLowerCase().includes("studio") ||
		prompt.toLowerCase().includes("design")
	) {
		return "Enter your email to start your project";
	}
	if (prompt.toLowerCase().includes("consulting")) {
		return "Enter your email for consultation";
	}
	if (prompt.toLowerCase().includes("agency")) {
		return "Enter your email for project discussion";
	}

	return "Enter your email address";
}

async function generatePages(
	options: GenerateOptions = {},
): Promise<GenerateResult> {
	const configPath = options.config || path.resolve("site.config.json");
	const pagesDir = path.resolve("src/pages");

	let config: SiteConfig;
	const result: GenerateResult = {
		written: 0,
		skipped: 0,
		warnings: [],
	};

	// Handle prompt generation
	if (options.prompt) {
		try {
			config = await generateFromPrompt(options.prompt);
			result.config = config;

			// Validate generated config
			const validationResult = SiteConfigSchema.safeParse(config);

			if (!validationResult.success) {
				result.valid = false;
				result.errors = validationResult.error.errors.map(
					(err) => `${err.path.join(".")}: ${err.message}`,
				);

				if (options.format === "json") {
					console.log(
						JSON.stringify({ valid: false, errors: result.errors }, null, 2),
					);
					return result;
				}
			} else {
				result.valid = true;
			}

			// If format is json, output the config and return early
			if (options.format === "json") {
				if (options.out) {
					fs.writeFileSync(options.out, JSON.stringify(config, null, 2));
				} else {
					console.log(JSON.stringify(config, null, 2));
				}
				return result;
			}
		} catch (error) {
			result.valid = false;
			result.errors = [error instanceof Error ? error.message : String(error)];
			if (options.format === "json") {
				console.log(
					JSON.stringify({ valid: false, errors: result.errors }, null, 2),
				);
				return result;
			}
			return result;
		}
	} else {
		// Validate existing config
		const validation = await validateSiteConfig(configPath);
		if (!validation.valid) {
			result.valid = false;
			result.errors = validation.errors;
			if (options.format === "json") {
				console.log(
					JSON.stringify({ valid: false, errors: validation.errors }, null, 2),
				);
				return result;
			}
			throw new Error(`Invalid site config: ${validation.errors?.join(", ")}`);
		}
		config = validation.config as SiteConfig;
		result.valid = true;
	}

	console.log(`Generating pages for: ${config.name}`);

	if (options.check || options.dry) {
		console.log("Dry run mode enabled - no files will be written");
	}

	// Ensure pages directory exists (unless dry run)
	if (!options.dry && !options.check && !fs.existsSync(pagesDir)) {
		fs.mkdirSync(pagesDir, { recursive: true });
	}

	// Generate pages based on config
	for (const [pageName, pageConfig] of Object.entries(config.pages)) {
		const filename = pageName === "home" ? "index.astro" : `${pageName}.astro`;
		const filepath = path.join(pagesDir, filename);

		if (fs.existsSync(filepath) && !options.dry && !options.check) {
			console.log(`⚠️  Skipping existing file: ${filename}`);
			result.skipped++;
			continue;
		}

		if (options.dry || options.check) {
			console.log(`🔍 Checking: ${filename}`);
		} else {
			console.log(`✅ Would generate: ${filename}`);
			result.written++;
		}
	}

	return result;
}

function parseArgs(args: string[]): GenerateOptions {
	const options: GenerateOptions = {};

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];

		switch (arg) {
			case "--check":
				options.check = true;
				break;
			case "--dry":
				options.dry = true;
				break;
			case "--out":
				if (i + 1 < args.length) {
					options.out = args[++i];
				}
				break;
			case "--prompt":
				if (i + 1 < args.length) {
					options.prompt = args[++i];
				}
				break;
			case "--format":
				if (i + 1 < args.length) {
					const format = args[++i];
					if (format === "json" || format === "text") {
						options.format = format;
					}
				}
				break;
			case "--config":
				if (i + 1 < args.length) {
					options.config = args[++i];
				}
				break;
			default:
				// Handle --key=value format
				if (arg.includes("=")) {
					const [key, value] = arg.split("=", 2);
					switch (key) {
						case "--format":
							if (value === "json" || value === "text") {
								options.format = value;
							}
							break;
						case "--out":
							options.out = value;
							break;
						case "--prompt":
							options.prompt = value;
							break;
						case "--config":
							options.config = value;
							break;
					}
				}
				break;
		}
	}

	return options;
}

// CLI handling
if (import.meta.url === `file://${process.argv[1]}`) {
	const args = process.argv.slice(2);

	if (args.includes("--help")) {
		console.log(`
Usage: tsx scripts/generate.ts [options]

Options:
  --check              Validate config without writing files
  --dry                Dry run mode - no files will be written
  --out <path>         Write output to specified file
  --prompt "<text>"    Generate from prompt text
  --format <format>    Output format: json or text (default: text)
  --config <path>      Path to config file (default: site.config.json)
  --help               Show this help message

Examples:
  tsx scripts/generate.ts --check
  tsx scripts/generate.ts --dry --prompt "Create a site for Acme Corp"
  tsx scripts/generate.ts --prompt "Build a portfolio site" --format json --out generated.json
`);
		process.exit(0);
	}

	try {
		const options = parseArgs(args);
		const result = await generatePages(options);
		if (options.format === "json") {
			// JSON output already handled in generatePages, exit quietly
			process.exit(result.valid === false ? 1 : 0);
		} else {
			console.log("\n📊 Generation Summary:");
			console.log(
				JSON.stringify(
					{
						written: result.written,
						skipped: result.skipped,
						warnings: result.warnings,
						valid: result.valid,
					},
					null,
					2,
				),
			);

			if (result.warnings.length > 0) {
				console.log("\n⚠️  Warnings:");
				for (const warning of result.warnings) {
					console.log(`  - ${warning}`);
				}
			}

			if (result.errors && result.errors.length > 0) {
				console.log("\n❌ Validation Errors:");
				for (const error of result.errors) {
					console.log(`  - ${error}`);
				}
			}
		}

		const exitCode = result.valid === false ? 1 : 0;
		process.exit(exitCode);
	} catch (error) {
		console.error(
			"❌ Error:",
			error instanceof Error ? error.message : String(error),
		);
		process.exit(1);
	}
}
