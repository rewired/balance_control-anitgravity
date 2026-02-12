#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const UTF8_BOM = Buffer.from([0xef, 0xbb, 0xbf]);
const UTF16_LE_BOM = Buffer.from([0xff, 0xfe]);
const UTF16_BE_BOM = Buffer.from([0xfe, 0xff]);
const UTF32_LE_BOM = Buffer.from([0xff, 0xfe, 0x00, 0x00]);
const UTF32_BE_BOM = Buffer.from([0x00, 0x00, 0xfe, 0xff]);
const CRLF = Buffer.from("\r\n");

function runGit(args, encoding = "utf8") {
  const result = spawnSync("git", args, {
    encoding,
    maxBuffer: 64 * 1024 * 1024,
  });

  if (result.status !== 0) {
    const stderr = typeof result.stderr === "string" ? result.stderr.trim() : "";
    throw new Error(`git ${args.join(" ")} failed${stderr ? `: ${stderr}` : ""}`);
  }

  return result.stdout;
}

function getTrackedTextFiles() {
  const output = runGit(["ls-files", "--eol"], "utf8");
  const lines = output.split(/\r?\n/);
  const files = [];

  for (const line of lines) {
    if (!line) {
      continue;
    }

    const tabIndex = line.indexOf("\t");
    if (tabIndex === -1) {
      continue;
    }

    const meta = line.slice(0, tabIndex).trim();
    const filePath = line.slice(tabIndex + 1);
    const [indexField] = meta.split(/\s+/);

    if (!indexField || !indexField.startsWith("i/")) {
      continue;
    }

    const indexEol = indexField.slice(2);
    const isText = indexEol !== "none" && indexEol !== "-text";

    if (isText) {
      files.push(filePath);
    }
  }

  return files;
}

function readTrackedBlob(filePath) {
  return runGit(["show", `:${filePath}`], null);
}

function hasPrefix(buffer, prefix) {
  if (buffer.length < prefix.length) {
    return false;
  }

  for (let i = 0; i < prefix.length; i += 1) {
    if (buffer[i] !== prefix[i]) {
      return false;
    }
  }

  return true;
}

function assertUtf8(filePath, content, errors) {
  if (hasPrefix(content, UTF8_BOM)) {
    errors.push(`${filePath}: UTF-8 BOM is not allowed.`);
  }

  if (hasPrefix(content, UTF32_LE_BOM) || hasPrefix(content, UTF32_BE_BOM)) {
    errors.push(`${filePath}: UTF-32 encoding is not allowed.`);
    return;
  }

  if (hasPrefix(content, UTF16_LE_BOM) || hasPrefix(content, UTF16_BE_BOM)) {
    errors.push(`${filePath}: UTF-16 encoding is not allowed.`);
    return;
  }

  try {
    new TextDecoder("utf-8", { fatal: true }).decode(content);
  } catch {
    errors.push(`${filePath}: file is not valid UTF-8.`);
  }
}

function assertLfOnly(filePath, content, errors) {
  if (content.includes(CRLF)) {
    errors.push(`${filePath}: CRLF line endings are not allowed.`);
  }
}

function main() {
  const errors = [];
  const files = getTrackedTextFiles();

  for (const filePath of files) {
    const content = readTrackedBlob(filePath);
    assertUtf8(filePath, content, errors);
    assertLfOnly(filePath, content, errors);
  }

  if (errors.length > 0) {
    console.error("Encoding check failed:");
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log(`Encoding check passed for ${files.length} tracked text files.`);
}

main();
