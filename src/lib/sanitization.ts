// Enhanced content sanitization utilities
// This module provides additional security and validation for LLM-generated content

import type { SiteConfig } from "../types/site-config.js";

export interface SanitizationOptions {
	allowExternalLinks?: boolean;
	maxUrlLength?: number;
	allowedDomains?: string[];
	strictMode?: boolean;
}

export interface SanitizationResult {
	sanitized: SiteConfig;
	warnings: string[];
	changed: boolean;
}

/**
 * Comprehensive sanitization of site configuration
 */
export function sanitizeSiteConfig(
	config: SiteConfig,
	options: SanitizationOptions = {}
): SanitizationResult {
	const warnings: string[] = [];
	let changed = false;
	
	// Deep clone to avoid mutation
	const sanitized = JSON.parse(JSON.stringify(config)) as SiteConfig;
	
	// Sanitize text content
	const textSanitization = sanitizeTextContent(sanitized);
	if (textSanitization.changed) {
		changed = true;
		warnings.push(...textSanitization.warnings);
	}
	
	// Sanitize URLs and links
	const urlSanitization = sanitizeUrls(sanitized, options);
	if (urlSanitization.changed) {
		changed = true;
		warnings.push(...urlSanitization.warnings);
	}
	
	// Validate character limits
	const limitValidation = enforceCharacterLimits(sanitized);
	if (limitValidation.changed) {
		changed = true;
		warnings.push(...limitValidation.warnings);
	}
	
	return {
		sanitized,
		warnings,
		changed,
	};
}

/**
 * Sanitize text content for security and quality
 */
function sanitizeTextContent(config: SiteConfig): { changed: boolean; warnings: string[] } {
	const warnings: string[] = [];
	let changed = false;
	
	// Dangerous patterns to remove
	const dangerousPatterns = [
		/<script[^>]*>.*?<\/script>/gi,
		/<iframe[^>]*>.*?<\/iframe>/gi,
		/<embed[^>]*>/gi,
		/<object[^>]*>.*?<\/object>/gi,
		/javascript:/gi,
		/vbscript:/gi,
		/data:(?!image\/)/gi,
		/on\w+\s*=/gi,
	];
	
	// Clean all text fields recursively
	function cleanText(text: string, fieldName: string): string {
		let cleaned = text;
		
		for (const pattern of dangerousPatterns) {
			const matches = cleaned.match(pattern);
			if (matches) {
				cleaned = cleaned.replace(pattern, "");
				warnings.push(`Removed dangerous content from ${fieldName}: ${matches[0].substring(0, 50)}...`);
				changed = true;
			}
		}
		
		// Remove excessive whitespace
		const trimmed = cleaned.replace(/\s+/g, " ").trim();
		if (trimmed !== text) {
			changed = true;
		}
		
		return trimmed;
	}
	
	// Apply cleaning to all text fields
	config.name = cleanText(config.name, "name");
	config.description = cleanText(config.description, "description");
	
	// Clean hero content
	const hero = config.pages.home.hero;
	hero.title = cleanText(hero.title, "hero.title");
	hero.subtitle = cleanText(hero.subtitle, "hero.subtitle");
	
	// Clean features
	for (let i = 0; i < config.pages.home.features.length; i++) {
		const feature = config.pages.home.features[i];
		feature.title = cleanText(feature.title, `features[${i}].title`);
		feature.description = cleanText(feature.description, `features[${i}].description`);
	}
	
	return { changed, warnings };
}

/**
 * Sanitize and validate URLs
 */
