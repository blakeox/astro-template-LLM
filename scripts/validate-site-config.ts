import * as fs from 'node:fs';
import * as path from 'node:path';
import { z } from 'zod';

// Zod schema matching site.config.schema.json
const SiteConfigSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(200),
  pages: z.object({
    home: z.object({
      hero: z.object({
        title: z.string().min(1).max(60),
        subtitle: z.string().min(1).max(300),
        cta: z.object({
          primary: z.object({
            text: z.string().min(1).max(50),
            href: z.string().min(1)
          }).optional(),
          secondary: z.object({
            text: z.string().min(1).max(50),
            href: z.string().min(1)
          }).optional()
        }).optional()
      }),
      features: z.array(z.object({
        icon: z.string().max(10).optional(),
        title: z.string().min(1).max(50),
        description: z.string().min(1).max(120)
      })).min(1).max(6)
    }),
    about: z.object({
      hero: z.object({
        title: z.string().min(1).max(60),
        subtitle: z.string().min(1).max(300)
      }).optional(),
      blurb: z.string().min(1).max(500).optional()
    }).optional(),
    contact: z.object({
      hero: z.object({
        title: z.string().min(1).max(60),
        subtitle: z.string().min(1).max(300)
      }).optional(),
      emailPlaceholder: z.string().min(1).max(100).optional()
    }).optional(),
    services: z.object({
      hero: z.object({
        title: z.string().min(1).max(60),
        subtitle: z.string().min(1).max(300)
      }).optional(),
      services: z.array(z.object({
        title: z.string().min(1).max(50),
        description: z.string().min(1).max(200),
        features: z.array(z.string().max(100)).optional()
      })).optional()
    }).optional()
  }),
  images: z.array(z.object({
    url: z.string().url(),
    alt: z.string().min(1)
  })).optional()
});

async function validateSiteConfig(configPath: string): Promise<void> {
  try {
    if (!fs.existsSync(configPath)) {
      console.error('❌ Config file not found:', configPath);
      process.exit(1);
    }

    console.log('🔍 Validating site config:', configPath);

    const configContent = fs.readFileSync(configPath, 'utf-8');
    let config: any;

    try {
      config = JSON.parse(configContent);
    } catch (parseError) {
      console.error('❌ Invalid JSON in config file:', parseError.message);
      process.exit(1);
    }

    const result = SiteConfigSchema.safeParse(config);

    if (result.success) {
      console.log('✅ Site config is valid!');
      console.log(`   Name: ${config.name}`);
      console.log(`   Description: ${config.description}`);
      console.log(`   Pages: ${Object.keys(config.pages).join(', ')}`);
      
      if (config.pages.home.features) {
        console.log(`   Features: ${config.pages.home.features.length} items`);
      }
      
      if (config.images) {
        console.log(`   Images: ${config.images.length} items`);
      }
      
      process.exit(0);
    } else {
      console.error('❌ Site config validation failed:');
      
      for (const error of result.error.errors) {
        const path = error.path.length > 0 ? error.path.join('.') : 'root';
        console.error(`   ${path}: ${error.message}`);
      }
      
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Validation error:', error.message);
    process.exit(1);
  }
}

// CLI handling
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help')) {
    console.log(`
Usage: tsx scripts/validate-site-config.ts <config-file>

Examples:
  tsx scripts/validate-site-config.ts site.config.json
  tsx scripts/validate-site-config.ts site.config.generated.json
`);
    process.exit(0);
  }

  const configPath = path.resolve(args[0]);
  await validateSiteConfig(configPath);
}