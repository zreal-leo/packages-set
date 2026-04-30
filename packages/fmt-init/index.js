import { select } from '@inquirer/prompts';
import { copyFile, constants, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import fse from 'fs-extra';

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
        initPrettier();
        break;
    case 'oxfmt':
        initOxfmt();
        break;
}

function initPrettier() {
    const fileName = '.prettierrc.js';
    const srcPath = join(import.meta.dirname, `./template/${fileName}`);
    const distPath = join(process.cwd(), fileName);
    copyFile(srcPath, distPath);
    addDevDependencies('prettier', '^3.8.3');
}
function initOxfmt() {
    const fileName = '.oxfmtrc.json';
    const srcPath = join(import.meta.dirname, `./template/${fileName}`);
    const distPath = join(process.cwd(), fileName);
    copyFile(srcPath, distPath);
    addDevDependencies('oxfmt', '^0.47.0');

    addSetting('oxfmt');
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
