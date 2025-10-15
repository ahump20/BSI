#!/usr/bin/env -S npx tsx
import { promises as fs } from 'fs';
import path from 'path';

interface RouteNode {
  path: string;
  label?: string;
  depth: number;
  children: RouteNode[];
}

interface RedirectEntry {
  legacyUrl: string;
  newUrl: string;
  status: string;
  notes?: string;
}

interface CliOptions {
  format: 'tree' | 'json' | 'paths';
  check: 'none' | 'redirects' | 'specs' | 'all';
  output?: string;
}

const PROJECT_ROOT = path.resolve(__dirname, '..');
const IA_PATH = path.join(PROJECT_ROOT, 'product/ux/IA.md');
const REDIRECT_PATH = path.join(PROJECT_ROOT, 'product/ux/RedirectMap.csv');
const SPECS_DIR = path.join(PROJECT_ROOT, 'product/ux/specs');
const CRITICAL_ROUTES = [
  '/baseball/ncaab',
  '/baseball/ncaab/scoreboard',
  '/baseball/ncaab/games/[gameId]',
  '/baseball/ncaab/teams/[teamSlug]',
  '/baseball/ncaab/players/[playerSlug]',
  '/baseball/ncaab/standings',
  '/baseball/ncaab/rankings',
  '/baseball/ncaab/news',
];

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = { format: 'tree', check: 'none' };

  argv.forEach((arg) => {
    if (arg.startsWith('--format=')) {
      const format = arg.split('=')[1] as CliOptions['format'];
      if (!['tree', 'json', 'paths'].includes(format)) {
        throw new Error(`Unsupported format: ${format}`);
      }
      options.format = format;
    } else if (arg === '--format') {
      throw new Error('Use --format=<tree|json|paths>');
    } else if (arg.startsWith('--check=')) {
      const parts = arg.split('=');
      if (parts.length < 2 || !parts[1]) {
        throw new Error('--check requires a value');
      }
      const check = parts[1] as CliOptions['check'];
      if (!['none', 'redirects', 'specs', 'all'].includes(check)) {
        throw new Error(`Unsupported check flag: ${check}`);
      }
      options.check = check;
    } else if (arg === '--check') {
      options.check = 'all';
    } else if (arg.startsWith('--output=')) {
      const parts = arg.split('=');
      if (parts.length < 2 || !parts[1]) {
        throw new Error('--output requires a file path');
      }
      options.output = parts[1];
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
  });

  return options;
}

function printHelp(): void {
  // eslint-disable-next-line no-console
  console.log(`Usage: npx tsx scripts/route-map.ts [options]

Options:
  --format=<tree|json|paths>   Output format (default: tree)
  --check[=redirects|specs|all] Validate redirect map and/or spec coverage
  --output=<file>              Write output to a file instead of stdout
  --help                       Show this help message
`);
}

function parseRouteTree(markdown: string): RouteNode[] {
  const section = extractRouteSection(markdown);
  const lines = section.split(/\r?\n/);
  const bulletRegex = /^(\s*)-\s+(.*)$/;
  const stack: RouteNode[] = [];
  const roots: RouteNode[] = [];

  for (const line of lines) {
    const match = bulletRegex.exec(line);
    if (!match) {
      continue;
    }

    const indent = match[1].length;
    const depth = Math.floor(indent / 2);
    const content = match[2].trim();
    const { routePath, label } = parseRouteLine(content);
    const node: RouteNode = {
      path: routePath,
      label,
      depth,
      children: [],
    };

    while (stack.length > depth) {
      stack.pop();
    }

    if (stack.length === 0) {
      roots.push(node);
    } else {
      stack[stack.length - 1].children.push(node);
    }

    stack.push(node);
  }

  return roots;
}

function extractRouteSection(markdown: string): string {
  const match = /##\s+Route\s+Tree\s+Overview([\s\S]*?)(?:\n##\s+|\n#\s+|$)/i.exec(markdown);
  if (match && match[1]) {
    return match[1];
  }
  return markdown;
}

function parseRouteLine(content: string): { routePath: string; label?: string } {
  const emDashIndex = content.indexOf('—');
  const hyphenIndex = content.indexOf(' - ');

  if (emDashIndex >= 0) {
    const routePath = content.slice(0, emDashIndex).trim();
    const label = content.slice(emDashIndex + 1).replace(/^[-–—]\s*/, '').trim();
    return { routePath, label: label || undefined };
  }

  if (hyphenIndex >= 0) {
    const routePath = content.slice(0, hyphenIndex).trim();
    const label = content.slice(hyphenIndex + 3).trim();
    return { routePath, label: label || undefined };
  }

  return { routePath: content.trim() };
}

function flattenRoutes(nodes: RouteNode[]): RouteNode[] {
  const result: RouteNode[] = [];

  const walk = (node: RouteNode): void => {
    result.push(node);
    node.children.forEach(walk);
  };

  nodes.forEach(walk);
  return result;
}

async function readRedirects(): Promise<RedirectEntry[]> {
  const raw = await fs.readFile(REDIRECT_PATH, 'utf8');
  const lines = raw.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length <= 1) {
    return [];
  }

  const entries: RedirectEntry[] = [];
  for (let i = 1; i < lines.length; i += 1) {
    const [legacyUrl, newUrl, status, notes] = splitCsvLine(lines[i]);
    if (!legacyUrl || !newUrl) {
      continue;
    }
    entries.push({ legacyUrl, newUrl, status: status ?? '', notes });
  }
  return entries;
}

function splitCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

async function readSpecs(): Promise<Map<string, string>> {
  const specs = new Map<string, string>();
  let files: string[] = [];
  try {
    files = await fs.readdir(SPECS_DIR);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return specs;
    }
    throw error;
  }

  await Promise.all(
    files
      .filter((file) => file.endsWith('.mdx') || file.endsWith('.md'))
      .map(async (file) => {
        const absolute = path.join(SPECS_DIR, file);
        const content = await fs.readFile(absolute, 'utf8');
        const frontmatter = extractFrontmatter(content);
        const route = frontmatter.get('route');
        if (route) {
          specs.set(route.trim(), file);
        }
      }),
  );

  return specs;
}

function extractFrontmatter(content: string): Map<string, string> {
  const lines = content.split(/\r?\n/);
  const map = new Map<string, string>();
  if (lines[0]?.trim() !== '---') {
    return map;
  }

  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (line.trim() === '---') {
      break;
    }
    const separatorIndex = line.indexOf(':');
    if (separatorIndex === -1) {
      continue;
    }
    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    if (key) {
      map.set(key, value);
    }
  }

  return map;
}

function normaliseRoute(value: string): string {
  const trimmed = value.trim();
  if (trimmed === '') {
    return trimmed;
  }
  const noTrailingSlash = trimmed !== '/' ? trimmed.replace(/\/+$/, '') : '/';
  return noTrailingSlash.replace(/:([A-Za-z0-9_]+)/g, '[$1]');
}

function renderTree(nodes: RouteNode[], indent = 0): string {
  const lines: string[] = [];
  const prefix = '  '.repeat(indent);

  nodes.forEach((node) => {
    const label = node.label ? ` — ${node.label}` : '';
    lines.push(`${prefix}• ${node.path}${label}`);
    if (node.children.length > 0) {
      lines.push(renderTree(node.children, indent + 1));
    }
  });

  return lines.join('\n');
}

async function runChecks(
  nodes: RouteNode[],
  redirectEntries: RedirectEntry[],
  specs: Map<string, string>,
  mode: CliOptions['check'],
): Promise<number> {
  const issues: string[] = [];
  const allRoutes = new Set<string>(flattenRoutes(nodes).map((node) => normaliseRoute(node.path)));

  const shouldCheckRedirects = mode === 'redirects' || mode === 'all';
  const shouldCheckSpecs = mode === 'specs' || mode === 'all';

  if (shouldCheckRedirects && redirectEntries.length > 0) {
    const duplicateLegacy = new Map<string, number>();
    redirectEntries.forEach((entry) => {
      const legacyKey = entry.legacyUrl.trim();
      duplicateLegacy.set(legacyKey, (duplicateLegacy.get(legacyKey) ?? 0) + 1);
      if (!entry.newUrl.startsWith('/')) {
        issues.push(`Redirect for ${entry.legacyUrl} must start with '/'`);
      }
      const normalised = normaliseRoute(entry.newUrl);
      if (!allRoutes.has(normalised)) {
        issues.push(`Redirect target ${entry.newUrl} is not present in IA.md`);
      }
      if (entry.status && entry.status !== '301') {
        issues.push(`Redirect ${entry.legacyUrl} uses status ${entry.status}; expected 301.`);
      }
    });

    duplicateLegacy.forEach((count, legacy) => {
      if (count > 1) {
        issues.push(`Duplicate legacy URL detected in redirect map: ${legacy}`);
      }
    });
  }

  if (shouldCheckSpecs) {
    CRITICAL_ROUTES.forEach((route) => {
      const normalised = normaliseRoute(route);
      if (!allRoutes.has(normalised)) {
        issues.push(`Critical route missing from IA.md: ${route}`);
      }
      if (!specs.has(route)) {
        issues.push(`Spec missing for critical route ${route}`);
      }
    });
  }

  if (issues.length > 0) {
    issues.forEach((issue) => console.error(`❌ ${issue}`));
    return 1;
  }

  console.log('✅ Route map, redirects, and specs look consistent.');
  return 0;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const iaRaw = await fs.readFile(IA_PATH, 'utf8');
  const routeTree = parseRouteTree(iaRaw);
  if (routeTree.length === 0) {
    throw new Error('No routes found in IA.md. Ensure the document uses bullet syntax.');
  }
  const redirects = await readRedirects();
  const specs = await readSpecs();

  if (options.check !== 'none') {
    const exitCode = await runChecks(routeTree, redirects, specs, options.check);
    if (exitCode !== 0) {
      process.exit(exitCode);
    }
  }

  let output = '';
  switch (options.format) {
    case 'json': {
      const toSerializable = (node: RouteNode): RouteNode => ({
        path: node.path,
        label: node.label,
        depth: node.depth,
        children: node.children.map(toSerializable),
      });
      output = JSON.stringify(routeTree.map(toSerializable), null, 2);
      break;
    }
    case 'paths': {
      const paths = Array.from(new Set(flattenRoutes(routeTree).map((node) => normaliseRoute(node.path))));
      output = paths.join('\n');
      break;
    }
    case 'tree':
    default:
      output = renderTree(routeTree);
  }

  if (options.output) {
    await fs.writeFile(path.resolve(PROJECT_ROOT, options.output), `${output}\n`, 'utf8');
  } else {
    console.log(output);
  }
}

main().catch((error) => {
  console.error(`Failed to generate route map: ${(error as Error).message}`);
  process.exit(1);
});

