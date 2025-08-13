# Contributing to Astro Template Registry

Thank you for your interest in contributing to the Astro Template Registry! This guide will help you add new templates, improve existing ones, and maintain the quality standards of the registry.

## 🚀 Getting Started

1. Fork the repository
2. Clone your fork locally
3. Install dependencies: `pnpm install`
4. Create a feature branch: `git checkout -b add-template-name`

## 📋 Template Contribution Checklist

Before submitting a new template, ensure it meets all requirements:

### Required Files
- [ ] `manifest.json` - Complete template metadata
- [ ] `tokens.json` - Design system tokens
- [ ] `preview.png` - Template preview (1200x630px)
- [ ] `README.md` - Human-readable documentation
- [ ] `package.json` - Dependencies and scripts
- [ ] `src/` directory with Astro source files
- [ ] `public/` directory with static assets
- [ ] Configuration files (astro.config.mjs, tailwind.config.ts, etc.)

### Quality Standards
- [ ] Builds successfully: `pnpm build`
- [ ] Passes linting: `pnpm lint`
- [ ] Lighthouse score ≥ 90 (all categories)
- [ ] Responsive design (mobile-first)
- [ ] Accessibility compliance (WCAG 2.1 AA)
- [ ] TypeScript support
- [ ] Proper error handling
- [ ] Security best practices

## 🏗 Adding a New Template

### 1. Create Template Directory

Create a new directory under `/templates/` with a unique identifier:

```bash
mkdir templates/your-template-id
cd templates/your-template-id
```

### 2. Template Structure

Your template must follow this structure:

```
templates/your-template-id/
├── manifest.json           # Required: Template metadata
├── tokens.json            # Required: Design tokens
├── preview.png           # Required: Preview image (1200x630px)
├── README.md             # Required: Documentation
├── package.json          # Required: Dependencies
├── astro.config.mjs      # Required: Astro configuration
├── tailwind.config.ts    # Recommended: Tailwind config
├── tsconfig.json         # Required: TypeScript config
├── src/                  # Required: Source files
│   ├── pages/           # Astro pages
│   ├── components/      # Reusable components
│   ├── layouts/         # Page layouts
│   └── styles/          # CSS/styling
├── public/              # Static assets
└── [other configs]      # Additional configuration files
```

### 3. Create Manifest

Copy and customize the manifest template:

```json
{
  "id": "your-template-id",
  "name": "Your Template Name",
  "description": "Detailed description of what this template provides",
  "version": "1.0.0",
  "license": "MIT",
  "author": "Your Name",
  "tags": ["astro", "tailwind", "relevant", "tags"],
  "capabilities": ["responsive-design", "seo-optimized"],
  "compatibility": {
    "node": ">=18.0.0",
    "astro": "^4.15.0"
  },
  "framework": "astro",
  "styling": "tailwindcss",
  "deployment": ["static", "cloudflare-pages"],
  "preview": "preview.png",
  "tokens": "tokens.json",
  "entry_point": "src/pages/index.astro",
  "build_command": "pnpm build",
  "dev_command": "pnpm dev",
  "install_command": "pnpm install",
  "pages": ["home", "about"],
  "components": ["Nav", "Footer", "Hero"],
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### 4. Design Tokens

Create a comprehensive `tokens.json` file:

```json
{
  "colors": {
    "primary": {
      "value": "#3b82f6",
      "description": "Primary brand color",
      "usage": ["buttons", "links", "accents"]
    }
  },
  "typography": {
    "font-family": {
      "sans": {
        "value": "Inter, ui-sans-serif, system-ui",
        "description": "Primary font family"
      }
    }
  },
  "spacing": {
    "4": { "value": "1rem", "description": "16px" }
  }
}
```

### 5. Preview Image

Create a high-quality preview image:

- **Dimensions**: 1200x630px (social media optimized)
- **Format**: PNG or JPG
- **Content**: Show the actual template design
- **Quality**: High resolution, clear text
- **File size**: < 500KB recommended

### 6. Documentation

Write comprehensive README.md:

```markdown
# Template Name

Brief description of the template purpose and use cases.

## Features
- List key features
- Highlight unique selling points

## Quick Start
1. Installation steps
2. Development commands
3. Build instructions

## Customization
- How to customize colors/typography
- Component customization guide
- Content management

