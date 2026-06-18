import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { builtinModules } from 'node:module';
import { dirname, relative, resolve } from 'node:path';
import { defineConfig, type Plugin, type UserConfig } from 'vite';

type PackageJson = {
    dependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
};

type PackageEntryOptions = {
    input: string;
    shebang?: string;
};

type PackageEntry = string | PackageEntryOptions;

type NormalizedPackageEntry = {
    input: string;
    shebang?: string;
};

type DefinePackageConfigOptions = {
    entries: Record<string, PackageEntry>;
    packageRoot?: string;
    pkg?: PackageJson;
};

const builtins = new Set([...builtinModules, ...builtinModules.map(name => `node:${name}`)]);

function toRootRelativeName(packageRoot: string, entryPath: string) {
    const parsed = relative(packageRoot, entryPath).replace(/\.[cm]?[jt]s$/, '');
    const name = parsed.replace(/^src\//, '').replace(/^bin\//, '');
    return name === 'index' ? 'index' : name;
}

function collectExternalDependencies(pkg: PackageJson) {
    return new Set([
        ...Object.keys(pkg.dependencies ?? {}),
        ...Object.keys(pkg.peerDependencies ?? {})
    ]);
}

function isExternal(id: string, externalDependencies: Set<string>) {
    if (builtins.has(id)) return true;
    return [...externalDependencies].some(dep => id === dep || id.startsWith(`${dep}/`));
}

function shebangPlugin(entries: Record<string, NormalizedPackageEntry>): Plugin {
    const shebangByName = new Map<string, string>();

    for (const [name, options] of Object.entries(entries)) {
        if (options.shebang) {
            shebangByName.set(name, options.shebang);
        }
    }

    return {
        name: 'package-cli-shebang',
        renderChunk(code, chunk) {
            const shebang = shebangByName.get(chunk.name);
            if (!shebang || code.startsWith('#!')) return null;

            return {
                code: `${shebang}\n${code}`,
                map: null
            };
        }
    };
}

function copyTypesPlugin(
    packageRoot: string,
    entries: Record<string, NormalizedPackageEntry>
): Plugin {
    return {
        name: 'package-copy-types',
        closeBundle() {
            for (const [name, options] of Object.entries(entries)) {
                const source = options.input.replace(/\.[cm]?[jt]s$/, '.d.ts');
                if (!existsSync(source)) continue;

                const target = resolve(packageRoot, 'dist', `${name}.d.ts`);
                mkdirSync(dirname(target), { recursive: true });
                copyFileSync(source, target);
            }
        }
    };
}

export function definePackageConfig({
    entries,
    packageRoot = process.cwd(),
    pkg = {}
}: DefinePackageConfigOptions): UserConfig {
    const normalizedEntries = Object.fromEntries(
        Object.entries(entries).map(([name, options]) => {
            const entry = typeof options === 'string' ? options : options.input;
            const entryPath = resolve(packageRoot, entry);
            const shebang = typeof options === 'string' ? undefined : options.shebang;
            return [name, { input: entryPath, shebang }];
        })
    );
    const input = Object.fromEntries(
        Object.entries(normalizedEntries).map(([name, options]) => [
            name || toRootRelativeName(packageRoot, options.input),
            options.input
        ])
    );
    const externalDependencies = collectExternalDependencies(pkg);

    return defineConfig({
        build: {
            emptyOutDir: true,
            minify: true,
            outDir: resolve(packageRoot, 'dist'),
            rolldownOptions: {
                external: id => isExternal(id, externalDependencies),
                input,
                output: {
                    entryFileNames: '[name].js',
                    format: 'es',
                    preserveModules: false
                }
            },
            sourcemap: false,
            target: 'node22'
        },
        plugins: [shebangPlugin(normalizedEntries), copyTypesPlugin(packageRoot, normalizedEntries)]
    });
}
