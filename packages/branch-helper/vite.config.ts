import { readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { definePackageConfig } from '../../build/vite.package.config.ts';

const packageRoot = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'));

export default definePackageConfig({
    packageRoot,
    pkg,
    entries: {
        command: {
            input: 'src/command.ts',
            shebang: '#!/usr/bin/env node'
        }
    }
});
