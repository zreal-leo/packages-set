#! /usr/bin/env node
import { input } from '@inquirer/prompts';
import { to } from 'await-to-js';
import chalk from 'chalk';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { $ } from 'zx/core';

type BranchLogEntry = {
    branchName: string;
    branchDesc: string;
    createTime: string;
};

const successLog = (msg: string) => console.log(chalk.green(msg));
const errorLog = (msg: string) => console.log(chalk.red(msg));

export async function prompt(sourceBranch: string) {
    const branchName = (
        await input({
            message: 'Please enter branch name',
            validate: (value: string) => {
                return value.trim() ? true : '分支名不能为空';
            }
        })
    ).trim();

    const branchDesc = (await input({ message: 'Please enter branch description' })).trim();
    await createBranch(branchName, sourceBranch);
    await writeLog({ branchName, branchDesc });
    successLog(`Branch ${branchName} created successfully`);
}

async function createBranch(branchName: string, sourceBranch: string) {
    await $`git checkout -b ${branchName} origin/${sourceBranch}`;
}

async function readLog(filePath: string): Promise<BranchLogEntry[]> {
    const [err, content = ''] = await to(readFile(filePath, 'utf-8'));
    if (err || !content.trim()) return [];
    return JSON.parse(content) as BranchLogEntry[];
}

async function writeLog({
    branchName,
    branchDesc
}: Pick<BranchLogEntry, 'branchName' | 'branchDesc'>) {
    const fileName = 'branch.log';
    const filePath = path.join(process.cwd(), fileName);
    const content = await readLog(filePath);

    const newContent: BranchLogEntry[] = [
        {
            branchName,
            branchDesc,
            createTime: new Date().toLocaleString()
        },
        ...content
    ];
    const [err2] = await to(writeFile(filePath, JSON.stringify(newContent, null, 4)));

    if (err2) {
        errorLog('信息记录失败');
        process.exit(1);
    }
    successLog(`信息记录成功: ${fileName}`);
}
