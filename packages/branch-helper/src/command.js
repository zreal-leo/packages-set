#! /usr/bin/env node
import { Command } from 'commander';
import { prompt } from './index.js';
import pkg from '../package.json' with { type: 'json' };
const program = new Command();

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
