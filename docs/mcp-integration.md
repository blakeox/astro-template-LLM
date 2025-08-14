# MCP Integration Documentation

This document describes the **enhanced** Model Context Protocol (MCP) integration for the astro-template-LLM repository, enabling schema-first, AI-driven website generation with advanced validation, intelligent prompt parsing, and robust automation.

## 🚀 Recent Enhancements

### Enhanced Business Type Detection
- **Sophisticated Business Classification**: Automatically detects 12+ business types (legal, restaurant, consulting, design studio, agency, medical, etc.)
- **Contextual Content Generation**: Features, descriptions, and hero content tailored to specific business types
- **Intelligent Name Extraction**: Advanced regex patterns for extracting company names from natural language

### Improved MCP Client
- **Real MCP Server Integration**: `generateSiteConfigFromMCP()` function with HTTP client, retry logic, and timeout handling
- **Enhanced Validation**: Full Zod schema validation with detailed error reporting
- **Environment Configuration**: Automatic configuration loading from environment variables
- **Graceful Fallbacks**: Local generation when MCP server is unavailable

### Dynamic Component System
- **Props-Based Components**: Hero and Features components now accept dynamic props
- **Updated Component Manifest**: Machine-readable documentation with proper prop specifications
- **Schema Validation**: All generated content validates against strict JSON schema

### Developer Experience
- **Enhanced CLI**: New `pnpm mcp:cli` command with comprehensive options
- **Comprehensive Testing**: Full test suite covering MCP functionality
- **Better Error Handling**: Type-safe error handling throughout the codebase
- **Webhook Support**: API endpoint for real-time MCP server integration

## Overview

The MCP integration allows Large Language Models (LLMs) to:
- Generate valid site configurations using a strict JSON schema
- Use machine-readable component manifests to avoid prop invention
- Perform dry-run generation and validation before deployment
- Create pull requests with validated artifacts for Cloudflare Pages deployment

## Protocol Expectations

### Schema-First Approach
All site generation must validate against `site.config.schema.json`:
- Strict type validation with Zod runtime checks
- Character limits enforced (hero titles <60 chars, features <120 chars)
- Required field validation
- No arbitrary properties allowed

### Component Manifest Usage
Components are defined in `components/manifest.json`:
- Only use documented components and props
- Follow slot usage patterns as specified
- Respect component guidelines and limitations
- Reference usage examples for proper implementation

## Local Development

### Prerequisites
- Node.js ≥18.0.0
- pnpm ≥8.0.0
- Repository cloned locally

### Setup
```bash
# Install dependencies
pnpm install

# Set up environment (copy and configure)
cp .env.example .env

# Verify current setup
pnpm build
pnpm mcp:gen --help
pnpm mcp:cli --help

# Run enhancement demo
pnpm exec tsx scripts/demo-mcp-enhancements.ts
```

### Running MCP-Driven Sessions

#### Enhanced Generation with New CLI
```bash
# Generate with comprehensive options
pnpm mcp:cli --prompt "Create a law firm website for Smith & Associates" --validate --verbose

# Full workflow: prompt -> config -> pages  
pnpm mcp:cli --prompt "Portfolio for Creative Studio" --generate-pages --verbose --dry

# Generate and save custom output
pnpm mcp:cli --prompt "Restaurant site for Bella's Cafe" --output custom-config.json --validate
```

#### Basic Generation (Legacy)
```bash
# Generate from prompt with dry run
pnpm mcp:gen --dry --prompt "Create a portfolio site for Design Co"

# Generate and save to file
pnpm mcp:gen --prompt "Build a consulting website" --format json --out generated.json

# Validate generated config
tsx scripts/validate-site-config.ts generated.json
```

#### Testing and Validation
```bash
# Test with sample prompt (used in CI)
pnpm mcp:gen --dry --prompt "$(cat scripts/sample-mcp-prompt.txt)" --format json

# Validate against schema
tsx scripts/validate-site-config.ts site.config.json

# Build with generated config
pnpm build
```

#### Advanced Options
```bash
# Custom config path
pnpm mcp:gen --config custom.config.json --check

# Output formatting
pnpm mcp:gen --prompt "Generate site" --format json > output.json
pnpm mcp:gen --prompt "Generate site" --format text
```

## Creating Pull Requests from MCP Output

