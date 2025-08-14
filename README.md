# Astro + Tailwind + Cloudflare Worker Template

A minimal brochure-site starter template featuring Astro + Tailwind CSS for static pages, with an optional Cloudflare Worker endpoint for contact forms protected by Turnstile and KV storage for replay/throttle protection.

## 🚀 Features

- **Astro + Tailwind**: Modern static site generation with utility-first CSS
- **Responsive Design**: Mobile-first responsive layout with clean typography
- **Contact Form**: Serverless contact form with Cloudflare Worker backend
- **Security**: Turnstile CAPTCHA protection with KV-based replay prevention
- **SEO Optimized**: Meta tags, Open Graph, sitemap, robots.txt
- **Performance**: Lighthouse score ≥90 out of the box
- **CI/CD Ready**: GitHub Actions with automated Lighthouse testing
- **Type Safe**: Full TypeScript support with Zod validation
- **MCP Integration**: Schema-first AI generation with validation and automation

## 🤖 MCP Integration

This template is fully compatible with Model Context Protocol (MCP) for AI-driven website generation:

- **Schema-First Generation**: JSON Schema validation for reliable AI output
- **Component Manifest**: Machine-readable component documentation prevents prop invention
- **Automated Validation**: Built-in validation scripts ensure generated sites build successfully
- **Dry-Run Support**: Test generation without writing files
- **CI/CD Validation**: Automated testing of MCP-generated outputs

### Quick MCP Usage

```bash
# Generate site from prompt
pnpm mcp:gen --prompt "Create a portfolio site for Design Co" --format json

# Validate generated config
tsx scripts/validate-site-config.ts site.config.generated.json

# Test build with generated config
pnpm build
```

**📖 [Full MCP Documentation](./docs/mcp-integration.md)**

## 📁 Project Structure

```
├── astro.config.mjs          # Astro configuration
├── package.json              # Dependencies and scripts
├── tailwind.config.ts        # Tailwind CSS configuration
├── tsconfig.json             # TypeScript configuration
├── wrangler.toml             # Cloudflare Worker configuration
├── .env.example              # Environment variables template
├── site.config.json          # Site content configuration
├── public/
│   ├── favicon.svg           # Site favicon
│   ├── og.png                # Open Graph image
│   └── robots.txt            # Search engine robots file
├── src/
│   ├── layouts/
│   │   └── Base.astro        # Base HTML layout
│   ├── components/
│   │   ├── Nav.astro         # Navigation component
│   │   ├── Footer.astro      # Footer component
│   │   ├── ui/
│   │   │   └── Button.astro  # Reusable button component
│   │   └── sections/         # Page sections
│   │       ├── Hero.astro
│   │       ├── Features.astro
│   │       ├── CTA.astro
│   │       └── FAQ.astro
│   ├── pages/
│   │   ├── index.astro       # Home page
│   │   ├── services.astro    # Services page
│   │   ├── about.astro       # About page
│   │   ├── contact.astro     # Contact page with form
│   │   └── api/
│   │       └── contact.ts    # Contact form API endpoint
│   ├── lib/
│   │   ├── env.ts            # Environment validation
│   │   ├── turnstile.ts      # Turnstile verification logic
│   │   └── security/
│   │       └── headers.ts    # Security headers configuration
│   └── styles/
│       └── tokens.css        # CSS custom properties
├── scripts/
│   └── generate.ts           # Page generation script
└── .github/
    └── workflows/
        └── ci.yml            # GitHub Actions CI pipeline
```

## 🛠 Quick Start

### Prerequisites

- Node.js 18+ 
- pnpm 8+
- Cloudflare account (for Worker deployment)

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Environment Setup

Copy the environment template:

```bash
cp .env.example .env
```

Configure your environment variables:

```bash
# Required for contact form
RESEND_API_KEY=re_...              # Get from https://resend.com
TURNSTILE_SITE_KEY=0x...           # Get from Cloudflare Dashboard
TURNSTILE_SECRET_KEY=0x...         # Get from Cloudflare Dashboard
PUBLIC_SITE_NAME=Your Company
```

### 3. Development

Start the development server:

```bash
pnpm dev
```

Your site will be available at `http://localhost:4321`

## ☁️ Cloudflare Setup

### KV Namespace Setup

1. Create KV namespaces for development and production:

