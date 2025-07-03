# Changelog

All notable changes to the OnePipe Cloudflare Worker example will be documented in this file.

## [1.0.0] - 2025-01-14

### Added
- Initial standalone Cloudflare Worker example
- Segment-compatible API endpoints (`/track`, `/identify`, `/page`)
- Queue-based event processing with automatic retries
- Pluggable destination system with lazy loading
- Support for BigQuery destination via `@onepipe/destination-bigquery`
- TypeScript support with full type safety
- Comprehensive README with deployment instructions
- Deploy to Cloudflare Workers button integration
- Health check endpoint at `/health`
- CORS support for cross-origin requests
- Interactive HTML interface for testing events
- Configuration via `onepipe.config.json`
- Environment variable templates

### Features
- **Zero setup deployment** - One-click deploy via Cloudflare button
- **Extensible destinations** - Add destinations via npm packages
- **Global edge network** - Fast event collection worldwide
- **Reliable processing** - Queue-based with automatic retries
- **Developer friendly** - Full TypeScript support and local development

### Breaking Changes
- None (initial release)

---

## Template Usage

This template is designed to be:
1. **Self-contained** - No monorepo dependencies
2. **Deploy-ready** - Works with Cloudflare deploy button
3. **Extensible** - Add destinations via npm packages
4. **Production-ready** - Queue processing, error handling, monitoring

## Contributing

When updating this template:
1. Update the version in `package.json`
2. Document changes in this CHANGELOG
3. Test with `npm run dev` and `npm run deploy`
4. Ensure deploy button still works