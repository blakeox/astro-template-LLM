// Canonical Page Schema for MCP Integration
// This module provides type-safe schema definitions for page generation
// and keeps the MCP content model in sync with the site configuration

import { z } from "zod";

// Core schema definitions that mirror site.config.schema.json
export const ImageSchema = z.object({
	url: z.string().url(),
	alt: z.string().min(1),
});

export const CTASchema = z.object({
	text: z.string().min(1).max(50),
	href: z.string().min(1),
});

export const HeroSchema = z.object({
	title: z.string().min(1).max(60).describe("Keep hero title under 8 words"),
	subtitle: z.string().min(1).max(300),
	cta: z
		.object({
			primary: CTASchema.optional(),
			secondary: CTASchema.optional(),
		})
		.optional(),
});

export const FeatureSchema = z.object({
	icon: z.string().max(10).optional().describe("Single emoji preferred"),
	title: z.string().min(1).max(50),
	description: z.string().min(1).max(120).describe("Keep under 120 characters"),
});

export const ServiceSchema = z.object({
	title: z.string().min(1).max(50),
	description: z.string().min(1).max(200),
	features: z.array(z.string().max(100)).optional(),
});

export const TeamMemberSchema = z.object({
	name: z.string().min(1),
	role: z.string().min(1),
	bio: z.string().max(200).optional(),
});

// Page-specific schemas
export const HomePageSchema = z.object({
	hero: HeroSchema,
	features: z.array(FeatureSchema).min(1).max(6),
});

export const AboutPageSchema = z.object({
	hero: HeroSchema.optional(),
	blurb: z
		.string()
		.min(1)
		.max(500)
		.optional()
		.describe("1-2 sentences recommended"),
	team: z.array(TeamMemberSchema).optional(),
});

export const ContactPageSchema = z.object({
	hero: HeroSchema.optional(),
	emailPlaceholder: z.string().min(1).max(100).optional(),
	address: z.string().max(200).optional(),
	phone: z
		.string()
		.regex(/^[+]?[0-9\s\-\(\)]+$/)
		.optional(),
});

export const ServicesPageSchema = z.object({
	hero: HeroSchema.optional(),
	services: z.array(ServiceSchema).optional(),
});

// Main site configuration schema
export const SitePagesSchema = z.object({
	home: HomePageSchema,
	about: AboutPageSchema.optional(),
	contact: ContactPageSchema.optional(),
	services: ServicesPageSchema.optional(),
});

export const SiteConfigSchema = z.object({
	name: z.string().min(1).max(100),
	description: z.string().min(1).max(200),
	pages: SitePagesSchema,
	images: z.array(ImageSchema).optional(),
});

// Type exports for convenience
export type Image = z.infer<typeof ImageSchema>;
export type CTA = z.infer<typeof CTASchema>;
export type Hero = z.infer<typeof HeroSchema>;
export type Feature = z.infer<typeof FeatureSchema>;
export type Service = z.infer<typeof ServiceSchema>;
export type TeamMember = z.infer<typeof TeamMemberSchema>;
export type HomePage = z.infer<typeof HomePageSchema>;
export type AboutPage = z.infer<typeof AboutPageSchema>;
export type ContactPage = z.infer<typeof ContactPageSchema>;
export type ServicesPage = z.infer<typeof ServicesPageSchema>;
export type SitePages = z.infer<typeof SitePagesSchema>;
export type SiteConfig = z.infer<typeof SiteConfigSchema>;

// Validation functions
export function validateSiteConfig(
	config: unknown,
): z.SafeParseReturnType<unknown, SiteConfig> {
	return SiteConfigSchema.safeParse(config);
}

export function validatePage<T>(
	page: unknown,
	schema: z.ZodSchema<T>,
): z.SafeParseReturnType<unknown, T> {
	return schema.safeParse(page);
}

// Content validation utilities
export function validateContentLimits(config: SiteConfig): {
	valid: boolean;
	warnings: string[];
} {
	const warnings: string[] = [];

	// Check hero title word count (should be under 8 words)
	const heroTitle = config.pages.home.hero.title;
	const wordCount = heroTitle.split(/\s+/).length;
	if (wordCount > 8) {
		warnings.push(`Hero title has ${wordCount} words (recommended: ≤8 words)`);
	}

	// Check feature descriptions length
	for (let i = 0; i < config.pages.home.features.length; i++) {
		const feature = config.pages.home.features[i];
		if (feature.description.length > 120) {
			warnings.push(
				`Feature ${i + 1} description is ${feature.description.length} chars (recommended: ≤120 chars)`,
			);
		}
	}

	return {
		valid: warnings.length === 0,
		warnings,
	};
}

// Security validation - ensure no secrets or sensitive data
export function validateSecurityConstraints(config: SiteConfig): {
	valid: boolean;
	errors: string[];
} {
	const errors: string[] = [];
	const sensitivePatterns = [
		/api[_-]?key/i,
		/secret/i,
		/password/i,
		/token/i,
		/private[_-]?key/i,
		/[a-f0-9]{32,}/i, // Potential API keys/hashes
	];

	const configStr = JSON.stringify(config);
	for (const pattern of sensitivePatterns) {
		if (pattern.test(configStr)) {
			errors.push(
				`Potential sensitive data detected: pattern ${pattern.source}`,
			);
		}
	}

	return {
		valid: errors.length === 0,
		errors,
	};
}

export default {
	schemas: {
		SiteConfigSchema,
		HomePageSchema,
		AboutPageSchema,
		ContactPageSchema,
		ServicesPageSchema,
		HeroSchema,
		FeatureSchema,
		ServiceSchema,
		TeamMemberSchema,
		ImageSchema,
		CTASchema,
	},
	validate: {
		validateSiteConfig,
		validatePage,
		validateContentLimits,
		validateSecurityConstraints,
	},
};
