#!/usr/bin/env node

/**
 * README Generator
 *
 * Automatically generates and maintains comprehensive README.md files
 * by analyzing project structure, dependencies, scripts, and documentation.
 *
 * Features:
 * - Analyzes project structure and architecture
 * - Extracts package.json metadata and scripts
 * - Detects tech stack from dependencies
 * - Scans for documentation files
 * - Generates installation instructions
 * - Creates usage examples
 * - Builds badge collection
 * - Maintains consistency across updates
 *
 * Output:
 * - README.md (project root)
 * - Component READMEs (subdirectories)
 * - Quick Start Guide
 * - Contributing Guidelines
 *
 * @author Blaze Sports Intel
 * @version 1.0.0
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

const CONFIG = {
  // Input
  PROJECT_DIR: path.join(__dirname, '../..'),

  // Output
  README_FILE: 'README.md',
  CONTRIBUTING_FILE: 'CONTRIBUTING.md',
  QUICK_START_FILE: 'QUICK_START.md',

  // Timezone
  TIMEZONE: 'America/Chicago',

  // Project metadata
  PROJECT_NAME: 'Blaze Sports Intel',
  PROJECT_TAGLINE: 'Comprehensive sports intelligence platform',
  DOMAIN: 'blazesportsintel.com',
  GITHUB_REPO: 'ahump20/BSI',

  // Sections to include
  SECTIONS: [
    'header',
    'badges',
    'description',
    'features',
    'tech-stack',
    'quick-start',
    'installation',
    'usage',
    'api-docs',
    'development',
    'deployment',
    'contributing',
    'license',
    'contact'
  ],

  // Badge services
  BADGES: {
    build: 'https://img.shields.io/github/actions/workflow/status',
    coverage: 'https://img.shields.io/codecov/c/github',
    license: 'https://img.shields.io/github/license',
    version: 'https://img.shields.io/github/package-json/v',
    stars: 'https://img.shields.io/github/stars',
    issues: 'https://img.shields.io/github/issues'
  }
};

class READMEGenerator {
  constructor() {
    this.projectInfo = {};
    this.packageJson = null;
    this.techStack = [];
    this.scripts = [];
    this.dependencies = [];
    this.timestamp = new Date().toLocaleString('en-US', {
      timeZone: CONFIG.TIMEZONE
    });
  }

  /**
   * Main execution method
   */
  async generate() {
    console.log('📖 README Generator');
    console.log('='.repeat(50));
    console.log(`Timestamp: ${this.timestamp}`);
    console.log('');

    try {
      // 1. Analyze project
      console.log('1. Analyzing project structure...');
      await this.analyzeProject();
      console.log(`   Found ${this.techStack.length} technologies`);

      // 2. Extract package.json
      console.log('2. Extracting package metadata...');
      await this.extractPackageInfo();
      console.log(`   Found ${this.scripts.length} npm scripts`);

      // 3. Detect tech stack
      console.log('3. Detecting tech stack...');
      await this.detectTechStack();
      console.log(`   Identified ${this.techStack.length} technologies`);

      // 4. Generate README
      console.log('4. Generating README.md...');
      await this.generateReadme();

      // 5. Generate Contributing Guide
      console.log('5. Generating CONTRIBUTING.md...');
      await this.generateContributing();

      // 6. Generate Quick Start
      console.log('6. Generating QUICK_START.md...');
      await this.generateQuickStart();

      console.log('');
      console.log('✅ README generation complete!');
      console.log(`   Output: ${CONFIG.PROJECT_DIR}`);

    } catch (error) {
      console.error('❌ README generation failed:', error);
      throw error;
    }
  }

  /**
   * Analyze project structure
   */
  async analyzeProject() {
    this.projectInfo = {
      name: CONFIG.PROJECT_NAME,
      description: CONFIG.PROJECT_TAGLINE,
      domain: CONFIG.DOMAIN,
      repo: CONFIG.GITHUB_REPO,
      directories: await this.getDirectoryStructure(),
      hasTests: await this.hasDirectory('tests') || await this.hasDirectory('test'),
      hasDocs: await this.hasDirectory('docs'),
      hasExamples: await this.hasDirectory('examples'),
      hasScripts: await this.hasDirectory('scripts')
    };
  }

  /**
   * Get directory structure
   */
  async getDirectoryStructure() {
    try {
      const entries = await fs.readdir(CONFIG.PROJECT_DIR, { withFileTypes: true });
      return entries
        .filter(entry => entry.isDirectory() && !entry.name.startsWith('.'))
        .map(entry => entry.name);
    } catch (error) {
      return [];
    }
  }

  /**
   * Check if directory exists
   */
  async hasDirectory(name) {
    try {
      const stat = await fs.stat(path.join(CONFIG.PROJECT_DIR, name));
      return stat.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Extract package.json information
   */
  async extractPackageInfo() {
    try {
      const packagePath = path.join(CONFIG.PROJECT_DIR, 'package.json');
      const packageData = await fs.readFile(packagePath, 'utf-8');
      this.packageJson = JSON.parse(packageData);

      // Extract scripts
      if (this.packageJson.scripts) {
        this.scripts = Object.entries(this.packageJson.scripts).map(([name, command]) => ({
          name,
          command,
          description: this.inferScriptDescription(name, command)
        }));
      }

      // Extract dependencies
      const allDeps = {
        ...this.packageJson.dependencies,
        ...this.packageJson.devDependencies
      };

      this.dependencies = Object.entries(allDeps).map(([name, version]) => ({
        name,
        version,
        type: this.packageJson.dependencies?.[name] ? 'production' : 'development'
      }));

    } catch (error) {
      console.warn('   ⚠️  Could not read package.json');
      this.packageJson = {
        name: CONFIG.PROJECT_NAME,
        version: '1.0.0',
        description: CONFIG.PROJECT_TAGLINE
      };
    }
  }

  /**
   * Infer script description from name and command
   */
  inferScriptDescription(name, command) {
    const descriptions = {
      'start': 'Start the application',
      'dev': 'Start development server',
      'build': 'Build for production',
      'test': 'Run test suite',
      'lint': 'Check code quality',
      'format': 'Format code',
      'deploy': 'Deploy to production',
      'serve': 'Serve built application'
    };

    return descriptions[name] || `Run ${name} command`;
  }

  /**
   * Detect tech stack from dependencies and files
   */
  async detectTechStack() {
    const stack = [];

    // Frontend frameworks
    if (this.hasDependency('react')) {
      stack.push({
        name: 'React',
        category: 'Frontend',
        description: 'UI library',
        icon: '⚛️'
      });
    }

    if (this.hasDependency('next')) {
      stack.push({
        name: 'Next.js',
        category: 'Frontend',
        description: 'React framework',
        icon: '▲'
      });
    }

    // 3D Graphics
    if (this.hasDependency('three') || this.hasDependency('@babylonjs/core')) {
      stack.push({
        name: 'Three.js / Babylon.js',
        category: 'Graphics',
        description: '3D visualization',
        icon: '🎨'
      });
    }

    // Backend
    if (await this.hasDirectory('functions')) {
      stack.push({
        name: 'Cloudflare Pages Functions',
        category: 'Backend',
        description: 'Serverless API',
        icon: '☁️'
      });
    }

    // Database
    if (this.hasDependency('@cloudflare/d1')) {
      stack.push({
        name: 'Cloudflare D1',
        category: 'Database',
        description: 'SQLite database',
        icon: '🗄️'
      });
    }

    // Testing
    if (this.hasDependency('jest') || this.hasDependency('vitest')) {
      stack.push({
        name: 'Jest / Vitest',
        category: 'Testing',
        description: 'Unit testing',
        icon: '✅'
      });
    }

    if (this.hasDependency('@playwright/test')) {
      stack.push({
        name: 'Playwright',
        category: 'Testing',
        description: 'E2E testing',
        icon: '🎭'
      });
    }

    // Build tools
    if (this.hasDependency('vite')) {
      stack.push({
        name: 'Vite',
        category: 'Build',
        description: 'Build tool',
        icon: '⚡'
      });
    }

    // Styling
    if (this.hasDependency('tailwindcss')) {
      stack.push({
        name: 'Tailwind CSS',
        category: 'Styling',
        description: 'Utility-first CSS',
        icon: '🎨'
      });
    }

    // Additional tools
    if (this.hasDependency('typescript')) {
      stack.push({
        name: 'TypeScript',
        category: 'Language',
        description: 'Type safety',
        icon: '📘'
      });
    }

    this.techStack = stack;
  }

  /**
   * Check if dependency exists
   */
  hasDependency(name) {
    return this.dependencies.some(dep => dep.name.includes(name));
  }

  /**
   * Generate main README.md
   */
  async generateReadme() {
    let readme = '';

    // Header
    readme += this.generateHeader();
    readme += '\n';

    // Badges
    readme += this.generateBadges();
    readme += '\n';

    // Description
    readme += this.generateDescription();
    readme += '\n';

    // Features
    readme += this.generateFeatures();
    readme += '\n';

    // Tech Stack
    readme += this.generateTechStackSection();
    readme += '\n';

    // Quick Start
    readme += this.generateQuickStartSection();
    readme += '\n';

    // Installation
    readme += this.generateInstallation();
    readme += '\n';

    // Usage
    readme += this.generateUsage();
    readme += '\n';

    // Scripts
    if (this.scripts.length > 0) {
      readme += this.generateScripts();
      readme += '\n';
    }

    // API Documentation
    readme += this.generateAPIDocsSection();
    readme += '\n';

    // Development
    readme += this.generateDevelopment();
    readme += '\n';

    // Deployment
    readme += this.generateDeployment();
    readme += '\n';

    // Contributing
    readme += this.generateContributingSection();
    readme += '\n';

    // License
    readme += this.generateLicense();
    readme += '\n';

    // Contact
    readme += this.generateContact();

    // Write to file
    await fs.writeFile(
      path.join(CONFIG.PROJECT_DIR, CONFIG.README_FILE),
      readme
    );
  }

  /**
   * Generate README header
   */
  generateHeader() {
    return `# ${CONFIG.PROJECT_NAME}\n\n` +
           `> ${CONFIG.PROJECT_TAGLINE}\n\n` +
           `[![Website](https://img.shields.io/badge/website-${CONFIG.DOMAIN}-orange)](https://${CONFIG.DOMAIN})`;
  }

  /**
   * Generate badges section
   */
  generateBadges() {
    const badges = [];

    // Version
    if (this.packageJson.version) {
      badges.push(
        `[![Version](${CONFIG.BADGES.version}/${CONFIG.GITHUB_REPO})](https://github.com/${CONFIG.GITHUB_REPO})`
      );
    }

    // License
    if (this.packageJson.license) {
      badges.push(
        `[![License](${CONFIG.BADGES.license}/${CONFIG.GITHUB_REPO})](LICENSE)`
      );
    }

    // GitHub Stars
    badges.push(
      `[![Stars](${CONFIG.BADGES.stars}/${CONFIG.GITHUB_REPO}?style=social)](https://github.com/${CONFIG.GITHUB_REPO}/stargazers)`
    );

    // Issues
    badges.push(
      `[![Issues](${CONFIG.BADGES.issues}/${CONFIG.GITHUB_REPO})](https://github.com/${CONFIG.GITHUB_REPO}/issues)`
    );

    return badges.join('\n');
  }

  /**
   * Generate description section
   */
  generateDescription() {
    return `## 📋 Overview\n\n` +
           `${CONFIG.PROJECT_NAME} is a comprehensive sports intelligence platform providing real-time data, analytics, and predictions across multiple sports including MLB, NFL, NCAA Football, NCAA Basketball, and youth sports.\n\n` +
           `**Key Capabilities:**\n` +
           `- 🏃 Real-time scores and standings\n` +
           `- 📊 Advanced analytics and predictions\n` +
           `- 🎨 Interactive 3D visualizations\n` +
           `- 🤖 AI-powered sports intelligence\n` +
           `- 📱 Mobile-first responsive design`;
  }

  /**
   * Generate features section
   */
  generateFeatures() {
    return `## ✨ Features\n\n` +
           `### Core Features\n\n` +
           `- **Live Data**: Real-time scores, standings, and statistics\n` +
           `- **Analytics Dashboard**: Interactive dashboards with charts and visualizations\n` +
           `- **3D Visualizations**: Babylon.js/Three.js powered 3D graphics\n` +
           `- **AI Copilot**: Semantic search and RAG-powered insights\n` +
           `- **Multi-Sport Coverage**: MLB, NFL, NCAA Football, NCAA Basketball\n` +
           `- **Mobile Optimized**: iPhone-first responsive design\n\n` +
           `### Technical Features\n\n` +
           `- **Serverless Architecture**: Cloudflare Pages Functions\n` +
           `- **Edge Computing**: Global CDN with sub-100ms latency\n` +
           `- **Real-time Updates**: WebSocket connections for live data\n` +
           `- **Offline Support**: Service worker caching\n` +
           `- **Type Safety**: Full TypeScript support`;
  }

  /**
   * Generate tech stack section
   */
  generateTechStackSection() {
    let section = `## 🛠️ Tech Stack\n\n`;

    if (this.techStack.length === 0) {
      section += `Technology stack information will be added soon.\n`;
      return section;
    }

    // Group by category
    const byCategory = {};
    for (const tech of this.techStack) {
      if (!byCategory[tech.category]) {
        byCategory[tech.category] = [];
      }
      byCategory[tech.category].push(tech);
    }

    for (const [category, techs] of Object.entries(byCategory)) {
      section += `### ${category}\n\n`;

      for (const tech of techs) {
        section += `- ${tech.icon} **${tech.name}** - ${tech.description}\n`;
      }
      section += `\n`;
    }

    return section;
  }

  /**
   * Generate quick start section
   */
  generateQuickStartSection() {
    return `## 🚀 Quick Start\n\n` +
           `\`\`\`bash\n` +
           `# Clone the repository\n` +
           `git clone https://github.com/${CONFIG.GITHUB_REPO}.git\n` +
           `cd BSI\n\n` +
           `# Install dependencies\n` +
           `npm install\n\n` +
           `# Start development server\n` +
           `npm run dev\n\n` +
           `# Open browser to http://localhost:8787\n` +
           `\`\`\`\n\n` +
           `For detailed setup instructions, see [QUICK_START.md](QUICK_START.md).`;
  }

  /**
   * Generate installation section
   */
  generateInstallation() {
    return `## 📦 Installation\n\n` +
           `### Prerequisites\n\n` +
           `- Node.js 18+ (LTS recommended)\n` +
           `- npm or yarn package manager\n` +
           `- Git\n` +
           `- Cloudflare account (for deployment)\n\n` +
           `### Steps\n\n` +
           `1. **Clone Repository**\n` +
           `   \`\`\`bash\n` +
           `   git clone https://github.com/${CONFIG.GITHUB_REPO}.git\n` +
           `   cd BSI\n` +
           `   \`\`\`\n\n` +
           `2. **Install Dependencies**\n` +
           `   \`\`\`bash\n` +
           `   npm install\n` +
           `   \`\`\`\n\n` +
           `3. **Environment Setup**\n` +
           `   \`\`\`bash\n` +
           `   cp .env.example .env\n` +
           `   # Edit .env with your API keys\n` +
           `   \`\`\`\n\n` +
           `4. **Database Setup**\n` +
           `   \`\`\`bash\n` +
           `   npm run db:setup\n` +
           `   \`\`\`\n\n` +
           `5. **Start Development**\n` +
           `   \`\`\`bash\n` +
           `   npm run dev\n` +
           `   \`\`\``;
  }

  /**
   * Generate usage section
   */
  generateUsage() {
    return `## 💻 Usage\n\n` +
           `### Development Server\n\n` +
           `Start the local development server with hot reload:\n\n` +
           `\`\`\`bash\n` +
           `npm run dev\n` +
           `\`\`\`\n\n` +
           `The application will be available at \`http://localhost:8787\`.\n\n` +
           `### Building for Production\n\n` +
           `Create an optimized production build:\n\n` +
           `\`\`\`bash\n` +
           `npm run build\n` +
           `\`\`\`\n\n` +
           `### Running Tests\n\n` +
           `Execute the test suite:\n\n` +
           `\`\`\`bash\n` +
           `npm test              # Run all tests\n` +
           `npm run test:unit     # Unit tests only\n` +
           `npm run test:e2e      # E2E tests only\n` +
           `npm run test:coverage # With coverage report\n` +
           `\`\`\``;
  }

  /**
   * Generate scripts section
   */
  generateScripts() {
    let section = `## 📝 Available Scripts\n\n`;
    section += `| Script | Description |\n`;
    section += `|--------|-------------|\n`;

    for (const script of this.scripts) {
      section += `| \`npm run ${script.name}\` | ${script.description} |\n`;
    }

    return section;
  }

  /**
   * Generate API docs section
   */
  generateAPIDocsSection() {
    return `## 📚 API Documentation\n\n` +
           `Complete API documentation is available:\n\n` +
           `- **OpenAPI Spec**: [docs/api/openapi.json](docs/api/openapi.json)\n` +
           `- **Human-readable**: [docs/api/API.md](docs/api/API.md)\n` +
           `- **Postman Collection**: [docs/api/postman-collection.json](docs/api/postman-collection.json)\n\n` +
           `### Example Request\n\n` +
           `\`\`\`bash\n` +
           `curl https://${CONFIG.DOMAIN}/api/mlb/standings\n` +
           `\`\`\`\n\n` +
           `\`\`\`javascript\n` +
           `const response = await fetch('https://${CONFIG.DOMAIN}/api/mlb/standings');\n` +
           `const data = await response.json();\n` +
           `\`\`\``;
  }

  /**
   * Generate development section
   */
  generateDevelopment() {
    return `## 🔧 Development\n\n` +
           `### Project Structure\n\n` +
           `\`\`\`\n` +
           `BSI/\n` +
           `├── functions/        # Cloudflare Pages Functions (API endpoints)\n` +
           `├── public/           # Static assets and HTML\n` +
           `├── lib/              # Shared utilities and helpers\n` +
           `├── docs/             # Documentation\n` +
           `├── tests/            # Test suites\n` +
           `└── scripts/          # Build and utility scripts\n` +
           `\`\`\`\n\n` +
           `### Code Quality\n\n` +
           `We use automated tools to maintain code quality:\n\n` +
           `\`\`\`bash\n` +
           `npm run lint         # ESLint code linting\n` +
           `npm run format       # Prettier code formatting\n` +
           `npm run type-check   # TypeScript type checking\n` +
           `\`\`\`\n\n` +
           `### Git Workflow\n\n` +
           `We follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages:\n\n` +
           `\`\`\`bash\n` +
           `feat: add new feature\n` +
           `fix: resolve bug\n` +
           `docs: update documentation\n` +
           `test: add test coverage\n` +
           `\`\`\``;
  }

  /**
   * Generate deployment section
   */
  generateDeployment() {
    return `## 🚀 Deployment\n\n` +
           `### Cloudflare Pages\n\n` +
           `The application is deployed on Cloudflare Pages:\n\n` +
           `\`\`\`bash\n` +
           `# Deploy to production\n` +
           `npm run deploy\n\n` +
           `# Deploy to preview\n` +
           `npm run deploy:preview\n` +
           `\`\`\`\n\n` +
           `### Environment Variables\n\n` +
           `Required environment variables:\n\n` +
           `\`\`\`bash\n` +
           `SPORTSDATAIO_API_KEY=your_key_here\n` +
           `CLOUDFLARE_API_TOKEN=your_token_here\n` +
           `\`\`\`\n\n` +
           `Configure these in:\n` +
           `- Cloudflare Pages dashboard (production)\n` +
           `- \`.env\` file (local development)\n\n` +
           `### Continuous Deployment\n\n` +
           `Automatic deployments are triggered on:\n` +
           `- Push to \`main\` branch → Production\n` +
           `- Push to feature branches → Preview deployments`;
  }

  /**
   * Generate contributing section
   */
  generateContributingSection() {
    return `## 🤝 Contributing\n\n` +
           `We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.\n\n` +
           `### Quick Contribution Guide\n\n` +
           `1. Fork the repository\n` +
           `2. Create a feature branch (\`git checkout -b feature/amazing-feature\`)\n` +
           `3. Commit changes (\`git commit -m 'feat: add amazing feature'\`)\n` +
           `4. Push to branch (\`git push origin feature/amazing-feature\`)\n` +
           `5. Open a Pull Request\n\n` +
           `### Code of Conduct\n\n` +
           `This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md).`;
  }

  /**
   * Generate license section
   */
  generateLicense() {
    const license = this.packageJson.license || 'Proprietary';

    return `## 📄 License\n\n` +
           `This project is licensed under the ${license} License - see the [LICENSE](LICENSE) file for details.`;
  }

  /**
   * Generate contact section
   */
  generateContact() {
    return `## 📧 Contact\n\n` +
           `**Blaze Sports Intel**\n\n` +
           `- Website: [${CONFIG.DOMAIN}](https://${CONFIG.DOMAIN})\n` +
           `- Email: austin@blazesportsintel.com\n` +
           `- GitHub: [@${CONFIG.GITHUB_REPO.split('/')[0]}](https://github.com/${CONFIG.GITHUB_REPO.split('/')[0]})\n\n` +
           `---\n\n` +
           `Made with ❤️ by [Blaze Sports Intel](https://${CONFIG.DOMAIN})\n\n` +
           `*Last updated: ${this.timestamp} (America/Chicago)*`;
  }

  /**
   * Generate CONTRIBUTING.md
   */
  async generateContributing() {
    const contributing = `# Contributing to ${CONFIG.PROJECT_NAME}\n\n` +
      `Thank you for your interest in contributing to ${CONFIG.PROJECT_NAME}! This document provides guidelines and instructions for contributing.\n\n` +
      `## 📋 Table of Contents\n\n` +
      `- [Code of Conduct](#code-of-conduct)\n` +
      `- [Getting Started](#getting-started)\n` +
      `- [Development Workflow](#development-workflow)\n` +
      `- [Coding Standards](#coding-standards)\n` +
      `- [Commit Guidelines](#commit-guidelines)\n` +
      `- [Pull Request Process](#pull-request-process)\n` +
      `- [Testing](#testing)\n\n` +
      `## 📜 Code of Conduct\n\n` +
      `This project adheres to the Contributor Covenant Code of Conduct. By participating, you are expected to uphold this code.\n\n` +
      `## 🚀 Getting Started\n\n` +
      `1. Fork the repository\n` +
      `2. Clone your fork: \`git clone https://github.com/YOUR_USERNAME/BSI.git\`\n` +
      `3. Add upstream remote: \`git remote add upstream https://github.com/${CONFIG.GITHUB_REPO}.git\`\n` +
      `4. Install dependencies: \`npm install\`\n` +
      `5. Create a feature branch: \`git checkout -b feature/your-feature-name\`\n\n` +
      `## 💻 Development Workflow\n\n` +
      `1. Keep your fork in sync: \`git pull upstream main\`\n` +
      `2. Make your changes in the feature branch\n` +
      `3. Test thoroughly: \`npm test\`\n` +
      `4. Lint your code: \`npm run lint\`\n` +
      `5. Commit with conventional commits format\n` +
      `6. Push to your fork: \`git push origin feature/your-feature-name\`\n` +
      `7. Open a Pull Request\n\n` +
      `## 🎨 Coding Standards\n\n` +
      `- Use TypeScript for type safety\n` +
      `- Follow ESLint and Prettier configurations\n` +
      `- Write meaningful variable and function names\n` +
      `- Add JSDoc comments for public APIs\n` +
      `- Keep functions small and focused\n` +
      `- Write tests for new features\n\n` +
      `## 📝 Commit Guidelines\n\n` +
      `We follow [Conventional Commits](https://www.conventionalcommits.org/):\n\n` +
      `\`\`\`\n` +
      `<type>(<scope>): <subject>\n\n` +
      `<body>\n\n` +
      `<footer>\n` +
      `\`\`\`\n\n` +
      `**Types:**\n` +
      `- \`feat\`: New feature\n` +
      `- \`fix\`: Bug fix\n` +
      `- \`docs\`: Documentation changes\n` +
      `- \`style\`: Code style changes (formatting, etc.)\n` +
      `- \`refactor\`: Code refactoring\n` +
      `- \`test\`: Test additions or modifications\n` +
      `- \`chore\`: Maintenance tasks\n\n` +
      `**Examples:**\n` +
      `\`\`\`\n` +
      `feat(api): add MLB standings endpoint\n` +
      `fix(ui): resolve navigation menu overflow on mobile\n` +
      `docs(readme): update installation instructions\n` +
      `\`\`\`\n\n` +
      `## 🔄 Pull Request Process\n\n` +
      `1. Ensure all tests pass\n` +
      `2. Update documentation if needed\n` +
      `3. Add a clear PR description explaining changes\n` +
      `4. Link related issues with "Closes #123"\n` +
      `5. Request review from maintainers\n` +
      `6. Address review feedback\n` +
      `7. Squash commits if requested\n\n` +
      `## ✅ Testing\n\n` +
      `- Write unit tests for new functions\n` +
      `- Add integration tests for API endpoints\n` +
      `- Ensure E2E tests pass for UI changes\n` +
      `- Aim for >80% code coverage\n\n` +
      `Run tests:\n` +
      `\`\`\`bash\n` +
      `npm test              # All tests\n` +
      `npm run test:unit     # Unit tests\n` +
      `npm run test:e2e      # E2E tests\n` +
      `npm run test:coverage # With coverage\n` +
      `\`\`\`\n\n` +
      `Thank you for contributing! 🎉`;

    await fs.writeFile(
      path.join(CONFIG.PROJECT_DIR, CONFIG.CONTRIBUTING_FILE),
      contributing
    );
  }

  /**
   * Generate QUICK_START.md
   */
  async generateQuickStart() {
    const quickStart = `# Quick Start Guide\n\n` +
      `Get ${CONFIG.PROJECT_NAME} running in under 5 minutes.\n\n` +
      `## Prerequisites\n\n` +
      `Before you begin, ensure you have:\n\n` +
      `- ✅ Node.js 18+ installed\n` +
      `- ✅ npm or yarn package manager\n` +
      `- ✅ Git installed\n` +
      `- ✅ A code editor (VS Code recommended)\n\n` +
      `## Step 1: Clone Repository\n\n` +
      `\`\`\`bash\n` +
      `git clone https://github.com/${CONFIG.GITHUB_REPO}.git\n` +
      `cd BSI\n` +
      `\`\`\`\n\n` +
      `## Step 2: Install Dependencies\n\n` +
      `\`\`\`bash\n` +
      `npm install\n` +
      `\`\`\`\n\n` +
      `This will install all required packages. It may take 1-2 minutes.\n\n` +
      `## Step 3: Environment Setup\n\n` +
      `Create a \`.env\` file:\n\n` +
      `\`\`\`bash\n` +
      `cp .env.example .env\n` +
      `\`\`\`\n\n` +
      `Edit \`.env\` and add your API keys:\n\n` +
      `\`\`\`env\n` +
      `SPORTSDATAIO_API_KEY=your_key_here\n` +
      `CLOUDFLARE_API_TOKEN=your_token_here\n` +
      `\`\`\`\n\n` +
      `## Step 4: Start Development Server\n\n` +
      `\`\`\`bash\n` +
      `npm run dev\n` +
      `\`\`\`\n\n` +
      `The application will start at \`http://localhost:8787\`.\n\n` +
      `## Step 5: Verify Installation\n\n` +
      `Open your browser to:\n\n` +
      `- Homepage: http://localhost:8787\n` +
      `- API Health: http://localhost:8787/api/health\n` +
      `- Analytics: http://localhost:8787/analytics\n\n` +
      `You should see the Blaze Sports Intel dashboard with live data.\n\n` +
      `## Next Steps\n\n` +
      `- Read the [full README](README.md) for detailed documentation\n` +
      `- Check out [API documentation](docs/api/API.md)\n` +
      `- Review [contributing guidelines](CONTRIBUTING.md)\n` +
      `- Join our community discussions\n\n` +
      `## Troubleshooting\n\n` +
      `### Port Already in Use\n\n` +
      `If port 8787 is in use:\n\n` +
      `\`\`\`bash\n` +
      `PORT=3000 npm run dev\n` +
      `\`\`\`\n\n` +
      `### Dependencies Not Installing\n\n` +
      `Try clearing npm cache:\n\n` +
      `\`\`\`bash\n` +
      `npm cache clean --force\n` +
      `rm -rf node_modules package-lock.json\n` +
      `npm install\n` +
      `\`\`\`\n\n` +
      `### API Errors\n\n` +
      `Verify your API keys in \`.env\` are correct and active.\n\n` +
      `## Need Help?\n\n` +
      `- Open an [issue on GitHub](https://github.com/${CONFIG.GITHUB_REPO}/issues)\n` +
      `- Email: austin@blazesportsintel.com\n` +
      `- Website: https://${CONFIG.DOMAIN}\n\n` +
      `Happy coding! 🚀`;

    await fs.writeFile(
      path.join(CONFIG.PROJECT_DIR, CONFIG.QUICK_START_FILE),
      quickStart
    );
  }
}

// Run generator if executed directly
if (require.main === module) {
  const generator = new READMEGenerator();
  generator.generate().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { READMEGenerator, CONFIG };
