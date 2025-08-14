#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");

/**
 * Validates a template directory structure and manifest
 * @param {string} templateId
 * @returns {Promise<{valid: boolean, errors: string[]}>}
 */
async function validateTemplate(templateId) {
	const errors = [];
	const templateDir = path.join("templates", templateId);

	// Check if template directory exists
	if (!fs.existsSync(templateDir)) {
		errors.push(`Template directory does not exist: ${templateDir}`);
		return { valid: false, errors };
	}

	// Check required files
	const requiredFiles = [
		"manifest.json",
		"tokens.json",
		"preview.png",
		"README.md",
		"package.json",
		"src",
		"public",
	];

	for (const file of requiredFiles) {
		const filePath = path.join(templateDir, file);
		if (!fs.existsSync(filePath)) {
			errors.push(`Missing required file/directory: ${file}`);
		}
	}

	// Validate manifest.json
	try {
		const manifestPath = path.join(templateDir, "manifest.json");
		if (fs.existsSync(manifestPath)) {
			const manifestContent = fs.readFileSync(manifestPath, "utf-8");
			const manifest = JSON.parse(manifestContent);

			// Check required manifest fields
			const requiredFields = [
				"id",
				"name",
				"description",
				"version",
				"license",
				"author",
			];
			for (const field of requiredFields) {
				if (!manifest[field]) {
					errors.push(`Manifest missing required field: ${field}`);
				}
			}

			// Validate ID matches directory
			if (manifest.id !== templateId) {
				errors.push(
					`Manifest ID "${manifest.id}" does not match template directory "${templateId}"`,
				);
			}
		}
	} catch (error) {
		errors.push(`Invalid manifest.json: ${error.message}`);
	}

	// Validate tokens.json
	try {
		const tokensPath = path.join(templateDir, "tokens.json");
		if (fs.existsSync(tokensPath)) {
			const tokensContent = fs.readFileSync(tokensPath, "utf-8");
			JSON.parse(tokensContent);
		}
	} catch (error) {
		errors.push(`Invalid tokens.json: ${error.message}`);
	}

	return { valid: errors.length === 0, errors };
}

/**
 * Updates the templates registry index
 */
async function updateRegistry() {
	const templatesDir = "templates";
	const indexPath = path.join(templatesDir, "index.json");

	if (!fs.existsSync(templatesDir)) {
		throw new Error("Templates directory does not exist");
	}

	// Get all template directories
	const templateDirs = fs
		.readdirSync(templatesDir, { withFileTypes: true })
		.filter((dirent) => dirent.isDirectory())
		.map((dirent) => dirent.name);

	const templates = [];
	const stats = {
		total_templates: 0,
		frameworks: {},
		styling: {},
		deployment_targets: {},
	};

	// Process each template
	for (const templateId of templateDirs) {
		const manifestPath = path.join(templatesDir, templateId, "manifest.json");

		if (!fs.existsSync(manifestPath)) {
			console.warn(`Skipping ${templateId}: no manifest.json found`);
			continue;
		}

		try {
			const manifestContent = fs.readFileSync(manifestPath, "utf-8");
			const manifest = JSON.parse(manifestContent);

			// Create registry entry
			const registryEntry = {
				id: manifest.id,
				name: manifest.name,
				description: manifest.description,
				version: manifest.version,
				tags: manifest.tags || [],
				preview: `/templates/${templateId}/preview.png`,
				manifest: `/templates/${templateId}/manifest.json`,
				repository: `https://github.com/blakeox/astro-template-LLM/tree/main/templates/${templateId}`,
				demo: manifest.demo || null,
				author: manifest.author,
				license: manifest.license,
				created_at: manifest.created_at,
				updated_at: manifest.updated_at,
				capabilities: manifest.capabilities || [],
				framework: manifest.framework,
				styling: manifest.styling,
				deployment: manifest.deployment || [],
			};

			templates.push(registryEntry);

			// Update stats
			stats.total_templates++;

			if (manifest.framework) {
				stats.frameworks[manifest.framework] =
					(stats.frameworks[manifest.framework] || 0) + 1;
			}

			if (manifest.styling) {
				stats.styling[manifest.styling] =
					(stats.styling[manifest.styling] || 0) + 1;
			}

			if (manifest.deployment) {
				for (const target of manifest.deployment) {
					stats.deployment_targets[target] =
						(stats.deployment_targets[target] || 0) + 1;
				}
			}
		} catch (error) {
			console.error(`Error processing ${templateId}: ${error.message}`);
		}
	}

	// Create registry index
	const registry = {
		name: "Astro Template Registry",
		description:
			"A curated collection of Astro templates for rapid website development",
		version: "1.0.0",
		templates,
		stats,
		api_version: "1.0",
		last_updated: new Date().toISOString(),
	};

	// Write registry index
	fs.writeFileSync(indexPath, JSON.stringify(registry, null, 2));
	console.log(`✅ Registry updated with ${templates.length} templates`);
	console.log(`📝 Written to ${indexPath}`);
}

// CLI interface
const command = process.argv[2];
const templateId = process.argv[3];

async function main() {
	try {
		switch (command) {
			case "validate": {
				if (!templateId) {
					console.error(
						"Usage: node template-manager.js validate <template-id>",
					);
					process.exit(1);
				}
				const { valid, errors } = await validateTemplate(templateId);
				if (valid) {
					console.log(`✅ Template ${templateId} is valid`);
				} else {
					console.error(`❌ Template ${templateId} has errors:`);
					for (const error of errors) {
						console.error(`  - ${error}`);
					}
					process.exit(1);
				}
				break;
			}

			case "update-registry":
				await updateRegistry();
				break;

			case "help":
				console.log("Template Manager Commands:");
				console.log("  validate <template-id>  - Validate template structure");
				console.log("  update-registry         - Update templates/index.json");
				console.log("  help                    - Show this help");
				break;

			default:
				console.error('Unknown command. Use "help" for usage information.');
				process.exit(1);
		}
	} catch (error) {
		console.error(`Error: ${error.message}`);
		process.exit(1);
	}
}

main();
