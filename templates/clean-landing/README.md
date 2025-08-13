# Clean Landing Page Template

A modern, minimal brochure-site starter built with Astro and Tailwind CSS. Perfect for businesses, agencies, and professional service providers.

## 🚀 Features

- **Astro + Tailwind**: Modern static site generation with utility-first CSS
- **Responsive Design**: Mobile-first responsive layout with clean typography
- **Contact Form**: Serverless contact form with Cloudflare Worker backend
- **Security**: Turnstile CAPTCHA protection with KV-based replay prevention
- **SEO Optimized**: Meta tags, Open Graph, sitemap, robots.txt
- **Performance**: Lighthouse score ≥90 out of the box
- **CI/CD Ready**: GitHub Actions with automated Lighthouse testing
- **Type Safe**: Full TypeScript support with Zod validation

## 🛠 Quick Start

1. Install dependencies:
```bash
pnpm install
```

2. Start development server:
```bash
pnpm dev
```

3. Build for production:
```bash
pnpm build
```

## 📦 What's Included

- Modern Astro + Tailwind setup
- Responsive component library
- Contact form with Cloudflare Worker integration
- SEO and performance optimizations
- TypeScript configuration
- Automated testing and CI

## 🎨 Customization

### Design Tokens

The template uses a systematic approach to design tokens defined in `tokens.json`:
- Colors: Primary, accent, background, foreground
- Typography: Font families, sizes, line heights
- Spacing: Consistent spacing scale
- Layout: Container widths, breakpoints

### Components

Pre-built, customizable components:
- `Nav.astro` - Responsive navigation
- `Hero.astro` - Hero section with CTA
- `Features.astro` - Feature grid
- `Footer.astro` - Site footer
- `Button.astro` - Styled button component

### Content Management

Content is managed through `site.config.json` for easy customization without touching component code.

## ☁️ Deployment

### Static Deployment
Deploy to any static hosting provider:
```bash
pnpm build
# Upload /dist folder to your hosting provider
```

### Cloudflare (Full Stack)
Deploy with contact form functionality:
```bash
# Setup KV namespace and Turnstile (see main docs)
wrangler deploy
```

## 🔒 Security Features

- Content Security Policy headers
- Turnstile CAPTCHA protection
- Form submission rate limiting
- Environment variable validation

## 📊 Performance

- Lighthouse score ≥90
- Optimized images and assets
- Minimal JavaScript payload
- Efficient CSS delivery

This template provides a solid foundation for business websites with modern tooling and deployment options.