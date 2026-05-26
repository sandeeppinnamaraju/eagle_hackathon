# API Versioning And Migration Tracking

## Current strategy
- Stable route: /api
- Versioned route: /api/v1
- New behavior must be introduced in /api/v1 first.

## Migration process
1. Add new endpoint contract in /api/v1.
2. Keep /api route backward compatible.
3. Add tests for both old and new behavior.
4. Announce deprecation for /api contract changes.
5. Remove deprecated behavior only after agreed deprecation window.

## Tracking
- Track API contract changes in pull requests and release notes.
- Update API-SCHEMA-RELATION.md when endpoints or query parameters change.
- Keep migration checklist in each release branch.
