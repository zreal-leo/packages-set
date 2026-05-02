#!/usr/bin/env node
import { select } from '@inquirer/prompts';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import fse from 'fs-extra';

const packageRoot = dirname(fileURLToPath(import.meta.url));

const fmtPackage = await select({
    message: 'Select a package manager',
    choices: [
        { name: 'prettier', value: 'prettier' },
        { name: 'oxfmt', value: 'oxfmt' }
    ],
    default: 'oxfmt'
});

switch (fmtPackage) {
    case 'prettier':
        await initPrettier();
        break;
    case 'oxfmt':
        await initOxfmt();
        break;
}

async function initPrettier() {
    const fileName = '.prettierrc.js';
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

async function addDevDependencies(plugin, version) {
    const packageJsonPath = join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'));
    packageJson.devDependencies = {
        ...packageJson.devDependencies,
        [plugin]: version
    };
    await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
    addSetting(plugin);
}

async function addSetting(plugin) {
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
    fse.outputJSON(settingPath, jsonContent, {
        spaces: '\t'
    });
}
