# Template Specification

This document defines the specification for templates in the Astro Template Registry, including manifest format, file structure requirements, and integration API for LLM-driven chatbot consumption.

## Overview

The Astro Template Registry is designed to provide machine-readable template metadata that enables LLM-driven chatbots to discover, fetch, and customize Astro templates programmatically. Each template must be self-contained with proper metadata and assets.

## Directory Structure

```
/templates/
├── index.json                    # Registry index with all templates
├── {template-id}/
│   ├── manifest.json            # Template metadata and configuration
│   ├── tokens.json             # Design tokens (colors, typography, spacing)
│   ├── preview.png             # Template preview image (1200x630px)
│   ├── README.md               # Human-readable documentation
│   ├── src/                    # Astro source files
│   ├── public/                 # Static assets
│   ├── package.json            # Dependencies and scripts
│   ├── astro.config.mjs        # Astro configuration
│   ├── tailwind.config.ts      # Tailwind configuration
│   └── [other config files]   # Additional configuration as needed
```

## Registry Index (`templates/index.json`)

The main registry file that lists all available templates:

```json
{
  "name": "string",                    // Registry name
  "description": "string",             // Registry description
  "version": "string",                 // Registry version (semver)
  "templates": [                       // Array of template summaries
    {
      "id": "string",                  // Unique template identifier
      "name": "string",                // Human-readable template name
      "description": "string",         // Brief description
      "version": "string",             // Template version (semver)
      "tags": ["string"],             // Searchable tags
      "preview": "string",            // Path to preview image
      "manifest": "string",           // Path to manifest.json
      "repository": "string",         // Git repository URL
      "demo": "string|null",          // Live demo URL (optional)
      "author": "string",             // Template author
      "license": "string",            // License identifier
      "created_at": "ISO8601",        // Creation timestamp
      "updated_at": "ISO8601",        // Last update timestamp
      "capabilities": ["string"],     // Template capabilities
      "framework": "string",          // Framework used (astro)
      "styling": "string",            // Styling approach
      "deployment": ["string"]        // Supported deployment targets
    }
  ],
  "stats": {                          // Registry statistics
    "total_templates": "number",
    "frameworks": {}, 
    "styling": {},
    "deployment_targets": {}
  },
  "api_version": "string",            // API version
  "last_updated": "ISO8601"          // Registry last update
}
```

## Template Manifest (`manifest.json`)

Detailed template metadata for chatbot consumption:

```json
{
  "id": "string",                     // Template identifier
  "name": "string",                   // Template name
  "description": "string",            // Detailed description
  "version": "string",                // Template version (semver)
  "license": "string",                // License (MIT, Apache-2.0, etc.)
  "author": "string",                 // Author name
  "tags": ["string"],                // Searchable tags
  "capabilities": ["string"],        // Functional capabilities
  "compatibility": {                  // Version requirements
    "node": "string",                 // Node.js version range
    "pnpm": "string",                 // pnpm version range (optional)
    "astro": "string"                 // Astro version range
  },
  "framework": "string",              // astro
  "styling": "string",                // tailwindcss, css, scss, etc.
  "deployment": ["string"],           // cloudflare-pages, vercel, netlify, static
  "preview": "string",                // Relative path to preview image
  "tokens": "string",                 // Relative path to tokens.json
  "entry_point": "string",            // Main entry file (src/pages/index.astro)
  "build_command": "string",          // Build command (pnpm build)
  "dev_command": "string",            // Dev server command (pnpm dev)
  "install_command": "string",        // Install command (pnpm install)
  "features": {                       // Feature configuration
    "contact_form": {
      "enabled": "boolean",
      "provider": "string",           // cloudflare-worker, netlify, etc.
      "protection": "string"          // turnstile, recaptcha, etc.
    },
    "seo": {
      "enabled": "boolean",
      "meta_tags": "boolean",
      "open_graph": "boolean",
      "sitemap": "boolean"
    },
    "performance": {
      "lighthouse_score": "string",   // >=90, >=95, etc.
      "image_optimization": "boolean",
      "css_optimization": "boolean"
    },
    "security": {
      "csp_headers": "boolean",
      "security_headers": "boolean",
      "form_protection": "boolean"
    }
  },
  "pages": ["string"],                // Available pages/routes
  "components": ["string"],           // Available components
  "created_at": "ISO8601",            // Creation timestamp
  "updated_at": "ISO8601"             // Last update timestamp
}
```

## Design Tokens (`tokens.json`)

Structured design tokens for programmatic theming:

