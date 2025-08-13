## Pull Request Checklist

Please ensure the following items are completed before requesting a review:

### Build & Quality
- [ ] `pnpm build` completes successfully
- [ ] `pnpm lint` passes without errors
- [ ] All new code follows project conventions

### Configuration & Security
- [ ] `wrangler.toml` reviewed (KV IDs are placeholders, no hardcoded secrets)
- [ ] Environment variables are documented in `.env.example`
- [ ] Security headers are properly configured

### Functionality
- [ ] `/api/contact` endpoint returns 202 status locally (with mock setup)
- [ ] Contact form handles both enabled and disabled Turnstile states
- [ ] All navigation links work correctly

### Performance & SEO
- [ ] Lighthouse scores ≥ 90 on Home and Contact pages
- [ ] Meta tags and OpenGraph data are properly set
- [ ] Images have appropriate alt text

### Documentation
- [ ] README explains KV setup and secrets configuration
- [ ] All new features are documented
- [ ] Environment setup instructions are clear

### Testing
- [ ] Manual testing completed for new features
- [ ] Form submission tested (both success and error cases)
- [ ] Mobile responsiveness verified

---

## Description

Brief description of changes made in this PR.

## Screenshots

If applicable, add screenshots to help explain the changes.