function sanitizeUrls(config: SiteConfig, options: SanitizationOptions): { changed: boolean; warnings: string[] } {
	const warnings: string[] = [];
	let changed = false;
	
	const maxUrlLength = options.maxUrlLength || 200;
	const allowExternalLinks = options.allowExternalLinks ?? true;
	const allowedDomains = options.allowedDomains || [];
	
	function validateUrl(url: string, fieldName: string): string {
		// Remove dangerous protocols
		if (url.match(/^(javascript|vbscript|data):/i)) {
			warnings.push(`Removed dangerous protocol from ${fieldName}`);
			changed = true;
			return "/";
		}
		
		// Validate external links
		if (url.startsWith("http") && !allowExternalLinks) {
			warnings.push(`Converted external link to internal: ${fieldName}`);
			changed = true;
			return "/";
		}
		
		// Validate domain whitelist
		if (url.startsWith("http") && allowedDomains.length > 0) {
			const domain = new URL(url).hostname;
			if (!allowedDomains.includes(domain)) {
				warnings.push(`Blocked non-whitelisted domain: ${domain}`);
				changed = true;
				return "/";
			}
		}
		
		// Check URL length
		if (url.length > maxUrlLength) {
			warnings.push(`Truncated long URL in ${fieldName}`);
			changed = true;
			return url.substring(0, maxUrlLength);
		}
		
		// Default internal links
		if (!url.startsWith("/") && !url.startsWith("http")) {
			return "/" + url;
		}
		
		return url;
	}
	
	// Sanitize CTA links
	const hero = config.pages.home.hero;
	if (hero.cta?.primary?.href) {
		hero.cta.primary.href = validateUrl(hero.cta.primary.href, "hero.cta.primary.href");
	}
	if (hero.cta?.secondary?.href) {
		hero.cta.secondary.href = validateUrl(hero.cta.secondary.href, "hero.cta.secondary.href");
	}
	
	return { changed, warnings };
}

/**
 * Enforce character limits by truncating content
 */
function enforceCharacterLimits(config: SiteConfig): { changed: boolean; warnings: string[] } {
	const warnings: string[] = [];
	let changed = false;
	
	function truncateField(text: string, maxLength: number, fieldName: string): string {
		if (text.length > maxLength) {
			warnings.push(`Truncated ${fieldName} from ${text.length} to ${maxLength} characters`);
			changed = true;
			return text.substring(0, maxLength).trim();
		}
		return text;
	}
	
	// Apply limits
	config.name = truncateField(config.name, 100, "name");
	config.description = truncateField(config.description, 200, "description");
	
	const hero = config.pages.home.hero;
	hero.title = truncateField(hero.title, 60, "hero.title");
	hero.subtitle = truncateField(hero.subtitle, 300, "hero.subtitle");
	
	// Truncate CTA text
	if (hero.cta?.primary?.text) {
		hero.cta.primary.text = truncateField(hero.cta.primary.text, 50, "hero.cta.primary.text");
	}
	if (hero.cta?.secondary?.text) {
		hero.cta.secondary.text = truncateField(hero.cta.secondary.text, 50, "hero.cta.secondary.text");
	}
	
	// Truncate feature content
	for (let i = 0; i < config.pages.home.features.length; i++) {
		const feature = config.pages.home.features[i];
		feature.title = truncateField(feature.title, 50, `features[${i}].title`);
		feature.description = truncateField(feature.description, 120, `features[${i}].description`);
		if (feature.icon && feature.icon.length > 10) {
			feature.icon = feature.icon.substring(0, 10);
			warnings.push(`Truncated feature[${i}].icon to 10 characters`);
			changed = true;
		}
	}
	
	// Sanitize optional pages
	if (config.pages.about?.blurb) {
		config.pages.about.blurb = truncateField(config.pages.about.blurb, 500, "about.blurb");
	}
	
	if (config.pages.contact?.emailPlaceholder) {
		config.pages.contact.emailPlaceholder = truncateField(
			config.pages.contact.emailPlaceholder, 
			100, 
			"contact.emailPlaceholder"
		);
	}
	
	return { changed, warnings };
}

/**
 * Validate professional tone and content quality
 */
export function validateProfessionalTone(config: SiteConfig): { valid: boolean; warnings: string[] } {
	const warnings: string[] = [];
	
	// Patterns that suggest unprofessional content
	const unprofessionalPatterns = [
		/\b(awesome|amazing|incredible|unbelievable)\b/gi,
		/!{2,}/g, // Multiple exclamation marks
		/\b(cheap|cheapest)\b/gi,
		/\b(guarantee|guaranteed)\b/gi,
		/\b(best|#1|number one)\b/gi,
	];
	
	const allText = JSON.stringify(config).toLowerCase();
	
	for (const pattern of unprofessionalPatterns) {
		const matches = allText.match(pattern);
		if (matches) {
			warnings.push(`Consider revising potentially unprofessional language: ${matches[0]}`);
		}
	}
	
	return {
		valid: warnings.length === 0,
		warnings,
	};
}

export default {
	sanitizeSiteConfig,
	validateProfessionalTone,
};