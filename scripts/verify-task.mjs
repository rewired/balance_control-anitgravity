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
  const id = (arg || env || "").trim().toLowerCase();
  if (!id) fail("Missing TASK_ID. Provide arg (e.g. 0021) or env TASK_ID=0021.");
  if (!/^\d{4}[a-z]?$/.test(id)) fail(`TASK_ID must be 4 digits (e.g. 0021) or 4 digits + letter (e.g. 0039a). Got: "${id}"`);
  return id;
}

function findTaskFile(taskId) {
  const tasksDir = path.join("docs", "tasks");
  if (!fs.existsSync(tasksDir) || !fs.statSync(tasksDir).isDirectory()) {
    fail(`Tasks directory not found: ${tasksDir}`);
  }

  const entries = fs.readdirSync(tasksDir, { withFileTypes: true });
  const mdFiles = entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".md"))
    .map((entry) => entry.name);

  const findByPrefix = (prefix, re) => {
    if (prefix) return mdFiles.filter((name) => name.toLowerCase().startsWith(prefix));
    return mdFiles.filter((name) => re.test(name.toLowerCase()));
  };

  const hasSuffix = /[a-z]$/.test(taskId);
  const exactPrefix = `${taskId}-`;
  let matches = findByPrefix(exactPrefix);

  if (!hasSuffix && matches.length === 0) {
    matches = findByPrefix("", new RegExp(`^${taskId}[a-z]-`));
  }

  if (matches.length !== 1) {
    const candidates = mdFiles.filter((name) => name.toLowerCase().startsWith(taskId));
    const list = candidates.length ? candidates : mdFiles;
    fail(`Task markdown not found or ambiguous for ${taskId}. Matches:\n${list.map((c) => `- ${path.join("docs", "tasks", c)}`).join("\n")}`);
  }

  const fileName = matches[0];
  const match = fileName.toLowerCase().match(/^(\d{4}[a-z]?)-/);
  if (!match) {
    fail(`Task markdown name does not start with task id: ${path.join("docs", "tasks", fileName)}`);
  }
  return { path: path.join("docs", "tasks", fileName), resolvedId: match[1] };
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
  const { path: taskFile, resolvedId } = findTaskFile(taskId);
  const md = readUtf8(taskFile);

  verifyChecklist(md);
  ensureNonEmptySection(md, "Work Summary");
  ensureNonEmptySection(md, "Commands Run");
  verifyCommit(resolvedId, taskFile);

  console.log("\n[verify-task] PASS ✅\n");
  process.exit(0);
}

main();
