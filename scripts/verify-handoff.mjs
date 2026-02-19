#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const PROTOCOL_FILE = path.join(ROOT, 'docs', 'hand-off', 'task-packet-protocol.md');
const CURRENT_FILE = path.join(ROOT, 'docs', 'hand-off', 'current.md');

function fail(msg) {
  console.error(`\x1b[31mFAIL: ${msg}\x1b[0m`);
  process.exit(1);
}

function info(msg) {
  console.log(`\x1b[32mPASS: ${msg}\x1b[0m`);
}

// 1. Verify Protocol File (task-packet-protocol.md)
console.log(`Checking ${path.relative(ROOT, PROTOCOL_FILE)}...`);
if (!fs.existsSync(PROTOCOL_FILE)) {
  fail(`Protocol file not found: ${PROTOCOL_FILE}`);
}

const protocolContent = fs.readFileSync(PROTOCOL_FILE, 'utf-8');

// Check 1.1: Capsule section exists
const capsuleRegex = /## \d+\) Context Capsule/;
if (!capsuleRegex.test(protocolContent)) {
  fail('Protocol must contain "Context Capsule" section');
}

// Check 1.2: LAST COMPLETED TASK is a placeholder
// We look for: > **LAST COMPLETED TASK:** <Task ID> ...
// Fail if we see concrete digits like: > **LAST COMPLETED TASK:** 0123
const lastTaskLine = protocolContent.match(/> \*\*LAST COMPLETED TASK:\*\*.*/);
if (!lastTaskLine) {
  fail('Could not find "LAST COMPLETED TASK" line in protocol capsule');
}
if (/\b\d{4}\b/.test(lastTaskLine[0])) {
  fail(`Protocol capsule contains concrete task ID: "${lastTaskLine[0]}". Must use placeholder.`);
}

// Check 1.3: CURRENT STATE lines are placeholders
// We look for the block under > **CURRENT STATE (facts):**
// It should contain lines starting with > * <... or > - <...
// We stop capturing before the next bold header (> **...)
const protocolCapsuleMatch = protocolContent.match(/> \*\*CURRENT STATE \(facts\):\*\*\n((?:(?!> \*\*).*\n)+)/);
if (!protocolCapsuleMatch) {
  fail('Could not find "CURRENT STATE (facts)" block in protocol capsule');
}
const protocolCapsuleLines = protocolCapsuleMatch[1]
  .split('\n')
  .filter(line => {
    const trimmed = line.trim();
    return trimmed.startsWith('> * ') || trimmed.startsWith('> - ');
  });

if (protocolCapsuleLines.length === 0) {
  fail('Protocol capsule "CURRENT STATE" block is empty');
}

protocolCapsuleLines.forEach(line => {
  // Check if line contains <...>
  if (!/<.*>/.test(line)) {
    fail(`Protocol capsule fact line must use placeholder (<...>): "${line}"`);
  }
});

// Check 1.4: Reference to docs/hand-off/current.md
if (!protocolContent.includes('docs/hand-off/current.md')) {
  fail('Protocol must explicitly reference "docs/hand-off/current.md"');
}

info('Protocol file is clean (template-only)');


// 2. Verify Current File (current.md)
console.log(`Checking ${path.relative(ROOT, CURRENT_FILE)}...`);
if (!fs.existsSync(CURRENT_FILE)) {
  fail(`Current file not found: ${CURRENT_FILE}`);
}

const currentContent = fs.readFileSync(CURRENT_FILE, 'utf-8');

// Check 2.1: Contains "Context Capsule (copy/paste)"
if (!currentContent.includes('Context Capsule (copy/paste)')) {
  fail('Current file must contain "Context Capsule (copy/paste)" section');
}

// Check 2.2: Extract canonical facts
// Look for: ## Current state (facts) ... until next header
const canonicalFactsMatch = currentContent.match(/## Current state \(facts\)\n([\s\S]*?)(?=\n## |$)/);
if (!canonicalFactsMatch) {
  fail('Could not find "## Current state (facts)" section in current.md');
}

const canonicalFacts = canonicalFactsMatch[1]
  .split('\n')
  .map(l => l.trim())
  .filter(l => l.startsWith('- ') || l.startsWith('* '))
  .map(l => l.replace(/^[-*] /, '').trim());

if (canonicalFacts.length === 0) {
  fail('Canonical "Current state (facts)" list is empty');
}

// Check 2.3: Extract capsule facts
// Look for: > **CURRENT STATE (facts):** ... until next double-newline or header
// The capsule lines start with "> "
// We stop capturing before the next bold header (> **...)
const capsuleFactsMatch = currentContent.match(/> \*\*CURRENT STATE \(facts\):\*\*\n((?:(?!> \*\*).*\n)+)/);
if (!capsuleFactsMatch) {
  fail('Could not find capsule "CURRENT STATE (facts)" block in current.md');
}

const capsuleFacts = capsuleFactsMatch[1]
  .split('\n')
  .map(l => l.trim())
  .filter(l => l.startsWith('> - ') || l.startsWith('> * '))
  .map(l => l.replace(/^> [-*] /, '').trim());

if (capsuleFacts.length === 0) {
  fail('Capsule "CURRENT STATE (facts)" list is empty');
}

// Compare
if (canonicalFacts.length !== capsuleFacts.length) {
  fail(`Mismatch in fact count: Canonical has ${canonicalFacts.length}, Capsule has ${capsuleFacts.length}`);
}

for (let i = 0; i < canonicalFacts.length; i++) {
  if (canonicalFacts[i] !== capsuleFacts[i]) {
    console.error('Canonical:', canonicalFacts[i]);
    console.error('Capsule:  ', capsuleFacts[i]);
    fail(`Fact mismatch at index ${i}`);
  }
}

info('Current file capsule matches canonical facts');
console.log('✨ All hand-off checks passed!');
