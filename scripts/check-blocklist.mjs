import { readFile } from 'node:fs/promises';
import { execSync } from 'node:child_process';

const BLOCKED_TERMS = [
  'pablo sanchez',
  'achmed khan',
  'keesha phillips',
  'backyard baseball',
  'humongous entertainment'
];

function normalize(content) {
  return content.toLowerCase();
}

async function main() {
  const filesRaw = execSync('git ls-files -z', { encoding: 'utf8' });
  const files = filesRaw.split('\0').filter(Boolean);
  const violations = [];

  const allowed = [/^LEGAL_COMPLIANCE\.md$/, /^docs\//, /^assets\/LICENSES\.md$/];

  await Promise.all(
    files.map(async (file) => {
      if (file.startsWith('.git')) return;
      if (allowed.some((pattern) => pattern.test(file))) return;
      const content = await readFile(file, 'utf8');
      const normalized = normalize(content);
      BLOCKED_TERMS.forEach((term) => {
        if (normalized.includes(term)) {
          violations.push({ file, term });
        }
      });
    })
  );

  if (violations.length > 0) {
    console.error('Blocked IP references detected:');
    violations.forEach((violation) => {
      console.error(`- ${violation.file} :: ${violation.term}`);
    });
    process.exit(1);
  }

  console.log('Blocklist check passed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
