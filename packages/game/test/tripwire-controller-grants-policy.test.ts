import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import * as ts from 'typescript';

const ALLOWED_MISSING_CONTROLLER_POLICIES = new Set(['ERROR', 'NOISE', 'SKIP']);
const REQUIRED_PACKAGES = ['game', 'core', 'expansion-01', 'expansion-02', 'expansion-03'];

interface Violation {
    packageName: string;
    modulePath: string;
    line: number;
    column: number;
    stableId: string;
    reason: string;
}

function normalizePath(filePath: string): string {
    return filePath.split(path.sep).join('/');
}

function getRepoRoot(): string {
    const testDir = path.dirname(fileURLToPath(import.meta.url));
    return path.resolve(testDir, '../../..');
}

function walkDir(dirPath: string): string[] {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
        .sort((a, b) => a.name.localeCompare(b.name));
    const files: string[] = [];

    for (const entry of entries) {
        const nextPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
            files.push(...walkDir(nextPath));
            continue;
        }

        if (!entry.isFile()) continue;
        if (!entry.name.endsWith('.ts') || entry.name.endsWith('.d.ts')) continue;
        files.push(nextPath);
    }

    return files;
}

function listSourceFiles(repoRoot: string): string[] {
    const packagesRoot = path.join(repoRoot, 'packages');
    const packageNames = fs.readdirSync(packagesRoot, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort((a, b) => a.localeCompare(b));

    const files: string[] = [];
    for (const packageName of packageNames) {
        const srcDir = path.join(packagesRoot, packageName, 'src');
        if (!fs.existsSync(srcDir)) continue;
        files.push(...walkDir(srcDir));
    }

    return files.sort((a, b) => a.localeCompare(b));
}

function getLiteralText(node: ts.Expression): string | null {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
        return node.text;
    }
    return null;
}

function getPropertyAssignment(node: ts.ObjectLiteralExpression, name: string): ts.PropertyAssignment | null {
    for (const property of node.properties) {
        if (!ts.isPropertyAssignment(property)) continue;
        if (!ts.isIdentifier(property.name) && !ts.isStringLiteral(property.name)) continue;
        const propertyName = ts.isIdentifier(property.name) ? property.name.text : property.name.text;
        if (propertyName === name) {
            return property;
        }
    }

    return null;
}

function isControllerTargetPlayerId(initializer: ts.Expression): boolean {
    const literalText = getLiteralText(initializer);
    if (literalText === 'CONTROLLER') {
        return true;
    }

    if (
        ts.isPropertyAccessExpression(initializer)
        && ts.isIdentifier(initializer.expression)
        && initializer.expression.text === 'payload'
        && initializer.name.text === 'playerId'
    ) {
        return true;
    }

    return false;
}

function findStableId(currentNode: ts.ObjectLiteralExpression, ancestors: ts.Node[]): string {
    const findIdFromObject = (node: ts.ObjectLiteralExpression): string | null => {
        const keys = ['sourceId', 'id', 'measureId'];
        for (const key of keys) {
            const prop = getPropertyAssignment(node, key);
            if (!prop) continue;
            const text = getLiteralText(prop.initializer);
            if (text) {
                return `${key}:${text}`;
            }
        }
        return null;
    };

    const selfId = findIdFromObject(currentNode);
    if (selfId) return selfId;

    for (let i = ancestors.length - 1; i >= 0; i--) {
        const ancestor = ancestors[i];
        if (ts.isCaseClause(ancestor)) {
            const caseText = getLiteralText(ancestor.expression);
            if (caseText) {
                return `measure:${caseText}`;
            }
        }
    }

    for (let i = ancestors.length - 1; i >= 0; i--) {
        const ancestor = ancestors[i];
        if (!ts.isObjectLiteralExpression(ancestor)) continue;
        const objectId = findIdFromObject(ancestor);
        if (objectId) {
            return objectId;
        }
    }

    return 'id:unknown';
}

