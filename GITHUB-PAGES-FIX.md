# GitHub Pages Deployment Fix

## Issues Identified and Fixed

### 1. **Incorrect File Path in index.html**
- **Problem**: `index.html` referenced `/src/main.jsx` but the file was located at `/main.jsx`
- **Fix**: Updated the script tag to point to `/main.jsx`

### 2. **Incorrect Import Paths in App.jsx**
- **Problem**: App.jsx imported components from `./components/` directory, but components were in the root directory
- **Fix**: Updated imports to use correct relative paths:
  - `./components/LiveGameTracker` → `./LiveGameTracker`
  - `./components/BoxScore` → `./BoxScore`
  - `./components/Standings` → `./Standings`

### 3. **Conflicting GitHub Actions Workflows**
- **Problem**: Two workflows (`jekyll-gh-pages.yml` and `static.yml`) were both trying to deploy to GitHub Pages, causing conflicts
- **Fix**: Disabled `jekyll-gh-pages.yml` by renaming it to `.disabled`

### 4. **Missing Build Step**
- **Problem**: The static.yml workflow was deploying raw files without building the Vite application
- **Fix**: Added Node.js setup and build steps to the workflow:
  - Setup Node.js v20
  - Install dependencies with `npm ci`
  - Build with `npm run build`
  - Deploy the `dist/` directory (Vite build output)

### 5. **Jekyll Processing of Underscore Files**
- **Problem**: GitHub Pages uses Jekyll by default, which can ignore files starting with underscores
- **Fix**: Added `.nojekyll` file to prevent Jekyll processing

## Deployment Workflow

The updated `.github/workflows/static.yml` now:
1. Checks out the code
2. Sets up Node.js 20
3. Installs dependencies
4. Builds the Vite app
5. Uploads the `dist/` directory
6. Deploys to GitHub Pages

## Testing

The build was tested locally and succeeded:
```bash
npm install
npm run build
```

Build output: `dist/` directory containing the bundled application with:
- `index.html` (with proper asset references)
- `assets/` directory with bundled JS and CSS
- Other static assets

## Expected Result

When pushed to the `main` branch, the workflow will:
- Automatically build the Vite application
- Deploy the built files to GitHub Pages
- The site should load correctly at the GitHub Pages URL

## Notes

- The `dist/` directory is in `.gitignore` and should not be committed
- Build artifacts are generated during the GitHub Actions workflow
- The workflow only runs on pushes to the `main` branch or can be triggered manually
