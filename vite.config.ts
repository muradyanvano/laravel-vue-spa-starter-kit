import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import laravel from 'laravel-vite-plugin';
import { bunny } from 'laravel-vite-plugin/fonts';
import { defineConfig, lazyPlugins } from 'vite-plus';

/*
 * Vitest (vp test) resolves this Vite config with a non-build command so it can
 * transform modules. laravel-vite-plugin treats that like the HMR server and
 * refuses to start when CI=true. Production `vp build` uses command "build" and
 * is already allowed. Scope the documented bypass to Vitest only.
 */
if (process.env.VITEST) {
    process.env.LARAVEL_BYPASS_ENV_CHECK ??= '1';
}

/**
 * Node.js 25+ exposes a global `localStorage` without a usable Storage API unless
 * `--localstorage-file` points at a real file. Vitest/jsdom then skip installing
 * their own implementation, so `localStorage.clear` is not a function. Disable
 * Node's incomplete Web Storage for the test worker so jsdom can own localStorage.
 */
function vitestNodeExecArgv(): string[] {
    const major = Number.parseInt(
        process.versions.node.split('.')[0] ?? '0',
        10,
    );

    return major >= 25 ? ['--no-webstorage'] : [];
}

export default defineConfig({
    plugins: lazyPlugins(() => [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.ts'],
            refresh: true,
            fonts: [
                bunny('Instrument Sans', {
                    weights: [400, 500, 600],
                }),
            ],
        }),
        tailwindcss(),
        vue({
            template: {
                transformAssetUrls: {
                    base: null,
                    includeAbsolute: false,
                },
            },
        }),
        wayfinder({
            formVariants: true,
        }),
    ]),
    test: {
        environment: 'jsdom',
        execArgv: vitestNodeExecArgv(),
        setupFiles: ['resources/js/testing/setup.ts'],
        include: ['resources/js/**/*.{test,spec}.{ts,tsx,vue}'],
    },
    server: {
        watch: {
            ignored: [
                '**/.agents/**',
                '**/.claude/**',
                '**/.cursor/**',
                '**/.junie/**',
                '**/vendor/**',
            ],
        },
    },
    lint: {
        ignorePatterns: [
            'vendor/**',
            'node_modules/**',
            'public/**',
            'bootstrap/ssr/**',
            'tailwind.config.js',
            'resources/js/actions/**',
            'resources/js/components/ui/*',
            'resources/js/routes/**',
            'resources/js/wayfinder/**',
        ],
        options: {
            denyWarnings: true,
            typeAware: true,
        },
    },
    fmt: {
        printWidth: 80,
        tabWidth: 4,
        singleQuote: true,
        semi: true,
        singleAttributePerLine: false,
        htmlWhitespaceSensitivity: 'css',
        ignorePatterns: [
            '.github/**',
            'composer.json',
            'resources/js/components/ui/*',
            'resources/views/mail/*',
        ],
        sortTailwindcss: {
            functions: ['clsx', 'cn', 'cva'],
            entryPoint: 'resources/css/app.css',
        },
    },
});
