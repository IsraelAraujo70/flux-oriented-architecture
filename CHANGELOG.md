# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Environment variables system with `.env` file support and `${VAR}` interpolation
- PostgreSQL database plugin with connection pooling
- Recursive object interpolation in flux definitions
- Migration runner for database schema management (`npm run migrate`)
- Complete products-api example with CRUD operations (GET, POST, GET by ID)
- Automated release workflow with GitHub Actions
- Automatic NPM publishing on merge to main
- Semantic versioning based on commit messages
- Comprehensive documentation:
  - `docs/environment-variables.md` - Complete env vars guide
  - `docs/plugins.md` - Plugin system documentation
  - `docs/release-process.md` - Release automation guide
- 34 new tests for environment system (75 total tests)
- Coverage improved to 76.72% (from 57.6%)

### Changed
- Enhanced interpolator to support nested objects and arrays
- Improved plugin injection into action context
- Updated flux-syntax.md with plugin usage examples
- CI/CD workflow now supports protected branches with PAT

### Fixed
- Return nodes now properly interpolate nested object values
- Removed unused `@ts-expect-error` directive in tests
- Object interpolation in flux return bodies

### Infrastructure
- Automated version bumping based on conventional commits
- GitHub Release creation on every merge to main
- NPM package auto-publishing
- Protected branch support with Personal Access Token

## [1.0.0] - 2024-12-02

### Added
- Initial release of Flux-Oriented Architecture framework
- Core orchestration engine with declarative flow definitions
- CLI tools (`foa dev`, `foa start`, `foa validate`, `foa list`)
- Action and flux definition system
- TypeScript support with hot-reload
- Express-based HTTP server
- Flow node types: action, condition, forEach, parallel, try/catch, return
- String interpolation with `${variable}` syntax
- Comprehensive test suite with Jest
- CI/CD with GitHub Actions
- Documentation and getting started guide
- Project scaffolding tool (`create-foa-app`)

[Unreleased]: https://github.com/IsraelAraujo70/flux-oriented-architecture/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/IsraelAraujo70/flux-oriented-architecture/releases/tag/v1.0.0