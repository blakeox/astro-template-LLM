export function securityHeaders(nonce?: string) {
	const csp = [
		"default-src 'self'",
		`script-src 'self' 'nonce-${nonce || "dev"}' https://challenges.cloudflare.com`,
		"style-src 'self' 'unsafe-inline'",
		"img-src 'self' data: blob:",
		"connect-src 'self'",
		"frame-src https://challenges.cloudflare.com",
		"object-src 'none'",
		"base-uri 'self'",
		"form-action 'self'",
	].join("; ");

	return {
		"Content-Security-Policy": csp,
		"Referrer-Policy": "strict-origin-when-cross-origin",
		"X-Content-Type-Options": "nosniff",
		"X-Frame-Options": "DENY",
		"Permissions-Policy": "geolocation=(), camera=(), microphone=()",
		"Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
	};
}
