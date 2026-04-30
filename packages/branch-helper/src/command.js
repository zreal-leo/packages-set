#! /usr/bin/env node
import { Command } from 'commander';
import { prompt } from './index.js';
import { readJsonSync } from 'fs-extra/esm';
const program = new Command();

const pkgPath = new URL('../package.json', import.meta.url);
const pkg = readJsonSync(pkgPath);
const { name, version, description } = pkg;
program.name(name).version(version).description(description);

program
    .command('create')
    .description('create new branch')
    .requiredOption('-S, --source <string>', 'Specify the source branch for creating a new branch')
    .action(options => {
        prompt(options.source);
    });

program.parse();
