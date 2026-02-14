# Task 0039a — Verify Task Guard (scripts/verify-task.mjs)

## Goal

Add a repo-level guard script that prevents “task done” unless:

* the task markdown PR checklist is fully checked,
* required report sections are present and non-empty,
* the latest git commit is “meaningful” and includes the task file.

## Scope

Implement **one** script: `scripts/verify-task.mjs` (no dependencies). Optionally add a root `package.json` script entry.

## Inputs

* Task markdown files live under `docs/tasks/`.
* Expected file naming: `docs/tasks/TASK_XXXX.md` (primary). Accept a few fallback names.

## Outputs

* `scripts/verify-task.mjs`
* (Optional) root `package.json`: add `"verify:task": "node scripts/verify-task.mjs"`

## Constraints

* Node built-ins only (no new deps)
* ESM (`.mjs`)
* Exit codes: `0` pass, `1` fail
* Error messages must be actionable (exact missing requirement)

## CLI Contract

* `node scripts/verify-task.mjs 0021`
* `TASK_ID=0021 node scripts/verify-task.mjs`

## Rules Enforced

### A) Task file checks (docs/tasks/TASK_XXXX.md)

* Must contain section `## PR Checklist` (any heading level 2–6 accepted)
* Inside PR Checklist section:

  * Must contain at least one checkbox line
  * Must contain **zero** unchecked boxes `- [ ]` (also accept `* [ ]`)
* Must contain non-empty sections:

  * `## Work Summary`
  * `## Commands Run`

### B) Latest commit checks

* `git log -1 --pretty=%B` subject must match: `task(XXXX): <summary>`
* Commit body must contain **≥ 2** bullet lines (`- ...` or `* ...`)
* `git show -1 --name-only --pretty=format:` must include the task markdown file path

## Implementation

Create `scripts/verify-task.mjs` with the following content:

```js
#!/usr/bin/env node
/**
 * verify-task.mjs
 *
 * Usage:
 *   node scripts/verify-task.mjs 0021
 *   TASK_ID=0021 node scripts/verify-task.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

function fail(msg) {
  console.error(`\n[verify-task] FAIL: ${msg}\n`);
  process.exit(1);
}

function ok(msg) {
  console.log(`[verify-task] OK: ${msg}`);
}

function readUtf8(p) {
  return fs.readFileSync(p, "utf8");
}

function git(cmd) {
  return execSync(cmd, { stdio: ["ignore", "pipe", "pipe"] }).toString("utf8").trimEnd();
}

function getTaskId(argv) {
  const arg = argv[2];
  const env = process.env.TASK_ID;
  const id = (arg || env || "").trim();
  if (!id) fail("Missing TASK_ID. Provide arg (e.g. 0021) or env TASK_ID=0021.");
  if (!/^\d{4}$/.test(id)) fail(`TASK_ID must be 4 digits (e.g. 0021). Got: "${id}"`);
  return id;
}

function findTaskFile(taskId) {
  const candidates = [
    path.join("docs", "tasks", `TASK_${taskId}.md`),
    path.join("docs", "tasks", `task_${taskId}.md`),
    path.join("docs", "tasks", `TASK-${taskId}.md`),
    path.join("docs", "tasks", `${taskId}.md`),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p) && fs.statSync(p).isFile()) return p;
  }
  fail(`Task markdown not found for ${taskId}. Tried:\n${candidates.map((c) => `- ${c}`).join("\n")}`);
}

function extractSection(md, headingRegex) {
  const m = md.match(headingRegex);
  if (!m || m.index == null) return null;
  const start = m.index;
  const headingLine = m[0];
  const levelMatch = headingLine.match(/^(#{1,6})\s/m);
  const level = levelMatch ? levelMatch[1].length : 2;

  const after = md.slice(start + headingLine.length);
  const nextHeadingRe = new RegExp(`^#{1,${level}}\\s+.+$`, "m");
  const next = after.match(nextHeadingRe);
  const end = next && next.index != null ? start + headingLine.length + next.index : md.length;
  return md.slice(start, end);
}

