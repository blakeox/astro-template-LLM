# Astro Template Registry

A curated collection of production-ready Astro templates designed for rapid website development and LLM-driven automation. This registry provides machine-readable template metadata, design tokens, and comprehensive tooling to enable both human developers and AI systems to discover, fetch, and customize templates programmatically.

## 🎯 Purpose

This registry serves as a centralized hub for high-quality Astro templates that can be:
- **Discovered** by LLM-driven chatbots and development tools
- **Fetched** programmatically with complete metadata
- **Customized** using structured design tokens
- **Deployed** across multiple platforms with confidence

## 🚀 Quick Start

### For Developers

1. **Browse Templates**: Explore available templates in the [`/templates`](./templates) directory
2. **Choose a Template**: Each template includes a comprehensive `README.md` and preview image
3. **Download**: Clone the repository or download individual template directories
4. **Customize**: Use the provided design tokens and documentation to adapt the template
5. **Deploy**: Follow template-specific deployment instructions

### For LLM Integration

Chatbots and AI systems can consume templates via these API endpoints:

```bash
# Get registry index with all templates
GET /templates/index.json

# Get specific template metadata  
GET /templates/{template-id}/manifest.json

# Get design tokens for theming
GET /templates/{template-id}/tokens.json

# Get preview image
GET /templates/{template-id}/preview.png
```

See [`TEMPLATE_SPEC.md`](./TEMPLATE_SPEC.md) for complete API documentation.

## 📁 Available Templates

### Clean Landing Page
**ID**: `clean-landing` | **Framework**: Astro + Tailwind CSS | **Type**: Business Landing Page

A minimal, professional brochure site perfect for businesses and service providers. Features responsive design, contact forms, SEO optimization, and Cloudflare Worker integration.

- ✅ Mobile-first responsive design
- ✅ Contact form with CAPTCHA protection  
- ✅ SEO optimized (Lighthouse 90+)
- ✅ Security headers and CSP
- ✅ TypeScript support
- ✅ CI/CD ready

[📖 Documentation](./templates/clean-landing/README.md) | [🎨 Preview](./templates/clean-landing/preview.png) | [⚙️ Manifest](./templates/clean-landing/manifest.json)

*More templates coming soon! [Contribute your own](./CONTRIBUTING.md)*

## 🎨 Design System Approach

Each template includes structured design tokens in `tokens.json`:

```json
{
  "colors": {
    "primary": {
      "value": "199 89% 48%",
      "description": "Main brand color",
      "usage": ["buttons", "links", "accents"]
    }
  },
  "typography": {
    "font-size": {
      "heading-1": { "value": "2.25rem", "line-height": "2.5rem" }
    }
  },
  "spacing": {
    "container": { "value": "72rem", "description": "Max content width" }
  }
}
```

This enables programmatic theming and consistent design customization across templates.

## 🛠 Registry Tools

### Template Manager CLI

Validate, create, and manage templates using the built-in CLI:

```bash
# Validate template structure
node tools/template-manager.cjs validate clean-landing

# Update registry index  
node tools/template-manager.cjs update-registry

# Get help
node tools/template-manager.cjs help
```

### Template Validation

All templates must pass validation checks:
- ✅ Required files present (`manifest.json`, `tokens.json`, `README.md`, etc.)
- ✅ Valid JSON syntax in metadata files
- ✅ Builds successfully without errors
- ✅ Lighthouse performance score ≥ 90
- ✅ Accessibility compliance (WCAG 2.1 AA)

## 📋 Template Requirements

### Must Have
- `manifest.json` - Complete template metadata
- `tokens.json` - Design system tokens  
- `preview.png` - Visual preview (1200x630px)
- `README.md` - Human-readable documentation
- `package.json` - Dependencies and build scripts
- `src/` - Astro source files
- `public/` - Static assets

### Quality Standards
- Lighthouse score ≥ 90 (all categories)
- Mobile-first responsive design
- Accessibility compliance (WCAG 2.1 AA)
- Security best practices
- TypeScript support
- Proper error handling

See [`TEMPLATE_SPEC.md`](./TEMPLATE_SPEC.md) for complete requirements.

## 🤝 Contributing

We welcome high-quality template contributions! 

### Adding a New Template

1. Fork this repository
2. Create your template in `/templates/your-template-id/`
3. Include all required files and metadata
4. Test thoroughly (build, lint, accessibility)
5. Submit a pull request

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for detailed guidelines.

### Template Ideas Wanted

- **Blog Templates**: Multi-author blogs, technical blogs, portfolio blogs
- **E-commerce**: Product catalogs, shopping carts, checkout flows
- **Documentation**: API docs, knowledge bases, guides
- **Dashboards**: Admin panels, analytics dashboards, user portals  
- **Portfolios**: Creative portfolios, agency showcases
- **Community**: Forums, membership sites, event pages

## 🔧 Integration Examples

### GitHub API Integration

```javascript
// Fetch template registry
const registry = await fetch('https://raw.githubusercontent.com/blakeox/astro-template-LLM/main/templates/index.json')
  .then(res => res.json());

// Get specific template
const template = registry.templates.find(t => t.id === 'clean-landing');

// Fetch template manifest
const manifest = await fetch(template.manifest).then(res => res.json());

// Download template files (using GitHub API)
const downloadUrl = `https://api.github.com/repos/blakeox/astro-template-LLM/contents/templates/${template.id}`;
```

### CLI Integration

```bash
# Clone specific template
git clone --depth 1 https://github.com/blakeox/astro-template-LLM.git
cd astro-template-LLM/templates/clean-landing

# Or use sparse checkout for single template
git clone --filter=blob:none --sparse https://github.com/blakeox/astro-template-LLM.git
cd astro-template-LLM
git sparse-checkout set templates/clean-landing
```

## 📊 Registry Statistics

- **Total Templates**: 1
- **Frameworks**: Astro (1)
- **Styling**: Tailwind CSS (1)
- **Deployment Targets**: Cloudflare Pages (1), Static (1)

*Statistics auto-update when new templates are added*

## 🔒 Security & Quality

### Automated Checks
- ✅ All templates build successfully  
- ✅ Lighthouse performance audits
- ✅ Accessibility testing
- ✅ Security header validation
- ✅ Dependency vulnerability scanning

### Manual Review Process
- 👥 Code quality review
- 🎨 Design consistency check  
- 📖 Documentation completeness
- 🚀 Performance optimization review

## 📄 License

Templates in this registry are available under their individual licenses (typically MIT). See each template's `manifest.json` for specific license information.

This registry infrastructure is licensed under the [MIT License](./LICENSE).

## 🆘 Support

- **Questions**: [Open a GitHub Discussion](https://github.com/blakeox/astro-template-LLM/discussions)
- **Bug Reports**: [Create an Issue](https://github.com/blakeox/astro-template-LLM/issues)
- **Feature Requests**: [Start a Discussion](https://github.com/blakeox/astro-template-LLM/discussions)
- **Template Submissions**: Follow the [Contributing Guide](./CONTRIBUTING.md)

---

**Registry API Version**: 1.0 | **Last Updated**: Auto-updated via CI | **Maintained by**: [Blake](https://github.com/blakeox)