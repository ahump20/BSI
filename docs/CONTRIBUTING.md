# Contributing to Blaze Sports Intel

Thank you for your interest in contributing to Blaze Sports Intel! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Testing Requirements](#testing-requirements)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Pull Request Process](#pull-request-process)
- [Code Review Process](#code-review-process)
- [Documentation](#documentation)
- [Questions and Support](#questions-and-support)

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors, regardless of experience level, gender identity, sexual orientation, disability, personal appearance, body size, race, ethnicity, age, religion, or nationality.

### Expected Behavior

- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community and the project
- Show empathy towards other community members

### Unacceptable Behavior

- Trolling, insulting/derogatory comments, and personal or political attacks
- Public or private harassment
- Publishing others' private information without explicit permission
- Other conduct which could reasonably be considered inappropriate in a professional setting

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v20.x or higher ([Download](https://nodejs.org/))
- **npm**: v10.x or higher (comes with Node.js)
- **Git**: Latest version ([Download](https://git-scm.com/))
- **Code Editor**: VS Code recommended ([Download](https://code.visualstudio.com/))

### VS Code Extensions (Recommended)

Install these extensions for the best development experience:

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-playwright.playwright",
    "bradlc.vscode-tailwindcss",
    "streetsidesoftware.code-spell-checker"
  ]
}
```

### Installation

1. **Fork the repository** on GitHub
   - Visit [github.com/ahump20/BSI](https://github.com/ahump20/BSI)
   - Click "Fork" in the top-right corner

2. **Clone your fork locally**
   ```bash
   git clone https://github.com/YOUR-USERNAME/BSI.git
   cd BSI
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/ahump20/BSI.git
   ```

4. **Install dependencies**
   ```bash
   npm ci
   ```

5. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys (see README.md for details)
   ```

6. **Install pre-commit hooks**
   ```bash
   npm run prepare
   ```

7. **Verify installation**
   ```bash
   npm run lint
   npm run format
   npm run typecheck
   npm run test
   ```

All commands should complete successfully.

## Development Workflow

### Branching Strategy

We use a feature branch workflow:

```
main (production)
  └── feature/your-feature-name (your work)
```

**Branch naming conventions:**

- `feature/` - New features (e.g., `feature/mlb-standings`)
- `fix/` - Bug fixes (e.g., `fix/nfl-scores-api`)
- `docs/` - Documentation updates (e.g., `docs/api-reference`)
- `refactor/` - Code refactoring (e.g., `refactor/data-adapters`)
- `test/` - Test additions/updates (e.g., `test/accessibility`)
- `chore/` - Maintenance tasks (e.g., `chore/update-deps`)

### Starting New Work

1. **Sync with upstream**
   ```bash
   git checkout main
   git fetch upstream
   git merge upstream/main
   git push origin main
   ```

2. **Create feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Write code
   - Add tests
   - Update documentation

4. **Run quality checks**
   ```bash
   npm run lint:fix
   npm run format:fix
   npm run typecheck
   npm run test
   ```

5. **Commit your changes** (see [Commit Message Guidelines](#commit-message-guidelines))
   ```bash
   git add .
   git commit -m "feat: add MLB standings API endpoint"
   ```

6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create Pull Request** on GitHub

## Code Standards

### TypeScript

- **100% TypeScript typing required** - No `any` types without explicit justification
- Use strict mode (`"strict": true` in tsconfig.json)
- Prefer interfaces over types for object shapes
- Use explicit return types for functions

**Example:**

```typescript
// ✅ Good
interface TeamStanding {
  teamId: number;
  teamName: string;
  wins: number;
  losses: number;
  winPercentage: number;
}

async function fetchStandings(sport: string): Promise<TeamStanding[]> {
  const response = await fetch(`/api/${sport}/standings`);
  return response.json();
}

// ❌ Bad
async function fetchStandings(sport) {
  const response = await fetch(`/api/${sport}/standings`);
  return response.json();
}
```

### React Components

- Use functional components with hooks (no class components)
- One component per file
- Props interfaces defined at top of file
- Use TypeScript for prop types (not PropTypes)

**Example:**

```typescript
// components/TeamCard.tsx
interface TeamCardProps {
  team: Team;
  onSelect?: (teamId: number) => void;
}

export function TeamCard({ team, onSelect }: TeamCardProps) {
  return (
    <div className="team-card" onClick={() => onSelect?.(team.id)}>
      <h3>{team.name}</h3>
      <p>Record: {team.wins}-{team.losses}</p>
    </div>
  );
}
```

### Code Formatting

We use **Prettier** for consistent formatting:

- Single quotes for strings
- Semicolons always
- 2-space indentation
- 100-character line width
- Trailing commas (ES5)

Run before committing:
```bash
npm run format:fix
```

### Linting Rules

We use **ESLint** with TypeScript and React plugins:

- No console.log in production code (use console.warn/error/info)
- Unused variables are errors
- Prefer const over let
- No var declarations
- Object shorthand required

Run before committing:
```bash
npm run lint:fix
```

### File Organization

```
src/
├── components/       # Reusable UI components
│   ├── Button.tsx
│   ├── Card.tsx
│   └── Modal.tsx
├── lib/             # Business logic and utilities
│   ├── api/         # API clients
│   ├── adapters/    # Data transformers
│   └── analytics/   # Statistical calculations
├── hooks/           # Custom React hooks
├── types/           # Shared TypeScript types
└── utils/           # Helper functions

functions/           # Cloudflare Pages Functions (API routes)
├── api/
│   ├── mlb/
│   ├── nfl/
│   └── nba/

public/              # Static assets
├── css/
├── js/
└── images/

docs/                # Documentation
tests/               # Test files
```

### Naming Conventions

- **Files**: kebab-case (e.g., `team-standings.tsx`)
- **Components**: PascalCase (e.g., `TeamStandings`)
- **Functions**: camelCase (e.g., `fetchTeamData`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`)
- **Types/Interfaces**: PascalCase (e.g., `TeamData`, `StandingsResponse`)

## Testing Requirements

### Test Coverage Requirements

- **Overall coverage**: 80% minimum
- **New code**: 90% minimum
- **Critical paths**: 100% required

### Unit Tests

Use **Vitest** for unit testing:

```typescript
// lib/analytics/pythagorean.test.ts
import { describe, it, expect } from 'vitest';
import { calculatePythagoreanWins } from './pythagorean';

describe('calculatePythagoreanWins', () => {
  it('calculates expected wins for MLB team', () => {
    const result = calculatePythagoreanWins({
      runsScored: 800,
      runsAllowed: 700,
      gamesPlayed: 162
    }, 'baseball');

    expect(result).toBeCloseTo(90.5, 1);
  });

  it('handles zero runs edge case', () => {
    const result = calculatePythagoreanWins({
      runsScored: 0,
      runsAllowed: 0,
      gamesPlayed: 10
    }, 'baseball');

    expect(result).toBe(0);
  });
});
```

Run tests:
```bash
npm run test              # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # Generate coverage report
```

### Integration Tests

Test API endpoints and data flows:

```typescript
// tests/api/mlb/standings.test.ts
import { describe, it, expect } from 'vitest';

describe('MLB Standings API', () => {
  it('returns valid standings data', async () => {
    const response = await fetch('/api/mlb/standings');
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('standings');
    expect(data.standings).toBeInstanceOf(Array);
    expect(data.standings[0]).toHaveProperty('teamName');
  });
});
```

### Accessibility Tests

Use **Playwright** with **axe-core**:

```typescript
// tests/accessibility/homepage.test.ts
import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test('homepage has no accessibility violations', async ({ page }) => {
  await page.goto('/');
  await injectAxe(page);
  await checkA11y(page);
});
```

Run accessibility tests:
```bash
npm run test:accessibility
```

### Visual Regression Tests

Use **Playwright** screenshots for visual regression:

```typescript
// tests/visual/team-card.test.ts
import { test, expect } from '@playwright/test';

test('team card renders correctly', async ({ page }) => {
  await page.goto('/teams/cardinals');
  await expect(page.locator('.team-card')).toHaveScreenshot('team-card.png');
});
```

## Commit Message Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation only changes
- **style**: Code style changes (formatting, missing semicolons, etc.)
- **refactor**: Code refactoring (no functional changes)
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Maintenance tasks (deps, build, tooling)

### Scope

Optional. Indicates what part of codebase is affected:

- `api` - API endpoints
- `ui` - User interface components
- `analytics` - Analytics calculations
- `data` - Data fetching/transformation
- `docs` - Documentation
- `tests` - Test files
- `ci` - CI/CD pipeline

### Examples

**Feature:**
```
feat(api): add MLB standings endpoint

Implements GET /api/mlb/standings with caching and error handling.
Returns team records, win percentage, and divisional standings.

Closes #123
```

**Bug Fix:**
```
fix(ui): correct team logo alignment on mobile

Team logos were misaligned on screens < 768px width.
Adjusted flex container and added responsive sizing.

Fixes #456
```

**Documentation:**
```
docs(contributing): add accessibility testing guidelines

Added section on using Playwright with axe-core for a11y testing.
Includes examples and coverage requirements.
```

**Chore:**
```
chore(deps): update eslint to v8.57.0

Updated ESLint and related plugins to latest versions.
No breaking changes detected.
```

### Breaking Changes

If your commit introduces breaking changes, add `BREAKING CHANGE:` in the footer:

```
feat(api): change standings API response format

BREAKING CHANGE: Standings API now returns nested object structure
instead of flat array. Update client code to access `data.standings`.

Migration guide: docs/api-migration.md
```

## Pull Request Process

### Before Creating PR

1. ✅ All tests pass (`npm run test`)
2. ✅ Linting passes (`npm run lint`)
3. ✅ Formatting is correct (`npm run format`)
4. ✅ TypeScript compiles (`npm run typecheck`)
5. ✅ Accessibility tests pass (`npm run test:accessibility`)
6. ✅ Code coverage meets minimum (80%)
7. ✅ Documentation updated (if applicable)
8. ✅ CHANGELOG.md updated (for significant changes)

### Creating the PR

1. **Push your branch** to your fork
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create Pull Request** on GitHub
   - Navigate to your fork
   - Click "Compare & pull request"
   - Fill out PR template (see below)

3. **PR Title Format**
   ```
   feat(api): add MLB standings endpoint
   ```
   Follow same conventions as commit messages.

4. **PR Description Template**
   ```markdown
   ## Description
   Brief description of changes and motivation.

   ## Type of Change
   - [ ] Bug fix (non-breaking change which fixes an issue)
   - [ ] New feature (non-breaking change which adds functionality)
   - [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
   - [ ] Documentation update
   - [ ] Performance improvement
   - [ ] Code refactoring

   ## Testing
   - [ ] Unit tests added/updated
   - [ ] Integration tests added/updated
   - [ ] Accessibility tests pass
   - [ ] Manual testing completed

   ## Screenshots (if applicable)
   Add screenshots for UI changes

   ## Checklist
   - [ ] Code follows project style guidelines
   - [ ] Self-review completed
   - [ ] Documentation updated
   - [ ] No new warnings generated
   - [ ] Tests added that prove fix is effective or feature works
   - [ ] All pre-commit hooks pass

   ## Related Issues
   Closes #123
   Related to #456
   ```

5. **Request Reviewers**
   - Assign 2 reviewers
   - Add appropriate labels (bug, enhancement, documentation, etc.)
   - Link related issues

### During Review

- Respond to feedback promptly
- Make requested changes in new commits (don't force push)
- Resolve conversations when addressed
- Re-request review after updates

### After Approval

- **Squash and merge** to main (preferred)
- Delete your feature branch
- Close related issues

## Code Review Process

### For Authors

**Before requesting review:**
- Self-review your PR on GitHub
- Check for typos, debugging code, commented-out code
- Verify all CI checks pass
- Add helpful comments for complex logic

**During review:**
- Be receptive to feedback
- Ask questions if feedback is unclear
- Explain your reasoning when disagreeing
- Keep discussions professional and constructive

### For Reviewers

**Review checklist:**

- [ ] Code meets project standards
- [ ] Logic is correct and efficient
- [ ] Tests are comprehensive
- [ ] Documentation is clear and complete
- [ ] No security vulnerabilities
- [ ] Accessibility requirements met
- [ ] Performance impact is acceptable

**Providing feedback:**

- Be respectful and constructive
- Explain the "why" behind suggestions
- Distinguish between required changes and suggestions
- Approve when standards are met, even if you'd do it differently

**Feedback categories:**

- 🚨 **Blocking**: Must be fixed before merge
- 💡 **Suggestion**: Nice to have, author's choice
- ❓ **Question**: Seeking clarification
- 👍 **Praise**: Acknowledge good work

**Example comments:**

```
🚨 This API endpoint is missing error handling for network failures.
Please add try/catch and return appropriate HTTP status codes.

💡 Consider using a Map instead of an object for faster lookups here.
Not required, but might improve performance with large datasets.

❓ Can you explain the reasoning behind this calculation?
I'm not familiar with this formula.

👍 Great test coverage! The edge cases are well-handled.
```

## Documentation

### When to Update Documentation

Update documentation when you:

- Add or modify API endpoints
- Change data structures or types
- Add new features
- Fix bugs that affect documented behavior
- Update development workflows

### Documentation Types

1. **Code Comments**
   - Use JSDoc for functions and classes
   - Explain complex logic
   - Document edge cases

   ```typescript
   /**
    * Calculates Pythagorean expected wins for a team.
    *
    * Uses Bill James' Pythagorean expectation formula:
    * Wins = (Runs Scored ^ exp) / (Runs Scored ^ exp + Runs Allowed ^ exp)
    *
    * @param stats - Team offensive and defensive statistics
    * @param sport - Sport type (affects exponent value)
    * @returns Expected number of wins based on run differential
    *
    * @example
    * const expectedWins = calculatePythagoreanWins({
    *   runsScored: 800,
    *   runsAllowed: 700,
    *   gamesPlayed: 162
    * }, 'baseball');
    * // Returns approximately 90.5 wins
    */
   ```

2. **README Updates**
   - Update if you change setup process
   - Add new environment variables
   - Modify API endpoints

3. **API Documentation**
   - Document in `/docs/API.md`
   - Include request/response examples
   - List error codes and meanings

4. **Architecture Decisions**
   - Document major decisions in `/docs/decisions/`
   - Use ADR (Architecture Decision Record) format

## Questions and Support

### Getting Help

- **Documentation**: Check `/docs/` directory first
- **GitHub Discussions**: Ask questions and discuss ideas
- **GitHub Issues**: Report bugs or request features
- **Email**: austin@blazesportsintel.com for urgent matters

### Reporting Bugs

Use GitHub Issues with this template:

```markdown
**Bug Description**
Clear description of what the bug is.

**Steps to Reproduce**
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

**Expected Behavior**
What you expected to happen.

**Actual Behavior**
What actually happened.

**Screenshots**
If applicable, add screenshots.

**Environment**
- OS: [e.g., macOS 13.0]
- Browser: [e.g., Chrome 120]
- Node.js: [e.g., v20.10.0]

**Additional Context**
Any other context about the problem.
```

### Suggesting Features

Use GitHub Issues with this template:

```markdown
**Feature Request**
Clear description of the feature.

**Problem Statement**
What problem does this solve? Who benefits?

**Proposed Solution**
How would you implement this?

**Alternatives Considered**
Other approaches you've thought about.

**Additional Context**
Screenshots, mockups, or examples.
```

---

## License

By contributing to Blaze Sports Intel, you agree that your contributions will be licensed under the project's MIT License.

---

**Thank you for contributing to Blaze Sports Intel!**

We appreciate your time and effort in making this project better for everyone.

---

**Last Updated:** November 6, 2025
**Maintainer:** Austin Humphrey
**Contact:** austin@blazesportsintel.com
