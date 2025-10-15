#!/usr/bin/env -S npx tsx
import { promises as fs } from 'fs';
import path from 'path';

interface ScreenshotReportRow {
  route: string;
  expectedFile: string;
  exists: boolean;
}

interface ScreenshotCliOptions {
  directory: string;
  extension: string;
  format: 'table' | 'json';
  missingOnly: boolean;
  includeDynamic: boolean;
  manifest?: string;
}

const PROJECT_ROOT = path.resolve(__dirname, '..');
const IA_PATH = path.join(PROJECT_ROOT, 'product/ux/IA.md');

function parseArgs(argv: string[]): ScreenshotCliOptions {
  const options: ScreenshotCliOptions = {
    directory: path.join(PROJECT_ROOT, 'backups/screenshots'),
    extension: '.png',
    format: 'table',
    missingOnly: false,
    includeDynamic: true,
  };

  argv.forEach((arg) => {
    if (arg.startsWith('--dir=')) {
      options.directory = path.resolve(PROJECT_ROOT, arg.split('=')[1]);
    } else if (arg.startsWith('--ext=')) {
      {
        const ext = arg.split('=')[1];
        options.extension = ext.startsWith('.') ? ext : `.${ext}`;
      }
    } else if (arg.startsWith('--format=')) {
      const parts = arg.split('=');
      if (parts.length < 2 || !parts[1]) {
        throw new Error('--format requires a value');
      }
      const format = parts[1];
      if (format !== 'table' && format !== 'json') {
        throw new Error('Unsupported format. Use table or json.');
      }
      options.format = format;
    } else if (arg === '--missing-only') {
      options.missingOnly = true;
    } else if (arg === '--static-only') {
      options.includeDynamic = false;
    } else if (arg.startsWith('--manifest=')) {
      const parts = arg.split('=');
      if (parts.length < 2 || !parts[1]) {
        throw new Error('--manifest requires a file path');
      }
      options.manifest = path.resolve(PROJECT_ROOT, parts[1]);
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
  });

  return options;
}

function printHelp(): void {
  // eslint-disable-next-line no-console
  console.log(`Usage: npx tsx scripts/screenshots.ts [options]

Options:
  --dir=<path>          Directory containing captured screenshots (default: backups/screenshots)
  --ext=<extension>     Screenshot file extension (default: .png)
  --format=<table|json> Output format (default: table)
  --missing-only        Only list routes missing screenshots
  --static-only         Ignore dynamic parameterized routes
  --manifest=<file>     Write JSON report to a file path
`);
}

interface RouteNode {
  path: string;
  children: RouteNode[];
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
    const routePath = content.split('—')[0]?.split(' - ')[0]?.trim() ?? content;
    const node: RouteNode = { path: routePath, children: [] };

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

function flattenRoutes(nodes: RouteNode[]): string[] {
  const result: string[] = [];
  const walk = (node: RouteNode): void => {
    result.push(normaliseRoute(node.path));
    node.children.forEach(walk);
  };
  nodes.forEach(walk);
  return Array.from(new Set(result));
}

function normaliseRoute(route: string): string {
  const trimmed = route.trim();
  if (trimmed === '') {
    return trimmed;
  }
  if (trimmed === '/') {
    return trimmed;
  }
  return trimmed.replace(/\/+$/, '');
}

function routeToFilename(route: string, extension: string): string {
  if (route === '/') {
    return `root${extension}`;
  }
  return route
    .replace(/^\//, '')
    .replace(/\//g, '__')
    .replace(/\[/g, '')
    .replace(/\]/g, '')
    .replace(/:/g, '')
    .concat(extension);
}

async function buildReport(options: ScreenshotCliOptions): Promise<ScreenshotReportRow[]> {
  const markdown = await fs.readFile(IA_PATH, 'utf8');
  const tree = parseRouteTree(markdown);
  const routes = flattenRoutes(tree);
  const filteredRoutes = options.includeDynamic ? routes : routes.filter((route) => !route.includes('['));

  let files: string[] = [];
  try {
    files = await fs.readdir(options.directory);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return filteredRoutes.map((route) => ({
        route,
        expectedFile: routeToFilename(route, options.extension),
        exists: false,
      }));
    }
    throw error;
  }

  const fileSet = new Set(files);
  return filteredRoutes.map((route) => {
    const expectedFile = routeToFilename(route, options.extension);
    return {
      route,
      expectedFile,
      exists: fileSet.has(expectedFile),
    };
  });
}

function renderTable(rows: ScreenshotReportRow[], missingOnly: boolean): string {
  const filtered = missingOnly ? rows.filter((row) => !row.exists) : rows;
  if (filtered.length === 0) {
    return missingOnly
      ? 'All required screenshots are present.'
      : 'No routes found in IA.md.';
  }

  const header = ['Route', 'Status', 'Expected File'];
  const data = filtered.map((row) => [row.route, row.exists ? '✅ captured' : '⚠️ missing', row.expectedFile]);
  const widths = header.map((title, index) =>
    Math.max(
      title.length,
      ...data.map((line) => line[index].length),
    ));

  const formatRow = (line: string[]): string =>
    line
      .map((cell, index) => cell.padEnd(widths[index]))
      .join('  ');

  const lines = [formatRow(header), formatRow(widths.map((width) => '-'.repeat(width)))];
  data.forEach((row) => lines.push(formatRow(row)));
  return lines.join('\n');
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const report = await buildReport(options);

  if (options.manifest) {
    await fs.writeFile(
      options.manifest,
      JSON.stringify(
        report.map((row) => ({ ...row })),
        null,
        2,
      ),
      'utf8',
    );
  }

  if (options.format === 'json') {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log(renderTable(report, options.missingOnly));
}

main().catch((error) => {
  console.error(`Failed to build screenshot report: ${(error as Error).message}`);
  process.exit(1);
});

