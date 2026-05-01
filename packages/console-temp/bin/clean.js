#!/usr/bin/env node
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, extname } from 'node:path';
import { cwd } from 'node:process';

const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mts', '.cts', '.mjs', '.cjs']);
const IGNORE_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.turbo', '.next', 'out']);

function walkDir(dir, files = []) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (IGNORE_DIRS.has(entry.name)) continue;
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
            walkDir(fullPath, files);
        } else if (EXTENSIONS.has(extname(entry.name))) {
            files.push(fullPath);
        }
    }
    return files;
}

function removeConsoleTempCalls(content) {
    const lines = content.split('\n');
    const result = [];
    let inTempCall = false;
    let depth = 0;
    let modified = false;

    for (const line of lines) {
        if (!inTempCall) {
            const idx = line.indexOf('console.temp(');
            if (idx === -1) {
                result.push(line);
                continue;
            }

            const beforeCall = line.slice(0, idx);
            const isStandaloneLine = /^\s*$/.test(beforeCall);

            // Count paren depth starting from the opening paren of console
            let d = 0;
            let j = idx + 'console.temp'.length;
            for (; j < line.length; j++) {
                if (line[j] === '(') d++;
                else if (line[j] === ')') {
                    d--;
                    if (d === 0) break;
                }
            }

            modified = true;

            if (d === 0) {
                // Call closed on the same line
                if (isStandaloneLine) {
                    // Whole line is just this call — drop it
                    continue;
                }
                // Inline: remove the console.tem portion plus optional trailing semicolon
                const afterClosingParen = line.slice(j + 1).replace(/^;?\s*/, '');
                const cleaned = (beforeCall + afterClosingParen).trimEnd();
                if (cleaned.trim() !== '') result.push(cleaned);
            } else {
                // Multi-line call — start tracking
                inTempCall = true;
                depth = d;
                if (!isStandaloneLine) {
                    // Keep the part of the line before the call
                    const trimmed = beforeCall.trimEnd();
                    if (trimmed) result.push(trimmed);
                }
            }
        } else {
            // Inside a multi-line console — scan until depth hits 0
            for (const char of line) {
                if (char === '(') depth++;
                else if (char === ')') {
                    depth--;
                    if (depth === 0) {
                        inTempCall = false;
                        break;
                    }
                }
            }
            // Drop this line
        }
    }

    return { content: result.join('\n'), modified };
}

function cleanFile(filePath) {
    const raw = readFileSync(filePath, 'utf-8');
    console.log();
    const { content, modified } = removeConsoleTempCalls(raw);
    if (modified) {
        writeFileSync(filePath, content, 'utf-8');
        return true;
    }
    return false;
}

const args = process.argv.slice(2);
const targets = args.length > 0 ? args : null;

const files = targets
    ? targets.filter(t => {
          try {
              return statSync(t).isFile() && EXTENSIONS.has(extname(t));
          } catch {
              return false;
          }
      })
    : walkDir(cwd());

const rootDir = cwd();
let count = 0;

console.log('files', rootDir, files);

for (const file of files) {
    if (cleanFile(file)) {
        console.log(`cleaned: ${relative(rootDir, file)}`);
        count++;
    }
}

if (count > 0) {
    console.log(`\ndone — removed console.temp calls from ${count} file(s)`);
} else {
    console.log('no console.temp calls found');
}
