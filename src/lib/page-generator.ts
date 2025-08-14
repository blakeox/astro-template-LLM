import * as fs from "node:fs";
import type { SiteConfig, HomePage, AboutPage, ContactPage, ServicesPage } from "../types/site-config.js";

/**
 * Generate Astro page content from site configuration
 * @param config - Site configuration object
 * @param pageName - Name of the page to generate ('home', 'about', 'contact', 'services')
 * @returns Generated Astro page content as string
 */
export function generatePageContent(config: SiteConfig, pageName: keyof SiteConfig["pages"]): string {
	const pageConfig = config.pages[pageName];
	if (!pageConfig) {
		throw new Error(`Page configuration not found for: ${pageName}`);
	}

	switch (pageName) {
		case "home":
			return generateHomePage(config, pageConfig);
		case "about":
			return generateAboutPage(config, pageConfig);
		case "contact":
			return generateContactPage(config, pageConfig);
		case "services":
			return generateServicesPage(config, pageConfig);
		default:
			throw new Error(`Unsupported page type: ${pageName}`);
	}
}

function generateHomePage(config: SiteConfig, pageConfig: HomePage): string {
	return `---
import Layout from "@/layouts/Layout.astro";
import Hero from "@/components/sections/Hero.astro";
import Features from "@/components/sections/Features.astro";

const hero = ${JSON.stringify(pageConfig.hero, null, 2)};
const features = ${JSON.stringify(pageConfig.features, null, 2)};
---

<Layout 
  title="${config.name}"
  description="${config.description}"
>
  <Hero hero={hero} siteName="${config.name}" />
  <Features features={features} />
</Layout>`;
}

function generateAboutPage(config: SiteConfig, pageConfig: AboutPage): string {
	const hero = pageConfig.hero || {
		title: `About ${config.name}`,
		subtitle: pageConfig.blurb || `Learn more about ${config.name} and our commitment to excellence.`
	};

	return `---
import Layout from "@/layouts/Layout.astro";
import Hero from "@/components/sections/Hero.astro";

const hero = ${JSON.stringify(hero, null, 2)};
---

<Layout 
  title="About - ${config.name}"
  description="Learn more about ${config.name} and our story"
>
  <Hero hero={hero} siteName="${config.name}" />
  
  <section class="py-16 bg-white">
    <div class="container mx-auto px-6">
      <div class="max-w-3xl mx-auto">
        <div class="prose prose-lg mx-auto">
          <p class="text-xl text-gray-600 leading-relaxed">
            ${pageConfig.blurb || `${config.name} is committed to delivering exceptional results through innovative solutions and dedicated service.`}
          </p>
        </div>
      </div>
    </div>
  </section>
</Layout>`;
}

function generateContactPage(config: SiteConfig, pageConfig: ContactPage): string {
	const hero = pageConfig.hero || {
		title: `Contact ${config.name}`,
		subtitle: "Get in touch with us to discuss your project and requirements."
	};

	return `---
import Layout from "@/layouts/Layout.astro";
import Hero from "@/components/sections/Hero.astro";

const hero = ${JSON.stringify(hero, null, 2)};
---

<Layout 
  title="Contact - ${config.name}"
  description="Get in touch with ${config.name} for professional services"
>
  <Hero hero={hero} siteName="${config.name}" />
  
  <section class="py-16 bg-gray-50">
    <div class="container mx-auto px-6">
      <div class="max-w-md mx-auto">
        <form class="bg-white p-8 rounded-lg shadow-md">
          <div class="mb-6">
            <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input 
              type="email" 
              id="email" 
              name="email"
              placeholder="${pageConfig.emailPlaceholder || "Enter your email address"}"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              required 
            />
          </div>
          
          <div class="mb-6">
            <label for="message" class="block text-sm font-medium text-gray-700 mb-2">
              Message
            </label>
            <textarea 
              id="message" 
              name="message"
              rows="4"
              placeholder="Tell us about your project..."
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              required
            ></textarea>
          </div>
          
          <button 
            type="submit"
            class="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-dark transition-colors"
          >
            Send Message
          </button>
        </form>
      </div>
    </div>
  </section>
</Layout>`;
}

function generateServicesPage(config: SiteConfig, pageConfig: ServicesPage): string {
	const hero = pageConfig.hero || {
		title: `${config.name} Services`,
		subtitle: `Professional services and solutions from ${config.name}`
	};

	return `---
import Layout from "@/layouts/Layout.astro";
import Hero from "@/components/sections/Hero.astro";

const hero = ${JSON.stringify(hero, null, 2)};
const services = ${JSON.stringify(pageConfig.services || [], null, 2)};
---

<Layout 
  title="Services - ${config.name}"
  description="Professional services offered by ${config.name}"
>
  <Hero hero={hero} siteName="${config.name}" />
  
  <section class="py-16 bg-white">
    <div class="container mx-auto px-6">
      {services.length > 0 ? (
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service) => (
            <div class="bg-gray-50 p-6 rounded-lg">
              <h3 class="text-xl font-semibold mb-3">{service.title}</h3>
              <p class="text-gray-600 mb-4">{service.description}</p>
              {service.features && service.features.length > 0 && (
                <ul class="space-y-2">
                  {service.features.map((feature) => (
                    <li class="text-sm text-gray-700 flex items-center">
                      <span class="w-2 h-2 bg-primary rounded-full mr-2"></span>
                      {feature}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div class="text-center max-w-2xl mx-auto">
          <p class="text-lg text-gray-600">
            Contact us to learn more about our comprehensive professional services.
          </p>
        </div>
      )}
    </div>
  </section>
</Layout>`;
}

/**
 * Write generated page content to file system
 * @param config - Site configuration
 * @param pageName - Page name to generate
 * @param outputDir - Output directory (defaults to src/pages)
 * @param overwrite - Whether to overwrite existing files
 * @returns Promise<boolean> - Success status
 */
export async function writePageFile(
	config: SiteConfig, 
	pageName: keyof SiteConfig["pages"], 
	outputDir = "src/pages",
	overwrite = false
): Promise<boolean> {
	try {
		const pageContent = generatePageContent(config, pageName);
		const fileName = pageName === "home" ? "index.astro" : `${pageName}.astro`;
		const filePath = `${outputDir}/${fileName}`;

		// Check if file exists and overwrite flag
		if (fs.existsSync(filePath) && !overwrite) {
			console.warn(`⚠️  File ${fileName} already exists, skipping (use overwrite=true to replace)`);
			return false;
		}

		fs.writeFileSync(filePath, pageContent);
		console.log(`✅ Generated ${fileName}`);
		return true;
	} catch (error) {
		console.error(`❌ Failed to generate ${pageName} page:`, (error as Error).message);
		return false;
	}
}

/**
 * Generate all pages from site configuration
 * @param config - Site configuration
 * @param outputDir - Output directory
 * @param overwrite - Whether to overwrite existing files
 * @returns Promise<{ written: number; skipped: number; errors: string[] }>
 */
export async function generateAllPages(
	config: SiteConfig,
	outputDir = "src/pages", 
	overwrite = false
): Promise<{ written: number; skipped: number; errors: string[] }> {
	const results = { written: 0, skipped: 0, errors: [] as string[] };

	for (const pageName of Object.keys(config.pages) as Array<keyof SiteConfig["pages"]>) {
		try {
			const success = await writePageFile(config, pageName, outputDir, overwrite);
			if (success) {
				results.written++;
			} else {
				results.skipped++;
			}
		} catch (error) {
			results.errors.push(`${pageName}: ${(error as Error).message}`);
		}
	}

	return results;
}