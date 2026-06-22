#! /usr/bin/env node
import { Command } from 'commander';
import { prompt } from './index.js';
import pkg from '../package.json' with { type: 'json' };

type CreateOptions = {
    source: string;
};

const program = new Command();

const { name, version, description } = pkg;
program.name(name).version(version).description(description);

program
    .command('create')
    .description('create new branch')
    .requiredOption('-S, --source <string>', 'Specify the source branch for creating a new branch')
    .action(async (options: CreateOptions) => {
        await prompt(options.source);
    });

await program.parseAsync();
