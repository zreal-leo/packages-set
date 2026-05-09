import fs from 'node:fs';
import path from 'node:path';

export default function (plop) {
    plop.setGenerator('package', {
        description: '在 packages 下新建子包',
        prompts: [
            {
                type: 'input',
                name: 'name',
                message: '子包名称',
                validate: value => {
                    if (!value?.trim()) return '名称不能为空';
                    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(value.trim())) {
                        return '建议使用小写字母、数字、短横线，且不以短横线结尾';
                    }
                    return true;
                },
                filter: v => v.trim()
            },
            {
                type: 'input',
                name: 'description',
                message: 'readme',
                default: ''
            }
        ],
        actions: [
            {
                type: 'addMany',
                destination: 'packages/{{name}}',
                base: 'plop-templates/package',
                templateFiles: 'plop-templates/package/*.hbs',
                stripExtensions: ['hbs'],
                skip: answers => {
                    const pkg = path.join(process.cwd(), 'packages', answers.name, 'package.json');
                    if (fs.existsSync(pkg)) {
                        return `packages/${answers.name} 已存在（发现 package.json），已跳过`;
                    }
                }
            }
        ]
    });
}