## Deployment
- Deployment options
- Configuration requirements
```

### 7. Update Registry Index

Add your template to `templates/index.json`:

```json
{
  "templates": [
    {
      "id": "your-template-id",
      "name": "Your Template Name",
      "description": "Brief description",
      "version": "1.0.0",
      "tags": ["astro", "tailwind"],
      "preview": "/templates/your-template-id/preview.png",
      "manifest": "/templates/your-template-id/manifest.json",
      "author": "Your Name",
      "license": "MIT"
    }
  ]
}
```

## 🧪 Testing Your Template

### Local Testing

1. Navigate to your template directory:
   ```bash
   cd templates/your-template-id
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Test development server:
   ```bash
   pnpm dev
   ```

4. Test production build:
   ```bash
   pnpm build
   ```

5. Run linting:
   ```bash
   pnpm lint
   ```

### Automated Testing

The repository includes automated tests that will verify:

- Template builds successfully
- All required files are present
- Manifest is valid JSON
- Lighthouse performance scores
- Accessibility compliance

## 📝 Style Guidelines

### Code Style
- Use TypeScript where possible
- Follow existing code formatting
- Use meaningful component and variable names
- Include proper JSDoc comments for complex functions

### Component Design
- Create reusable, well-documented components
- Use props with TypeScript interfaces
- Include default values for optional props
- Follow accessibility best practices

### Naming Conventions
- Template IDs: lowercase with hyphens (`clean-landing`, `blog-minimal`)
- Components: PascalCase (`Button.astro`, `Navigation.astro`)
- Files: kebab-case for multi-word files
- CSS classes: follow Tailwind conventions

### CSS/Styling
- Prefer Tailwind utility classes
- Use CSS custom properties for theme values
- Maintain consistent spacing scale
- Ensure responsive design patterns

## 🎨 Design Guidelines

### Visual Design
- Clean, modern aesthetic
- Consistent spacing and typography
- Accessible color contrasts (4.5:1 minimum)
- Professional appearance suitable for business use

### Layout Principles
- Mobile-first responsive design
- Logical content hierarchy
- Balanced white space usage
- Grid-based layouts where appropriate

### Typography
- Maximum 2-3 font families
- Consistent type scale
- Proper heading hierarchy (h1-h6)
- Readable line heights and spacing

## 🔍 Review Process

### Pre-submission Checklist
- [ ] Template builds without errors
- [ ] All required files included
- [ ] Manifest validates against spec
- [ ] Preview image meets requirements
- [ ] Documentation is complete
- [ ] Lighthouse scores ≥ 90
- [ ] Accessibility testing passed
- [ ] Mobile responsive verified

### Submission Process
1. Push your changes to a feature branch
2. Create a pull request with detailed description
3. Include preview screenshots
4. Wait for automated checks to pass
5. Address any review feedback
6. Maintainer will merge when approved

### Review Criteria
- Code quality and organization
- Design consistency and appeal
- Documentation completeness
- Performance and accessibility
- Uniqueness vs existing templates
- Maintenance considerations

## 🛠 Development Tools

### Required Tools
- Node.js ≥ 18.0.0
- pnpm ≥ 8.0.0
- Modern browser for testing

### Recommended Tools
- VS Code with Astro extension
- Lighthouse DevTools
- axe DevTools for accessibility
- Browser developer tools

### Helpful Scripts
```bash
# Create new template scaffold
pnpm run template:create your-template-id

# Validate template
pnpm run template:validate your-template-id

# Generate preview image
pnpm run template:preview your-template-id

# Update registry index
pnpm run registry:update
```

## 🚨 Common Issues

### Build Errors
- Check Node.js version compatibility
- Verify all dependencies are installed
- Ensure import paths are correct
- Check for TypeScript errors

### Performance Issues
- Optimize images (use WebP format)
- Minimize JavaScript bundle size
- Implement proper lazy loading
- Check for unused CSS

### Accessibility Issues
- Add alt text to all images
- Ensure keyboard navigation works
- Verify color contrast ratios
- Test with screen readers

## 📞 Getting Help

- **Questions**: Open a GitHub Discussion
- **Bugs**: Create a GitHub Issue
- **Feature Requests**: Start with a Discussion
- **Security Issues**: Email maintainers privately

## 📄 License

By contributing to this repository, you agree that your contributions will be licensed under the same license as the project (MIT License).

---

Thank you for helping make the Astro Template Registry a valuable resource for the community!