function parsePackageInfo(filePath: string): { packageName: string; modulePath: string } {
    const normalized = normalizePath(filePath);
    const parts = normalized.split('/');
    const packageIndex = parts.lastIndexOf('packages');

    if (packageIndex < 0 || packageIndex + 1 >= parts.length) {
        return { packageName: 'unknown', modulePath: normalized };
    }

    const packageName = parts[packageIndex + 1];
    const modulePath = parts.slice(packageIndex + 2).join('/');
    return { packageName, modulePath };
}

function collectViolations(filePath: string): Violation[] {
    const sourceText = fs.readFileSync(filePath, 'utf8');
    const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    const { packageName, modulePath } = parsePackageInfo(filePath);
    const violations: Violation[] = [];

    const visit = (node: ts.Node, ancestors: ts.Node[]) => {
        if (ts.isObjectLiteralExpression(node)) {
            const kindProp = getPropertyAssignment(node, 'kind');
            const playerIdProp = getPropertyAssignment(node, 'playerId');
            if (kindProp && playerIdProp) {
                const kindValue = getLiteralText(kindProp.initializer);
                if (kindValue === 'resource.grant' && isControllerTargetPlayerId(playerIdProp.initializer)) {
                    const missingControllerProp = getPropertyAssignment(node, 'missingController');
                    const stableId = findStableId(node, ancestors);
                    const position = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));

                    if (!missingControllerProp) {
                        violations.push({
                            packageName,
                            modulePath,
                            line: position.line + 1,
                            column: position.character + 1,
                            stableId,
                            reason: 'missingController is missing'
                        });
                    } else {
                        const policy = getLiteralText(missingControllerProp.initializer);
                        if (!policy || !ALLOWED_MISSING_CONTROLLER_POLICIES.has(policy)) {
                            violations.push({
                                packageName,
                                modulePath,
                                line: position.line + 1,
                                column: position.character + 1,
                                stableId,
                                reason: `missingController must be one of ERROR|NOISE|SKIP (received ${policy ?? 'non-literal'})`
                            });
                        }
                    }
                }
            }
        }

        ts.forEachChild(node, (child) => visit(child, [...ancestors, node]));
    };

    visit(sourceFile, []);
    return violations;
}

function formatViolations(violations: Violation[]): string {
    const lines = violations.map((violation) => (
        `- [${violation.packageName}] ${violation.modulePath}:${violation.line}:${violation.column} `
        + `(${violation.stableId}) ${violation.reason}; `
        + `fix: add missingController: 'SKIP' (default) unless rule requires NOISE/ERROR`
    ));

    return [
        'Tripwire violation: CONTROLLER-targeted resource.grant atoms must declare missingController.',
        ...lines
    ].join('\n');
}

describe('Tripwire: CONTROLLER grant policy', () => {
    it('enforces explicit missingController policy across core and expansions', () => {
        const repoRoot = getRepoRoot();
        const sourceFiles = listSourceFiles(repoRoot);
        const scannedPackages = new Set<string>();
        const violations: Violation[] = [];

        for (const sourceFile of sourceFiles) {
            const { packageName } = parsePackageInfo(sourceFile);
            scannedPackages.add(packageName);
            violations.push(...collectViolations(sourceFile));
        }

        for (const packageName of REQUIRED_PACKAGES) {
            expect(scannedPackages.has(packageName)).toBe(true);
        }

        const sortedViolations = [...violations].sort((a, b) => {
            const aKey = `${a.packageName}:${a.modulePath}:${a.line}:${a.column}`;
            const bKey = `${b.packageName}:${b.modulePath}:${b.line}:${b.column}`;
            return aKey.localeCompare(bKey);
        });

        if (sortedViolations.length > 0) {
            throw new Error(formatViolations(sortedViolations));
        }

        expect(sortedViolations).toEqual([]);
    });
});