function ensureNonEmptySection(md, title) {
  const sec = extractSection(md, new RegExp(`^#{2,6}\\s+${title}\\b.*$`, "im"));
  if (!sec) fail(`Missing required section: "${title}".`);
  const lines = sec.split(/\r?\n/);
  const content = lines.slice(1).join("\n").trim();
  if (!content) fail(`Section "${title}" exists but is empty.`);
  ok(`Section "${title}" present.`);
  return sec;
}

function verifyChecklist(md) {
  const sec = extractSection(md, /^#{2,6}\s+PR\s+Checklist\b.*$/im);
  if (!sec) fail("Missing required section: \"PR Checklist\".");

  const unchecked = sec.match(/^[\t >]*[-*]\s+\[\s\]\s+/gm) || [];
  const checked = sec.match(/^[\t >]*[-*]\s+\[[xX]\]\s+/gm) || [];

  if (checked.length === 0 && unchecked.length === 0) {
    fail("PR Checklist section has no checkboxes. Expected '- [x]' items.");
  }
  if (unchecked.length > 0) {
    fail(`PR Checklist has ${unchecked.length} unchecked item(s). Example:\n${unchecked.slice(0, 5).join("\n")}`);
  }
  ok(`PR Checklist complete (${checked.length} checked item(s)).`);
}

function verifyCommit(taskId, taskFilePath) {
  let commitMsg = "";
  try {
    commitMsg = git("git log -1 --pretty=%B");
  } catch {
    fail("Could not read git log. Ensure this is a git repo with at least one commit.");
  }

  const lines = commitMsg.split(/\r?\n/);
  const subject = (lines[0] || "").trim();
  const body = lines.slice(1).join("\n").trim();

  const subjRe = new RegExp(`^task\\(${taskId}\\):\\s+.+`);
  if (!subjRe.test(subject)) {
    fail(`Latest commit subject must match: task(${taskId}): <summary>. Got: "${subject}"`);
  }

  const bulletLines = body
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => /^[-*]\s+/.test(l));

  if (bulletLines.length < 2) {
    fail(`Latest commit body must contain at least 2 bullet lines ('- ...'). Found ${bulletLines.length}.`);
  }

  let names = "";
  try {
    names = git("git show -1 --name-only --pretty=format:");
  } catch {
    fail("Could not read latest commit file list via git show.");
  }

  const normalized = taskFilePath.replace(/\\/g, "/");
  const committedFiles = names.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const hasTaskFile = committedFiles.some((f) => f.replace(/\\/g, "/") === normalized);
  if (!hasTaskFile) {
    fail(`Latest commit does not include task file: ${normalized}`);
  }

  ok(`Latest commit format + task file inclusion OK (${subject}).`);
}

function main() {
  const taskId = getTaskId(process.argv);
  const taskFile = findTaskFile(taskId);
  const md = readUtf8(taskFile);

  verifyChecklist(md);
  ensureNonEmptySection(md, "Work Summary");
  ensureNonEmptySection(md, "Commands Run");
  verifyCommit(taskId, taskFile);

  console.log("\n[verify-task] PASS ✅\n");
  process.exit(0);
}

main();
```

## Optional: package.json wiring

If a root `package.json` exists, add:

```json
{
  "scripts": {
    "verify:task": "node scripts/verify-task.mjs"
  }
}
```

## Acceptance

1. Fails with exit code 1 if:

* task markdown missing required sections
* PR Checklist contains any `- [ ]` inside PR Checklist section
* latest commit subject/body invalid
* latest commit does not include the task file

2. Passes with exit code 0 when all requirements are satisfied.

## Commit Requirements

Create **one** meaningful commit for this task:

* Subject: `task(0039): add verify-task guard`
* Body: 2–6 bullets describing changes

## PR Checklist

* [ ] `scripts/verify-task.mjs` added (no deps)
* [ ] Script supports arg + TASK_ID env
* [ ] Script verifies PR Checklist completion
* [ ] Script verifies Work Summary + Commands Run non-empty
* [ ] Script validates latest commit subject + bullet body
* [ ] Script validates task file included in commit
* [ ] (Optional) `package.json` includes `verify:task` script
* [ ] Manual run: `node scripts/verify-task.mjs 0039` behaves as expected

## Work Summary

## Commands Run
