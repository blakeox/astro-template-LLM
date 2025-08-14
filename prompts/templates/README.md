# Prompt Template Library

This directory contains reusable prompt templates for different types of site generation. Use these templates as starting points and customize them for specific requirements.

## Available Templates

### Basic Templates
- `basic-business.txt` - Generic business website
- `portfolio-creative.txt` - Creative portfolio site
- `consulting-professional.txt` - Professional consulting firm

### Industry-Specific Templates  
- `restaurant-hospitality.txt` - Restaurant and hospitality
- `healthcare-medical.txt` - Healthcare and medical practices
- `tech-startup.txt` - Technology startups
- `nonprofit-organization.txt` - Nonprofit organizations

### Advanced Templates
- `ecommerce-store.txt` - E-commerce store front
- `saas-product.txt` - SaaS product landing page
- `agency-marketing.txt` - Marketing agency site

## Usage

```bash
# Use a template directly
npm run gen -- --prompt "$(cat prompts/templates/basic-business.txt)" --format json

# Customize template with variables
COMPANY_NAME="Acme Corp" envsubst < prompts/templates/basic-business.txt | npm run gen -- --prompt "$(cat)" --format json

# Combine templates
cat prompts/templates/consulting-professional.txt prompts/templates/contact-form.txt | npm run gen -- --prompt "$(cat)" --format json
```

## Template Guidelines

1. **Keep prompts focused** - Each template should have a clear purpose
2. **Include constraints** - Specify page requirements, content limits
3. **Provide context** - Include industry context and tone guidance  
4. **Be specific** - Mention required sections, features, content types
5. **Include validation reminders** - Reference schema compliance

## Variables

Templates support environment variable substitution:

- `$COMPANY_NAME` - Company or site name
- `$INDUSTRY` - Industry or business type  
- `$FEATURES_COUNT` - Number of features to generate
- `$INCLUDE_CONTACT` - Whether to include contact page
- `$TONE` - Content tone (professional, creative, technical)

## Contributing

When adding new templates:

1. Test with the mock LLM client first
2. Validate generated output against schema
3. Ensure character limits are respected
4. Include diverse, realistic content
5. Add template to this README