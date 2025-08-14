// TypeScript types for site.config.json - generated from site.config.schema.json
// This file provides type safety for MCP-driven site configuration

export interface Image {
	url: string;
	alt: string;
}

export interface CTA {
	text: string;
	href: string;
}

export interface Hero {
	title: string;
	subtitle: string;
	cta?: {
		primary?: CTA;
		secondary?: CTA;
	};
}

export interface Feature {
	icon?: string;
	title: string;
	description: string;
}

export interface Service {
	title: string;
	description: string;
	features?: string[];
}

export interface TeamMember {
	name: string;
	role: string;
	bio?: string;
}

export interface HomePage {
	hero: Hero;
	features: Feature[];
}

export interface AboutPage {
	hero?: Hero;
	blurb?: string;
	team?: TeamMember[];
}

export interface ContactPage {
	hero?: Hero;
	emailPlaceholder?: string;
	address?: string;
	phone?: string;
}

export interface ServicesPage {
	hero?: Hero;
	services?: Service[];
}

export interface SitePages {
	home: HomePage;
	about?: AboutPage;
	contact?: ContactPage;
	services?: ServicesPage;
}

export interface SiteConfig {
	name: string;
	description: string;
	pages: SitePages;
	images?: Image[];
}

// Type guards for validation
export function isValidSiteConfig(obj: unknown): obj is SiteConfig {
	if (!obj || typeof obj !== "object") return false;
	const anyObj = obj as Record<string, unknown>;
	if (typeof anyObj.name !== "string") return false;
	if (typeof anyObj.description !== "string") return false;
	if (!anyObj.pages || typeof anyObj.pages !== "object") return false;
	const pages = anyObj.pages as Record<string, unknown>;
	const home = pages.home as unknown;
	if (!home || typeof home !== "object") return false;
	return true;
}

export function isValidHero(obj: unknown): obj is Hero {
	if (!obj || typeof obj !== "object") return false;
	const anyObj = obj as Record<string, unknown>;
	return (
		typeof anyObj.title === "string" && typeof anyObj.subtitle === "string"
	);
}

export function isValidFeature(obj: unknown): obj is Feature {
	if (!obj || typeof obj !== "object") return false;
	const anyObj = obj as Record<string, unknown>;
	return (
		typeof anyObj.title === "string" && typeof anyObj.description === "string"
	);
}