```json
{
  "colors": {
    "primary": {
      "value": "199 89% 48%",         // HSL or hex value
      "description": "string",        // Usage description
      "usage": ["string"]             // Where it's used
    },
    "background": { /* ... */ },
    "foreground": { /* ... */ }
  },
  "typography": {
    "font-family": {
      "sans": {
        "value": "string",            // Font stack
        "description": "string"
      }
    },
    "font-size": {
      "base": {
        "value": "1rem",
        "line-height": "1.5rem"
      }
    }
  },
  "spacing": {
    "1": { "value": "0.25rem", "description": "4px" }
  },
  "borders": {
    "radius": {
      "md": { "value": "0.375rem", "description": "Medium radius" }
    }
  },
  "layout": {
    "container": {
      "value": "72rem",
      "description": "Max container width"
    },
    "breakpoints": {
      "md": { "value": "768px", "description": "Medium screens" }
    }
  }
}
```

## Capabilities Reference

Standard capability identifiers:

- `responsive-design` - Mobile-first responsive layout
- `seo-optimized` - SEO meta tags and structure
- `contact-form` - Contact form functionality
- `blog-support` - Blog/content management
- `e-commerce` - Shopping cart/checkout
- `authentication` - User login/registration
- `dashboard` - Admin/user dashboard
- `multi-language` - Internationalization support
- `cms-integration` - CMS backend integration
- `api-ready` - API endpoints included
- `pwa-ready` - Progressive Web App features
- `accessibility-ready` - WCAG compliance
- `performance-optimized` - Performance optimizations
- `security-headers` - Security header implementation
- `typescript-support` - Full TypeScript support

## Integration API

### Fetching Templates

Chatbots can consume templates via these endpoints:

1. **Registry Index**
   ```
   GET /templates/index.json
   ```
   Returns list of all available templates with summary metadata.

2. **Template Manifest**
   ```
   GET /templates/{template-id}/manifest.json
   ```
   Returns detailed template metadata and configuration.

3. **Design Tokens**
   ```
   GET /templates/{template-id}/tokens.json
   ```
   Returns structured design tokens for theming.

4. **Preview Image**
   ```
   GET /templates/{template-id}/preview.png
   ```
   Returns template preview image (1200x630px).

### Template Download

Templates can be downloaded as:

1. **Git Repository**
   - Clone the repository and navigate to the template subdirectory
   - Use sparse checkout for single template: `git sparse-checkout set templates/{template-id}`

2. **GitHub API**
   - Use GitHub API to download template subdirectory as archive
   - `GET /repos/owner/repo/contents/templates/{template-id}`

3. **Direct File Access**
   - Access individual files via raw GitHub URLs
   - `https://raw.githubusercontent.com/owner/repo/main/templates/{template-id}/path/to/file`

## Template Requirements

### File Structure
- Must be self-contained within template directory
- Must include all configuration files needed to build/run
- Must include package.json with proper dependencies
- Must include README.md with human documentation

### Metadata
- Must include valid manifest.json
- Must include tokens.json with design system
- Must include preview.png (1200x630px recommended)
- Must specify compatibility requirements

### Code Quality
- Must build successfully without errors
- Must pass linting with repository standards
- Must include proper TypeScript types
- Must follow accessibility best practices

### Testing
- Must include basic build verification
- Should include component tests where applicable
- Must document any external service requirements

## Accessibility Requirements

Templates must meet these accessibility standards:

- Semantic HTML structure
- Proper heading hierarchy (h1-h6)
- Alt text for all images
- Keyboard navigation support
- Focus indicators
- Color contrast ratios ≥ 4.5:1 for normal text
- Screen reader compatibility
- Skip links for main content

## Performance Requirements

Templates should meet these performance criteria:

- Lighthouse score ≥ 90 (all categories)
- First Contentful Paint < 1.5s
- Largest Contentful Paint < 2.5s
- Cumulative Layout Shift < 0.1
- Optimized images (WebP where possible)
- Minimal JavaScript bundle size
- Efficient CSS delivery

## Security Requirements

Templates must implement:

- Content Security Policy headers
- Secure form handling
- Input validation and sanitization
- Environment variable protection
- HTTPS enforcement
- Protection against common vulnerabilities (XSS, CSRF)

## Version Management

- Use semantic versioning (semver) for templates
- Update `updated_at` timestamp on changes
- Maintain compatibility matrix for dependencies
- Document breaking changes in README
- Archive deprecated templates rather than deleting

This specification ensures templates are discoverable, consumable, and maintainable for both human developers and LLM-driven systems.