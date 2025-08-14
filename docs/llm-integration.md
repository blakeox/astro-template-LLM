# LLM Integration Documentation

This document provides guidance for integrating Large Language Models (LLMs) with the astro-template-LLM repository, enabling AI-driven website generation with proper validation and error handling.

## Overview

The LLM integration allows for automated generation of site configurations through natural language prompts. The system includes:

- **Schema-based validation** to ensure generated content meets requirements
- **Security sanitization** to prevent injection of malicious content  
- **Error handling and monitoring** for robust production use
- **Mock LLM client** for development and testing

## Architecture

```
User Prompt → LLM Client → JSON Response → Schema Validation → Site Config
                ↓
        Security Sanitization ← Content Validation ← Parse & Extract
```

## Quick Start

### Basic Usage

```typescript
import { createLLMRequest, parseAndValidateLLMResponse, mockLLMGenerate } from '../lib/llm-client.js';
import { SiteConfigSchema } from '../lib/schemas.js';

// Create a request
const request = createLLMRequest(
  'Create a portfolio site for "Design Studio Pro"'
);

// Generate response (mock for development)
const llmResponse = await mockLLMGenerate(request);

// Parse and validate
const result = parseAndValidateLLMResponse(llmResponse, SiteConfigSchema);

if (result.success) {
  console.log('Generated site config:', result.data);
} else {
  console.error('Validation failed:', result.validationError);
}
```

### Command Line Usage

```bash
# Generate using mock LLM
npm run gen -- --prompt "Create a consulting website" --format json

# Validate generated config
npm run tsx scripts/validate-site-config.ts site.config.json

# Build with generated config
npm run build
```

## Security Features

### Content Sanitization

The LLM client automatically sanitizes content to remove:

- Script tags and executable code
- Event handlers (onclick, onload, etc.)
- JavaScript protocols (`javascript:`)
- Dangerous data URLs
- Potential API keys or secrets

### Validation Constraints

- **Character limits** enforced on all text fields
- **Security pattern detection** for sensitive data
- **Schema compliance** validation before acceptance
- **Content quality checks** for professional standards

### Safe Defaults

- Placeholder email formats: `contact@company.com`
- Standard phone format: `(555) 123-4567`
- Internal links: `/contact`, `/services`, `/about`
- External links: `https://example.com`

## Error Handling

### Parse Errors

When JSON parsing fails:

```typescript
if (result.parseError) {
  console.error('Failed to parse LLM response:', result.parseError);
  // Log raw content for debugging
  console.log('Raw content:', result.rawContent);
}
```

### Validation Errors

When schema validation fails:

```typescript
if (result.validationError) {
  console.error('Schema validation failed:', result.validationError);
  // Specific field errors are included in the message
}
```

### Content Warnings

For content quality issues:

```typescript
if (result.warnings?.length > 0) {
  console.warn('Content warnings:', result.warnings);
  // Continue with generation but log for monitoring
}
```

## Monitoring and Logging

### Key Metrics to Track

1. **Generation Success Rate**: Percentage of successful prompt→config generations
2. **Validation Failure Rate**: Schema validation errors per attempt
3. **Parse Error Rate**: JSON parsing failures
4. **Content Quality Score**: Based on character limits and professional standards
5. **Security Issue Detection**: Attempted injection of sensitive content

### Logging Structure

```typescript
interface LLMGenerationLog {
  timestamp: string;
  prompt: string;
  promptLength: number;
  success: boolean;
  parseError?: string;
  validationError?: string;
  warnings: string[];
  tokenUsage?: {
    prompt: number;
    completion: number;
    total: number;
  };
  generationTimeMs: number;
}
```

## Testing

### Unit Tests

```typescript
// Test JSON extraction
const response = { content: '```json\n{"name": "Test"}\n```' };
const extracted = extractJSONFromContent(response.content);
expect(extracted).toBe('{"name": "Test"}');

// Test validation
const validConfig = { name: "Test", description: "Test desc", pages: {...} };
const result = parseAndValidateLLMResponse({content: JSON.stringify(validConfig)});
expect(result.success).toBe(true);
```

### Integration Tests

```typescript
// Test full prompt→generation→validation flow
const request = createLLMRequest('Create a portfolio site for "Test Studio"');
const response = await mockLLMGenerate(request);
const result = parseAndValidateLLMResponse(response);

expect(result.success).toBe(true);
expect(result.data?.name).toBe("Test Studio");
```

## Best Practices

### Prompt Engineering

1. **Be specific** about site type and requirements
2. **Include constraints** like "3 features" or "include contact page"  
3. **Specify content tone** (professional, creative, technical)
4. **Mention validation** requirements in complex prompts

### Error Recovery

1. **Retry with simplified prompts** if generation fails
2. **Log failures** for analysis and improvement
3. **Provide fallback content** for critical failures
4. **User feedback** on validation errors

### Performance Optimization

1. **Cache successful configs** to avoid regeneration
2. **Implement request throttling** to manage API costs
3. **Use streaming responses** for long generations
4. **Monitor token usage** and optimize prompts

## Production Integration

### Environment Setup

```bash
# Required environment variables
LLM_API_KEY=your_api_key_here
LLM_MODEL=gpt-4
LLM_TIMEOUT=30000
```

### API Integration Points

1. **Preview Endpoint**: `/api/preview` - Generate and preview configs
2. **Webhook Handler**: `/api/webhook/llm` - Handle async LLM responses  
3. **Validation Service**: `/api/validate` - Standalone validation endpoint
4. **Monitor Dashboard**: `/api/monitor` - LLM metrics and health

### Production Checklist

- [ ] LLM API credentials properly configured
- [ ] Rate limiting implemented
- [ ] Error monitoring and alerting set up
- [ ] Content sanitization enabled
- [ ] Schema validation enforced
- [ ] Backup/fallback content ready
- [ ] Performance monitoring active

## Troubleshooting

### Common Issues

1. **Generation Timeout**: Reduce prompt complexity or increase timeout
2. **Schema Validation Fails**: Check character limits and required fields
3. **Parse Error**: LLM returned non-JSON content
4. **Security Rejection**: Sensitive data detected in response

### Debug Commands

```bash
# Test with verbose output
npm run gen -- --prompt "test prompt" --verbose

# Validate existing config
npm run tsx scripts/validate-site-config.ts site.config.json

# Check schema compliance
node -e "console.log(JSON.stringify(require('./site.config.schema.json'), null, 2))"
```

## Contributing

When adding new LLM features:

1. Update schemas in `src/lib/schemas.ts`
2. Add corresponding validation logic  
3. Update security sanitization rules
4. Add unit tests for new functionality
5. Update this documentation
6. Test with various prompt types

For questions or issues, refer to the main [MCP Integration Documentation](./mcp-integration.md).