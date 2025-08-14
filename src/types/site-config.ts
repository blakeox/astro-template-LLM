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
export function isValidSiteConfig(obj: any): obj is SiteConfig {
	return (
		obj &&
		typeof obj === "object" &&
		typeof obj.name === "string" &&
		typeof obj.description === "string" &&
		obj.pages &&
		typeof obj.pages === "object" &&
		obj.pages.home &&
		typeof obj.pages.home === "object"
	);
}

export function isValidHero(obj: any): obj is Hero {
	return (
		obj &&
		typeof obj === "object" &&
		typeof obj.title === "string" &&
		typeof obj.subtitle === "string"
	);
}

export function isValidFeature(obj: any): obj is Feature {
	return (
		obj &&
		typeof obj === "object" &&
		typeof obj.title === "string" &&
		typeof obj.description === "string"
	);
}
