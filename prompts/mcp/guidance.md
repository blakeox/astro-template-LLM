# MCP Generation Guidance

## Content Guidelines

### Text Limits
- **Hero titles**: Maximum 60 characters, aim for under 8 words
- **Hero subtitles**: Maximum 300 characters
- **Feature titles**: Maximum 50 characters  
- **Feature descriptions**: Maximum 120 characters
- **Site name**: Maximum 100 characters
- **Site description**: Maximum 200 characters
- **About blurb**: Maximum 500 characters (1-2 sentences recommended)

### Required Elements
- All images must include `alt` text
- All CTAs must include both `text` and `href`
- Home page must include `hero` and `features` sections
- Features array must have 1-6 items

### Professional Standards
- Use business-appropriate language
- Avoid superlatives unless necessary
- Focus on value propositions
- Include clear calls-to-action
- Ensure content is scannable and concise

## Security Requirements

### Prohibited Content
- **No API keys or secrets** in any generated content
- **No real email addresses** - use placeholders like "Enter your email"
- **No real phone numbers** - use format examples only
- **No real addresses** - use generic business addresses if needed

### Safe Defaults
- Use `/contact`, `/services`, `/about` for internal links
- Use `https://example.com` for external link examples
- Use placeholder email formats: `contact@company.com`
- Use standard phone format: `(555) 123-4567`

## Component Usage

### Available Components
Based on `/components/manifest.json`:
- **Button**: Use for CTAs with proper `variant` and `size`
- **Nav**: Auto-generated, no configuration needed
- **Footer**: Auto-generated with site information
- **Hero**: Section component for hero areas
- **Features**: Grid layout for feature showcases
- **CTA**: Call-to-action sections

### Icon Guidelines
- Use single emojis only (🎯, 👥, 🛠️, etc.)
- Maximum 10 characters for icon field
- Choose relevant icons that match the feature content
- Common business icons: 📊 📈 🎯 ⚡ 🛡️ 💻 🎨 📱 🤝

## Validation Rules

### JSON Structure
```json
{
  "name": "Required string 1-100 chars",
  "description": "Required string 1-200 chars", 
  "pages": {
    "home": {
      "hero": {
        "title": "Required string 1-60 chars",
        "subtitle": "Required string 1-300 chars",
        "cta": {
          "primary": { "text": "1-50 chars", "href": "path" },
          "secondary": { "text": "1-50 chars", "href": "path" }
        }
      },
      "features": [
        {
          "icon": "optional emoji",
          "title": "Required 1-50 chars",
          "description": "Required 1-120 chars"
        }
      ]
    }
  }
}
```

### Common Validation Errors
- Hero title too long (>60 chars)
- Feature description too long (>120 chars)
- Missing required fields (`name`, `description`, `pages.home`)
- Invalid URL formats
- Empty strings in required fields

## Best Practices

### Content Strategy
1. **Lead with value** - hero title should communicate main benefit
2. **Be specific** - avoid vague terms like "innovative solutions"
3. **Include social proof** - where appropriate and realistic
4. **Clear hierarchy** - most important info in hero, supporting details in features

### Technical Considerations
1. **Mobile-first** - content should work on small screens
2. **Accessibility** - always provide alt text and clear navigation
3. **Performance** - keep content concise to improve loading
4. **SEO-friendly** - use descriptive, keyword-rich content where natural