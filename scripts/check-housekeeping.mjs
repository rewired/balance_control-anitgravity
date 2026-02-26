import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT_DIR = path.resolve('.');
const DOCS_CHANGELOG = path.resolve('docs/changelog.md');
const TASKS_DIR = path.resolve('docs/tasks');
const TASK_POLICY_MIN_ID = 302;

const ROOT_DOC_WHITELIST = new Set(['README.md', 'AGENTS.md']);
const ROOT_CANONICAL_DOC_ALIASES = [/^changelog\.md$/i, /^docs\.md$/i, /^architecture\.md$/i, /^contributing\.md$/i];

const LEGACY_CHANGELOG_PATTERNS = [
  /(?:update|edit|target|use|write|append|modify|create)\b[^\n]{0,80}(?:^|[^a-z0-9_/])CHANGELOG\.md\b/,
  /(?:^|[^a-z0-9_/])CHANGELOG\.md\b[^\n]{0,80}(?:required|must|soll|should)/,
  /(?:^|[^a-z0-9_/])CHANGELOG\.md\b/
];

let failures = 0;

function fail(scope, message) {
  console.error(`FAIL: ${scope}: ${message}`);
  failures += 1;
}

function pass(message) {
  console.log(`PASS: ${message}`);
}

function listRootMarkdownFiles() {
  return fs
    .readdirSync(ROOT_DIR, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.md'))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

function checkRootDocWhitelist() {
  console.log('Checking root markdown whitelist...');
  const markdownFiles = listRootMarkdownFiles();
  const startFailures = failures;

  for (const fileName of markdownFiles) {
    if (ROOT_DOC_WHITELIST.has(fileName)) {
      continue;
    }

    const duplicatesCanonical = ROOT_CANONICAL_DOC_ALIASES.some((pattern) => pattern.test(fileName));
    if (duplicatesCanonical) {
      fail(fileName, 'Root document duplicates a canonical docs artifact. Move content under /docs and keep only whitelisted root docs.');
    } else {
      fail(fileName, `Unexpected root markdown file. Allowed root markdown files: ${Array.from(ROOT_DOC_WHITELIST).join(', ')}`);
    }
  }

  const missingRequired = Array.from(ROOT_DOC_WHITELIST).filter((fileName) => !markdownFiles.includes(fileName));
  for (const fileName of missingRequired) {
    fail(fileName, 'Required whitelisted root markdown file is missing.');
  }

  if (failures === startFailures) {
    pass('root markdown whitelist');
  }
}

function checkCanonicalChangelogReferences() {
  console.log('Checking canonical changelog path references...');
  const startFailures = failures;

  if (!fs.existsSync(DOCS_CHANGELOG)) {
    fail('docs/changelog.md', 'Canonical changelog path is missing.');
  }

  if (fs.existsSync(path.resolve('CHANGELOG.md'))) {
    fail('CHANGELOG.md', 'Legacy root changelog path is forbidden; use docs/changelog.md only.');
  }

  if (failures === startFailures) {
    pass('canonical changelog path presence and legacy path absence');
  }
}

function readAddedTaskFilesSinceBaseline() {
  const baselineRefCandidates = ['origin/main', 'main', 'master'];

  for (const ref of baselineRefCandidates) {
    try {
      execSync(`git rev-parse --verify ${ref}`, { stdio: 'ignore' });
      const mergeBase = execSync(`git merge-base HEAD ${ref}`, { encoding: 'utf8' }).trim();
      const output = execSync(`git diff --name-only --diff-filter=A ${mergeBase}...HEAD -- docs/tasks/*.md`, {
        encoding: 'utf8'
      }).trim();
      return output ? output.split('\n').filter(Boolean) : [];
    } catch {
      // Try next candidate.
    }
  }

  return [];
}

function listTaskFilesByPolicyFloor() {
  return fs
    .readdirSync(TASKS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /^\d{4}-.*\.md$/.test(entry.name))
    .map((entry) => entry.name)
    .filter((fileName) => Number.parseInt(fileName.slice(0, 4), 10) >= TASK_POLICY_MIN_ID)
    .map((fileName) => path.join('docs/tasks', fileName));
}

function containsLegacyChangelogPath(content) {
  const allowedHints = /(legacy|veraltet|forbidden|verboten|absent|missing|do not|never)/i;
  return content.split('\n').some((line) => {
    if (allowedHints.test(line)) {
      return false;
    }
    return LEGACY_CHANGELOG_PATTERNS.some((pattern) => pattern.test(line));
  });
}

function checkNewTaskFilesForLegacyChangelogPath() {
  console.log('Checking new task files for legacy changelog paths...');
  const startFailures = failures;

  const filesToCheck = new Set([...readAddedTaskFilesSinceBaseline(), ...listTaskFilesByPolicyFloor()]);

  for (const relativePath of filesToCheck) {
    const absolutePath = path.resolve(relativePath);
    if (!fs.existsSync(absolutePath)) {
      continue;
    }
    const content = fs.readFileSync(absolutePath, 'utf8');
    if (containsLegacyChangelogPath(content)) {
      fail(relativePath, 'Task file uses a legacy changelog path. Use docs/changelog.md only.');
    }
  }

  if (failures === startFailures) {
    pass('new task files use canonical changelog path');
  }
}

console.log('Running housekeeping checks...');
checkRootDocWhitelist();
checkCanonicalChangelogReferences();
checkNewTaskFilesForLegacyChangelogPath();

if (failures > 0) {
  console.error(`\nHousekeeping checks failed with ${failures} error(s).`);
  process.exit(1);
}

console.log('\nHousekeeping checks passed.');