### Automated Workflow
1. **Generate Configuration**: Use MCP to create site.config.json
2. **Validate Output**: Ensure schema compliance and build success
3. **Create Branch**: Use `mcp/integration/<id>` naming convention
4. **Commit Changes**: Use `mcp:` prefix for commit messages
5. **Open PR**: Include validation results and sample prompts

### Manual Process
```bash
# 1. Create branch
git checkout -b mcp/integration/$(date +%Y%m%d-%H%M)

# 2. Generate and validate
pnpm mcp:gen --prompt "Your prompt here" --format json --out site.config.generated.json
tsx scripts/validate-site-config.ts site.config.generated.json

# 3. Test build
cp site.config.json site.config.backup.json
cp site.config.generated.json site.config.json
pnpm build
cp site.config.backup.json site.config.json

# 4. Commit if successful
git add site.config.generated.json
git commit -m "mcp: generated config from prompt"

# 5. Create PR with proper metadata
```

### PR Requirements
- **Title**: `[MCP] Description of changes`
- **Body**: Include prompt used, validation results, local test commands
- **Labels**: `mcp-integration`
- **Reviewers**: `@blakeox` (if available)

## Example Prompts

### Basic Brochure Site
```
Create a small brochure site for "Lumen Studio". Include home.hero.title, home.hero.subtitle, home.features (3 items), about.blurb, contact.emailPlaceholder. Keep hero title under 8 words and feature descriptions under 120 characters.
```

### Consulting Website
```
Generate a professional consulting website for "Apex Advisory Group". Include 4 features on the home page focusing on business consulting services. Add an about page with company description.
```

### Portfolio Site
```
Create a portfolio website for "Digital Craftworks" web development agency. Include home page with hero and 3 service features. Add contact page with email placeholder. Keep content professional and concise.
```

## Validation and Error Handling

### Common Validation Errors
- **Character Limits**: Hero title >60 chars, feature description >120 chars
- **Missing Required Fields**: name, description, pages.home required
- **Invalid Structure**: Incorrect nesting or property names
- **Type Mismatches**: String where object expected, etc.

### Debugging Tips
```bash
# Validate specific config
tsx scripts/validate-site-config.ts your-config.json

# Test generation with verbose output
pnpm mcp:gen --prompt "test" --format text

# Check build with config
cp test.config.json site.config.json && pnpm build
```

### Schema Validation
The Zod schema in `scripts/generate.ts` provides:
- Runtime type checking
- Detailed error messages
- Safe parsing with error collection
- Integration with validation scripts

## Integration with External MCP Servers

### Client Configuration
The `src/lib/mcp-client.ts` provides:
- Typed function interfaces
- Error handling patterns
- Webhook signature verification
- Response format standardization

### Security Considerations
- No secrets in generated configs
- Webhook signature verification required
- Input sanitization and validation
- Rate limiting (implement in production)

### Production Setup
```bash
# Environment variables (add to .env)
MCP_SERVER_URL=https://your-mcp-server.com
MCP_WEBHOOK_SECRET=your-webhook-secret
MCP_API_KEY=your-api-key

# Cloudflare deployment
wrangler secret put MCP_API_KEY
wrangler secret put MCP_WEBHOOK_SECRET
```

## Troubleshooting

### Generation Fails
1. Check prompt formatting and length
2. Validate schema compliance
3. Review character limits
4. Test with sample prompts

### Build Fails After Generation
1. Validate generated config syntax
2. Check for missing required fields
3. Verify component usage
4. Review import paths

### CI Pipeline Issues
1. Check workflow file syntax
2. Validate sample prompt file
3. Review dependency installation
4. Check artifact upload permissions

## Contributing

### Adding New Schema Fields
1. Update `site.config.schema.json`
2. Update TypeScript types in `src/types/site-config.ts`
3. Update Zod schema in `scripts/generate.ts`
4. Add validation tests
5. Update documentation

### Component Manifest Updates
1. Analyze component props and slots
2. Update `components/manifest.json`
3. Add usage examples
4. Document MCP-specific requirements
5. Test with generation scripts

## Support

For issues with MCP integration:
1. Check existing documentation
2. Review example prompts and outputs
3. Validate against schema
4. Test locally before creating issues
5. Include full error output and reproduction steps