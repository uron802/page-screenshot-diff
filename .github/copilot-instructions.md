# page-screenshot-diff

Web page screenshot capture and image difference comparison tool built with TypeScript, Node.js, and Puppeteer. Generates screenshots of web pages and compares images to detect visual differences.

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively

### Bootstrap and Build
- Install dependencies: `PUPPETEER_SKIP_DOWNLOAD=1 npm install` -- takes 4 seconds. Use this flag to avoid Chrome download which fails due to network restrictions.
- Build the project: `npm run build` -- takes 2 seconds. NEVER CANCEL. Compiles TypeScript from `src/` to `dist/`.
- The build is very fast and should always complete in under 5 seconds.

### Testing
- **Full test suite**: `npm test` -- takes 10 seconds. NEVER CANCEL. Set timeout to 30+ seconds.
- **Simple test suite**: `npm run test:simple` -- takes 6 seconds. Runs basic functionality tests.
- **Basic tests**: `npm run test:basic` -- takes 1 second. CommonJS tests without TypeScript.
- **Docker tests**: Available but require Docker environment setup.

### Application Commands
**Prerequisites**: Set `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser` (or your system Chrome path) when running locally, as Puppeteer's Chrome download is disabled.

- **Take screenshots**: `node dist/screenshot.js [--concurrency 3] [--device "iPhone 13"]`
- **Compare images**: `node dist/diff.js [--threshold 0.2]`
- **Run scenarios**: `node dist/scenario.js --scenario env/scenario.yml --params env/params.csv --output output/run1 [--headless false] [--concurrency 2]`
- **Compare scenario results**: `node dist/scenarioDiff.js --old output/run1 --new output/run2 [--threshold 0.2]`

## Docker Environment

### Docker Build and Setup
- **Build container**: `docker compose build` -- takes 2+ minutes. NEVER CANCEL. Set timeout to 180+ seconds.
- **Start container**: `docker compose up -d`
- **Note**: Docker build currently fails due to TypeScript not being available in production dependencies. The Dockerfile installs only production dependencies but needs TypeScript to build.

### Docker Testing Commands
- **Full tests**: `docker compose exec app npm test`
- **Simple tests**: `docker compose exec app npm run test:simple`
- **Specific test**: `docker compose exec app npm test -- build.test.ts`

### Docker Application Commands
- **Screenshots**: `docker compose exec app node dist/screenshot.js`
- **Image diff**: `docker compose exec app node dist/diff.js`
- **Scenarios**: `docker compose exec app node dist/scenario.js --scenario env/scenario.yml --params env/params.csv --output output/run1`

## Validation

### Required Environment Setup
- **Node.js 20**: Required for ESM support and Jest configuration.
- **Chromium/Chrome**: Required for Puppeteer. Set `PUPPETEER_EXECUTABLE_PATH` to system Chrome path.
- **Docker**: Optional but recommended for production-like environment.

### Manual Testing Workflow
1. **Build validation**: Run `npm run build` and verify `dist/` directory is created with .js files.
2. **Test validation**: Run `npm run test:simple` to verify core functionality.
3. **Application test**: Run `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser node dist/screenshot.js` and verify it attempts to capture screenshots (may fail due to network restrictions).
4. **Docker test**: Run `docker compose build` and verify container builds successfully (currently fails - document this limitation).

### CI/CD Integration
- GitHub Actions workflow in `.github/workflows/test.yml` runs tests with system Chromium.
- Always run `npm test` before committing to ensure CI compatibility.

## Project Structure

### Source Code (`src/`)
- `screenshot.ts` - Main screenshot capture functionality using Puppeteer
- `diff.ts` - Image comparison using pixelmatch and PNGJS
- `scenario.ts` - Scenario-based screenshot capture with YAML configuration
- `scenarioDiff.ts` - Compare scenario execution results
- `types/config.ts` - Configuration type definitions and loaders

### Configuration Files
- `package.json` - NPM configuration with ESM type and Jest scripts
- `tsconfig.json` - TypeScript configuration targeting ES2020 with ESNext modules
- `jest.config.js` - Jest configuration for ESM support with custom setup
- `docker-compose.yml` - Docker service definition with volume mounts
- `Dockerfile` - Multi-stage build with Puppeteer dependencies (has build issues)

### Environment Configuration (`env/`)
- `screenshot.yml` - URL list and output configuration for screenshots
- `diff.yml` - Source/target directories and threshold configuration
- Create `scenario.yml` and `params.csv` for scenario testing

### Test Structure (`__tests__/`)
- Comprehensive test suite covering all modules
- Mix of TypeScript (.test.ts) and CommonJS (.test.cjs) tests
- Mocked Puppeteer for CI compatibility
- Docker environment detection and testing

## Known Issues and Limitations

### Network and Chrome Installation
- **Puppeteer Chrome download fails** due to network restrictions. Always use `PUPPETEER_SKIP_DOWNLOAD=1` flag.
- **System Chrome required**: Set `PUPPETEER_EXECUTABLE_PATH` to system Chrome location.
- **Network requests fail** in sandboxed environments - application may error when accessing external URLs.

### Docker Limitations
- **Docker build fails**: TypeScript is in devDependencies but needed for build step in production container.
- **Workaround**: Modify Dockerfile to install devDependencies or move TypeScript to dependencies.

### CI/CD Compatibility
- Tests pass in GitHub Actions with system Chromium.
- Local testing requires environment variable setup for Chrome path.

## Common Commands Reference

### Repository Root Directory Listing
```
.git/
.github/
.gitignore
Dockerfile
README.md
__mocks__/
__tests__/
docker-compose.yml
env/
jest.config.js
package-lock.json
package.json
src/
tsconfig.json
```

### Build Output (`dist/` after `npm run build`)
```
diff.js
scenario.js
scenarioDiff.js
screenshot.js
types/
```

### package.json Key Scripts
```json
{
  "build": "tsc",
  "test": "node --experimental-vm-modules node_modules/jest/bin/jest.js",
  "test:simple": "NODE_ENV=test node --experimental-vm-modules node_modules/jest/bin/jest.js simple.test.ts exports.test.ts functional.test.ts build.test.ts",
  "test:basic": "NODE_ENV=test node --experimental-vm-modules node_modules/jest/bin/jest.js basic.test.cjs docker.test.cjs"
}
```

## Quick Start Checklist
- [ ] Run `PUPPETEER_SKIP_DOWNLOAD=1 npm install`
- [ ] Run `npm run build`
- [ ] Run `npm run test:simple` to verify setup
- [ ] Set `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser` for screenshot functionality
- [ ] Test with `node dist/screenshot.js` (may fail due to network restrictions but should show Chrome launching)