#!/usr/bin/env node
import { select } from '@inquirer/prompts';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import fse from 'fs-extra';

type Formatter = 'prettier' | 'oxfmt';

const packageRoot = dirname(fileURLToPath(import.meta.url));

const fmtPackage = await select<Formatter>({
    message: 'Select a package manager',
    choices: [
        { name: 'prettier', value: 'prettier' },
        { name: 'oxfmt', value: 'oxfmt' }
    ],
    default: 'prettier'
});

switch (fmtPackage) {
    case 'prettier':
        await initPrettier();
        break;
    case 'oxfmt':
        await initOxfmt();
        break;
    default:
        const _: never = fmtPackage;
        process.exit(1);
}

async function initPrettier() {
    const fileName = '.prettierrc';
    const srcPath = join(packageRoot, `../template/${fileName}`);
    const distPath = join(process.cwd(), fileName);
    const content = await readFile(srcPath, 'utf-8');
    await writeFile(distPath, content);
    await addDevDependencies('prettier', '^3.8.3');
    await addSetting('prettier');
}

async function initOxfmt() {
    const fileName = '.oxfmtrc.json';
    const srcPath = join(packageRoot, `../template/${fileName}`);
    const distPath = join(process.cwd(), fileName);
    const content = await readFile(srcPath, 'utf-8');
    await writeFile(distPath, content);
    await addDevDependencies('oxfmt', '^0.47.0');
    await addSetting('oxfmt');
}

async function addDevDependencies(plugin: Formatter, version: string) {
    const packageJsonPath = join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'));
    packageJson.devDependencies = {
        ...packageJson.devDependencies,
        [plugin]: version
    };
    await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
    await addSetting(plugin);
}

async function addSetting(plugin: Formatter) {
    const settingPath = join(process.cwd(), '.vscode/settings.json');
    await fse.ensureFile(settingPath);
    const jsonContent = await fse.readJSON(settingPath).catch(() => ({}));
    if (plugin === 'prettier') {
        jsonContent['editor.defaultFormatter'] = 'esbenp.prettier-vscode';
    }
    if (plugin === 'oxfmt') {
        jsonContent['oxc.fmt.configPath'] = '.oxfmtrc.json';
        jsonContent['editor.defaultFormatter'] = 'oxc.oxc-vscode';
    }
    jsonContent['editor.formatOnSave'] = true;
    await fse.outputJSON(settingPath, jsonContent, {
        spaces: '\t'
    });
}
