#! /usr/bin/env node
import { input } from '@inquirer/prompts';
import { to } from 'await-to-js';
import chalk from 'chalk';
import { spawn } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

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

function spawnGit(args: string[]): Promise<number | null> {
    return new Promise((resolve, reject) => {
        const child = spawn('git', args, { stdio: 'inherit' });
        child.on('error', reject);
        child.on('close', resolve);
    });
}

async function createBranch(branchName: string, sourceBranch: string) {
    const code = await spawnGit(['checkout', '-b', branchName, `origin/${sourceBranch}`]);
    if (code !== 0) {
        throw new Error(`git checkout failed${code === null ? '' : ` (exit ${code})`}`);
    }
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
