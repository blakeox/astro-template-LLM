import * as fs from 'node:fs';
import * as path from 'node:path';

interface SiteConfig {
  name: string;
  description: string;
  pages: Record<string, Record<string, unknown>>;
}

interface GenerateOptions {
  check?: boolean;
}

interface GenerateResult {
  written: number;
  skipped: number;
  warnings: string[];
}

async function generatePages(options: GenerateOptions = {}): Promise<GenerateResult> {
  const configPath = path.resolve('site.config.json');
  const pagesDir = path.resolve('src/pages');
  
  if (!fs.existsSync(configPath)) {
    throw new Error('site.config.json not found');
  }

  const config: SiteConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  const result: GenerateResult = {
    written: 0,
    skipped: 0,
    warnings: []
  };

  console.log(`Generating pages for: ${config.name}`);
  
  if (options.check) {
    console.log('Check mode enabled - no files will be written');
  }

  // Ensure pages directory exists
  if (!fs.existsSync(pagesDir)) {
    fs.mkdirSync(pagesDir, { recursive: true });
  }

  // Generate pages based on config
  for (const [pageName, pageConfig] of Object.entries(config.pages)) {
    const filename = pageName === 'home' ? 'index.astro' : `${pageName}.astro`;
    const filepath = path.join(pagesDir, filename);
    
    if (fs.existsSync(filepath) && !options.check) {
      console.log(`⚠️  Skipping existing file: ${filename}`);
      result.skipped++;
      continue;
    }

    if (!options.check) {
      console.log(`✅ Would generate: ${filename}`);
      result.written++;
    } else {
      console.log(`🔍 Checking: ${filename}`);
    }
  }

  return result;
}

// CLI handling
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const checkMode = args.includes('--check');
  
  try {
    const result = await generatePages({ check: checkMode });
    console.log('\n📊 Generation Summary:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      for (const warning of result.warnings) {
        console.log(`  - ${warning}`);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}