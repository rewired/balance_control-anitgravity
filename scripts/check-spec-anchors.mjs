import fs from 'node:fs';
import path from 'node:path';

const PACKAGES_DIR = path.resolve('packages');
const ANCHORS_JSON_PATH = path.resolve('packages/rules/src/spec-anchors.generated.json');

// 1. Load spec-anchors.generated.json
if (!fs.existsSync(ANCHORS_JSON_PATH)) {
    console.error(`Error: Anchors file not found at ${ANCHORS_JSON_PATH}`);
    process.exit(1);
}

const anchorsData = JSON.parse(fs.readFileSync(ANCHORS_JSON_PATH, 'utf8'));
const validAnchors = new Set(anchorsData.anchors.map(a => a.id));

let findings = [];

function getAllFiles(dirPath, arrayOfFiles = []) {
    const files = fs.readdirSync(dirPath);

    files.forEach((file) => {
        const fullPath = path.join(dirPath, file);
        const stat = fs.lstatSync(fullPath);
        if (stat.isDirectory()) {
            // exclude: **/dist/**, **/build/**, **/.turbo/**, **/node_modules/**
            if (file !== 'node_modules' && file !== 'dist' && file !== 'build' && file !== '.turbo' && !file.startsWith('.')) {
                getAllFiles(fullPath, arrayOfFiles);
            }
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            arrayOfFiles.push(fullPath);
        }
    });

    return arrayOfFiles;
}

// Rule IDs can contain letters, numbers, dashes, and dots.
// Prefixes: CORE, EXP, ADD56, VAR
const RULE_ID_PATTERN = /((?:CORE|EXP|ADD56|VAR)-[0-9A-Z.-]+)/g;

const files = getAllFiles(PACKAGES_DIR);

for (const file of files) {
    const relativePath = path.relative(process.cwd(), file);
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, lineIdx) => {
        // Only look for rule references in lines that look like they contain comments or TSDoc
        if (!line.includes('//') && !line.includes('*') && !line.includes('@rule')) return;

        let match;
        RULE_ID_PATTERN.lastIndex = 0;
        while ((match = RULE_ID_PATTERN.exec(line)) !== null) {
            const anchor = match[1];

            // Trim trailing dots or dashes that might have been caught by the regex but are not part of the ID
            // (e.g. in "CORE-01. " or "CORE-01-")
            let trimmedAnchor = anchor;
            while (trimmedAnchor.length > 0 && (trimmedAnchor.endsWith('.') || trimmedAnchor.endsWith('-'))) {
                trimmedAnchor = trimmedAnchor.slice(0, -1);
            }

            if (trimmedAnchor && !validAnchors.has(trimmedAnchor)) {
                findings.push({
                    file: relativePath,
                    line: lineIdx + 1,
                    col: match.index + 1,
                    anchor: trimmedAnchor,
                    context: line.trim()
                });
            }
        }
    });
}

// Sort findings deterministically (file path, then line, then col)
findings.sort((a, b) => {
    if (a.file !== b.file) return a.file.localeCompare(b.file);
    if (a.line !== b.line) return a.line - b.line;
    return a.col - b.col;
});

if (findings.length > 0) {
    console.error(`Found ${findings.length} invalid rule references:\n`);
    findings.forEach(f => {
        console.error(`${f.file}:${f.line}:${f.col} - Invalid anchor: "${f.anchor}"`);
        console.error(`  Context: ${f.context}\n`);
    });
    // Exit with non-zero code to fail CI/lint if violations exist
    process.exit(1);
} else {
    console.log('No invalid rule references found.');
    process.exit(0);
}
