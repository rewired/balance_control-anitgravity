#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const UTF8_BOM = Buffer.from([0xef, 0xbb, 0xbf]);
const UTF16_LE_BOM = Buffer.from([0xff, 0xfe]);
const UTF16_BE_BOM = Buffer.from([0xfe, 0xff]);
const UTF32_LE_BOM = Buffer.from([0xff, 0xfe, 0x00, 0x00]);
const UTF32_BE_BOM = Buffer.from([0x00, 0x00, 0xfe, 0xff]);
const CRLF = Buffer.from("\r\n");
const NULL_BYTE = 0x00;

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

function safeRatio(numerator, denominator) {
  if (denominator === 0) {
    return 0;
  }

  return numerator / denominator;
}

function detectLikelyUtf16Or32WithoutBom(content) {
  const sample = content.subarray(0, Math.min(content.length, 4096));
  if (sample.length < 4) {
    return null;
  }

  let zeroCount = 0;
  const zeroByMod2 = [0, 0];
  const countByMod2 = [0, 0];
  const zeroByMod4 = [0, 0, 0, 0];
  const countByMod4 = [0, 0, 0, 0];

  for (let i = 0; i < sample.length; i += 1) {
    const mod2 = i % 2;
    const mod4 = i % 4;

    countByMod2[mod2] += 1;
    countByMod4[mod4] += 1;

    if (sample[i] === NULL_BYTE) {
      zeroCount += 1;
      zeroByMod2[mod2] += 1;
      zeroByMod4[mod4] += 1;
    }
  }

  if (zeroCount === 0) {
    return null;
  }

  const zeroRatio = safeRatio(zeroCount, sample.length);
  const zeroRatioMod2 = [
    safeRatio(zeroByMod2[0], countByMod2[0]),
    safeRatio(zeroByMod2[1], countByMod2[1]),
  ];
  const zeroRatioMod4 = [
    safeRatio(zeroByMod4[0], countByMod4[0]),
    safeRatio(zeroByMod4[1], countByMod4[1]),
    safeRatio(zeroByMod4[2], countByMod4[2]),
    safeRatio(zeroByMod4[3], countByMod4[3]),
  ];

  const mostlyZero = (ratio) => ratio >= 0.6;
  const mostlyNotZero = (ratio) => ratio <= 0.15;

  if (
    mostlyNotZero(zeroRatioMod4[0]) &&
    mostlyZero(zeroRatioMod4[1]) &&
    mostlyZero(zeroRatioMod4[2]) &&
    mostlyZero(zeroRatioMod4[3])
  ) {
    return "UTF-32LE";
  }

  if (
    mostlyZero(zeroRatioMod4[0]) &&
    mostlyZero(zeroRatioMod4[1]) &&
    mostlyZero(zeroRatioMod4[2]) &&
    mostlyNotZero(zeroRatioMod4[3])
  ) {
    return "UTF-32BE";
  }

  if (zeroRatio >= 0.2 && mostlyNotZero(zeroRatioMod2[0]) && mostlyZero(zeroRatioMod2[1])) {
    return "UTF-16LE";
  }

  if (zeroRatio >= 0.2 && mostlyZero(zeroRatioMod2[0]) && mostlyNotZero(zeroRatioMod2[1])) {
    return "UTF-16BE";
  }

  if (zeroRatio >= 0.3) {
    return "UTF-16/32";
  }

  return null;
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

  const likelyEncoding = detectLikelyUtf16Or32WithoutBom(content);
  if (likelyEncoding) {
    errors.push(`${filePath}: ${likelyEncoding} encoding is not allowed.`);
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