```bash
# Development
wrangler kv:namespace create "EDGE_STORE"
wrangler kv:namespace create "EDGE_STORE" --preview

# Production  
wrangler kv:namespace create "EDGE_STORE" --env prod
wrangler kv:namespace create "EDGE_STORE" --env prod --preview
```

2. Update `wrangler.toml` with your KV namespace IDs:

```toml
kv_namespaces = [
  { binding = "EDGE_STORE", id = "your-dev-kv-id" }
]

[env.prod]
kv_namespaces = [
  { binding = "EDGE_STORE", id = "your-prod-kv-id" }  
]
```

### Turnstile Setup

1. Go to Cloudflare Dashboard > Turnstile
2. Create a new site key for your domain
3. Add the site key and secret to your environment variables

### Worker Secrets

Set production secrets:

```bash
# For production environment
echo "your-resend-api-key" | wrangler secret put RESEND_API_KEY --env prod
echo "your-turnstile-secret" | wrangler secret put TURNSTILE_SECRET_KEY --env prod

# For development/preview
echo "your-resend-api-key" | wrangler secret put RESEND_API_KEY  
echo "your-turnstile-secret" | wrangler secret put TURNSTILE_SECRET_KEY
```

## 📦 Deployment

### Static Site (Pages)

Deploy static version (without contact form API):

```bash
# Build static site
pnpm build

# Deploy to Cloudflare Pages
wrangler pages deploy dist
```

### Full Site with Worker (Hybrid)

Deploy with contact form API:

```bash
# Build the project
pnpm build

# Deploy worker
wrangler deploy

# For production
wrangler deploy --env prod
```

## 🔧 Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production  
- `pnpm preview` - Preview production build
- `pnpm lint` - Run linter
- `pnpm format` - Format code
- `pnpm test` - Run tests
- `pnpm gen` - Generate pages from config
- `pnpm gen --check` - Check page generation without writing

## 🎨 Customization

### Site Configuration

Edit `site.config.json` to update site content:

```json
{
  "name": "Your Company",
  "description": "Your company description",
  "pages": {
    "home": {
      "hero": {
        "title": "Welcome to Your Company"
      }
    }
  }
}
```

### Styling

CSS custom properties in `src/styles/tokens.css`:

```css
:root {
  --color-primary: 199 89% 48%;  /* Primary brand color */
  --radius: 16px;                /* Border radius */
  --container: 72rem;            /* Max container width */
  --font-sans: ui-sans-serif, system-ui, sans-serif;
}
```

### Adding Pages

1. Create new `.astro` files in `src/pages/`
2. Update navigation in `src/components/Nav.astro`
3. Add page config to `site.config.json`

## 🔒 Security Features

- **CSP Headers**: Content Security Policy prevents XSS
- **Turnstile Protection**: CAPTCHA prevents bot submissions  
- **Rate Limiting**: KV-based throttling for failed attempts
- **Replay Prevention**: Token replay protection via KV storage
- **Input Validation**: Zod schema validation
- **HTTPS Only**: Strict transport security headers

## 📊 Performance

- **Lighthouse Scores**: Configured for ≥90 in all categories
- **Bundle Size**: Minimal JavaScript footprint
- **Image Optimization**: Astro's built-in image optimization
- **CSS**: Utility-first approach with Tailwind CSS
- **Caching**: Optimized caching headers

## 🧪 Testing

The template includes:

- **Linting**: Biome for code quality
- **Type Checking**: TypeScript strict mode
- **Build Testing**: Automated build verification  
- **Lighthouse CI**: Performance monitoring
- **E2E Testing**: Playwright setup (optional)

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `pnpm lint && pnpm build`
5. Submit a pull request

## 🆘 Troubleshooting

### Common Issues

**Build fails with module not found**
- Ensure all dependencies are installed: `pnpm install`
- Check import paths use `@/` alias correctly

**Contact form not working**
- Verify environment variables are set
- Check KV namespace IDs in `wrangler.toml`
- Ensure Turnstile keys are valid for your domain

**Lighthouse scores low**
- Check image optimization settings
- Verify CSP headers aren't blocking resources
- Test with production build: `pnpm build && pnpm preview`

### Environment Switching

```bash
# Development
wrangler dev

# Production  
wrangler deploy --env prod
```

---

This template serves as a foundation for LLM-driven website generation, providing a robust structure that can be customized based on business requirements and design preferences.