# Testing LLM Integration

This guide covers testing the LLM integration components.

## Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test -- --watch

# Run specific test file
npm run test src/tests/llm-integration.test.ts

# Run with coverage
npm run test -- --coverage
```

## Test Categories

### Unit Tests
- Schema validation
- Content sanitization
- Security constraint checking
- JSON parsing and extraction

### Integration Tests  
- Full prompt→LLM→validation pipeline
- API endpoint behavior
- Error handling scenarios
- Content quality validation

### Manual Testing

#### Command Line Generation
```bash
# Test basic generation
npm run gen -- --prompt "Create a portfolio site for Test Studio" --format json --dry

# Test with sample prompt
npm run gen -- --prompt "$(cat scripts/sample-mcp-prompt.txt)" --format json --dry

# Test prompt templates
COMPANY_NAME="My Company" npm run gen -- --prompt "$(envsubst < prompts/templates/basic-business.txt)" --format json --dry
```

#### API Endpoints (requires dev server)
```bash
# Start dev server
npm run dev

# Test monitor endpoint
curl "http://localhost:4321/api/monitor?format=health"

# Test preview endpoint documentation
curl "http://localhost:4321/api/preview"

# Test webhook documentation
curl "http://localhost:4321/api/webhook/llm"
```

#### Validation Testing
```bash
# Validate generated config
npm run gen -- --prompt "test prompt" --format json --out /tmp/test-config.json
npx tsx scripts/validate-site-config.ts /tmp/test-config.json

# Test with invalid config
echo '{"invalid": true}' > /tmp/invalid.json
npx tsx scripts/validate-site-config.ts /tmp/invalid.json
```

## Test Data

### Valid Test Prompts
- "Create a portfolio site for Creative Studio"
- "Build a consulting website for Business Advisors"
- "Generate a tech startup site for InnovateApp"

### Invalid Test Cases
- Empty prompts
- Overly long prompts (>2000 chars)
- Prompts with security risks
- Malformed JSON responses

### Expected Outputs
All valid prompts should generate:
- Valid JSON that passes schema validation
- Professional, business-appropriate content
- Character limits respected
- Security constraints satisfied

## Debugging

### Common Issues
1. **Generation fails**: Check prompt length and format
2. **Validation fails**: Verify schema compliance
3. **Build fails**: Check for crypto import issues
4. **Tests fail**: Verify mock data matches expected patterns

### Debug Commands
```bash
# Check schema validation
npx tsx -e "import {SiteConfigSchema} from './src/lib/schemas.ts'; console.log(SiteConfigSchema.parse({...}))"

# Test content validation
npx tsx -e "import {validateContentLimits} from './src/lib/schemas.ts'; console.log(validateContentLimits({...}))"

# Test security validation  
npx tsx -e "import {validateSecurityConstraints} from './src/lib/schemas.ts'; console.log(validateSecurityConstraints({...}))"
```

## Performance Testing

### Load Testing
For production deployments, test with:
- High prompt volumes
- Concurrent API requests
- Large configuration outputs
- Memory usage over time

### Metrics to Monitor
- Response time per generation
- Token usage patterns
- Validation failure rates
- Memory consumption
- Error frequency

## Test Maintenance

When adding new features:
1. Add corresponding unit tests
2. Update integration test scenarios
3. Add manual testing procedures
4. Update this documentation
5. Verify all tests pass before committing