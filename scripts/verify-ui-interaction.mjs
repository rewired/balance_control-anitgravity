import fs from 'node:fs';
import path from 'node:path';

const TARGET_DIR = path.resolve('packages/client-web/src/components');

if (!fs.existsSync(TARGET_DIR)) {
    console.error(`Error: Target directory not found at ${TARGET_DIR}`);
    process.exit(1);
}

let findings = [];

function getAllFiles(dirPath, arrayOfFiles = []) {
    const files = fs.readdirSync(dirPath);

    files.forEach((file) => {
        const fullPath = path.join(dirPath, file);
        const stat = fs.lstatSync(fullPath);
        if (stat.isDirectory()) {
            if (file !== 'node_modules' && !file.startsWith('.')) {
                getAllFiles(fullPath, arrayOfFiles);
            }
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            arrayOfFiles.push(fullPath);
        }
    });

    return arrayOfFiles;
}

const PATTERNS = [
    { regex: /dispatchIntent\(/g, name: 'dispatchIntent(' },
    { regex: /\bmoves\./g, name: 'moves.' }
];

const files = getAllFiles(TARGET_DIR);

for (const file of files) {
    const relativePath = path.relative(process.cwd(), file);
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, lineIdx) => {
        PATTERNS.forEach(pattern => {
            let match;
            pattern.regex.lastIndex = 0;
            while ((match = pattern.regex.exec(line)) !== null) {
                findings.push({
                    file: relativePath,
                    line: lineIdx + 1,
                    col: match.index + 1,
                    matchedSnippet: line.trim()
                });
            }
        });
    });
}

// Sort findings deterministically (file path, then line, then col)
findings.sort((a, b) => {
    if (a.file !== b.file) return a.file.localeCompare(b.file);
    if (a.line !== b.line) return a.line - b.line;
    return a.col - b.col;
});

if (findings.length > 0) {
    console.error('UI interaction tripwire failed (ARCH-06)\n');
    findings.forEach(f => {
        console.error(`${f.file}:${f.line}:${f.col} ${f.matchedSnippet}`);
    });
    console.error('\nFix: route commits via useGameInteractionController.confirmDraft()/resolveChoice().');
    process.exit(1);
} else {
    console.log('UI interaction tripwire passed.');
    process.exit(0);
}
