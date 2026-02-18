import fs from 'node:fs';
import path from 'node:path';

const PACKAGES_DIR = path.resolve('packages');
const GAME_SRC_DIR = path.resolve('packages/game/src');

let failCount = 0;

function logFail(file, message) {
    console.error(`FAIL: ${file}: ${message}`);
    failCount++;
}

function getAllFiles(dirPath, arrayOfFiles = []) {
    const files = fs.readdirSync(dirPath);

    files.forEach((file) => {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== 'dist' && file !== 'test' && !file.startsWith('.')) {
                getAllFiles(fullPath, arrayOfFiles);
            }
        } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.mjs')) {
            arrayOfFiles.push(fullPath);
        }
    });

    return arrayOfFiles;
}

function checkMathRandom() {
    console.log('Checking for Math.random()...');
    const files = getAllFiles(PACKAGES_DIR);
    for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n');
        lines.forEach((line, i) => {
            if (line.includes('Math.random(')) {
                logFail(path.relative(process.cwd(), file), `Line ${i + 1} contains Math.random()`);
            }
        });
    }
}

function findTsDocAbove(content, index) {
    const textBefore = content.substring(0, index);
    const lastDocEnd = textBefore.lastIndexOf('*/');
    if (lastDocEnd === -1) return null;

    const gap = textBefore.substring(lastDocEnd + 2);
    if (/^\s*$/.test(gap)) {
        const docStart = textBefore.lastIndexOf('/**', lastDocEnd);
        if (docStart === -1) return null;
        return content.substring(docStart, lastDocEnd + 2);
    }

    const lines = gap.split('\n');
    if (lines.length < 5) {
        const docStart = textBefore.lastIndexOf('/**', lastDocEnd);
        if (docStart !== -1) {
             return content.substring(docStart, lastDocEnd + 2);
        }
    }

    return null;
}

function getNearestTsDoc(content, index) {
    const textBefore = content.substring(0, index);
    const lastDocEnd = textBefore.lastIndexOf('*/');
    if (lastDocEnd === -1) return null;

    const docStart = textBefore.lastIndexOf('/**', lastDocEnd);
    if (docStart === -1) return null;

    return content.substring(docStart, lastDocEnd + 2);
}

function isInsideComment(content, index) {
    const textBefore = content.substring(0, index);
    const lastDocStart = textBefore.lastIndexOf('/*');
    const lastDocEnd = textBefore.lastIndexOf('*/');
    if (lastDocStart > lastDocEnd) return true;

    const lastLineStart = textBefore.lastIndexOf('\n');
    const line = textBefore.substring(lastLineStart + 1);
    if (line.trim().startsWith('//')) return true;

    return false;
}

function verifyGameDocs() {
    console.log('Verifying packages/game/src documentation...');
    const gameFiles = getAllFiles(GAME_SRC_DIR);
    const rngPatterns = [
        /\b(?:ctx\.)?random\b/,
        /\bRNG\b/,
        /\bnextInt\b/,
        /\bshuffle\b/,
        /\.Die\b/
    ];
    const exportFunctionPattern = /export\s+(?:async\s+)?function\s+(\w+)/g;
    const exportConstPattern = /export\s+const\s+(\w+)\s*=\s*(?:async\s*)?\(/g;

    const INFRA_REMARKS_REGEX = /infrastructure;\s*no\s*direct\s*SPEC\s*binding/i;

    for (const file of gameFiles) {
        const relativePath = path.relative(process.cwd(), file);
        const content = fs.readFileSync(file, 'utf8');

        // Check RNG usage
        rngPatterns.forEach(pattern => {
            let match;
            const regex = new RegExp(pattern, 'g');
            while ((match = regex.exec(content)) !== null) {
                if (isInsideComment(content, match.index)) continue;
                if (content.substring(match.index - 1, match.index) === '@') continue;

                const doc = getNearestTsDoc(content, match.index);
                if (!doc || !doc.includes('@usesRNG') || !doc.includes('@rule CORE-01-03-02A')) {
                    const line = content.substring(0, match.index).split('\n').length;
                    logFail(relativePath, `Line ${line} uses RNG (${match[0]}) but missing @usesRNG and @rule CORE-01-03-02A in TSDoc`);
                }
            }
        });

        const checkExport = (match, name, index) => {
            const doc = findTsDocAbove(content, index);
            if (!doc) {
                logFail(relativePath, `Exported function "${name}" is missing TSDoc`);
                return;
            }

            const hasRule = doc.includes('@rule');
            const hasInfra = INFRA_REMARKS_REGEX.test(doc);

            if (!hasRule && !hasInfra) {
                logFail(relativePath, `Exported function "${name}" must have @rule tag OR @remarks "infrastructure; no direct SPEC binding"`);
            }
            if (!doc.includes('@deterministic')) {
                logFail(relativePath, `Exported function "${name}" is missing @deterministic tag`);
            }
            const hasPure = doc.includes('@pure');
            const hasSideEffects = doc.includes('@sideEffects');
            if (!(hasPure ^ hasSideEffects)) {
                logFail(relativePath, `Exported function "${name}" must have exactly one of @pure or @sideEffects`);
            }
        };

        let match;
        while ((match = exportFunctionPattern.exec(content)) !== null) {
            checkExport(match, match[1], match.index);
        }
        while ((match = exportConstPattern.exec(content)) !== null) {
            checkExport(match, match[1], match.index);
        }
    }
}

console.log('Starting verification...');
checkMathRandom();
verifyGameDocs();

if (failCount > 0) {
    console.error(`\nVerification failed with ${failCount} errors.`);
    process.exit(1);
} else {
    console.log('\nVerification passed!');
    process.exit(0);
}
