import { defineComponent, h, type Component } from 'vue';
import {
    createMemoryHistory,
    createRouter,
    type RouteRecordRaw,
    type Router,
    RouterView,
} from 'vue-router';

/**
 * Minimal page stub for destinations that appear as RouterLink targets in
 * auth layouts / app shell / settings nav, but are not under test.
 */
export const TestStubPage = defineComponent({
    name: 'TestStubPage',
    setup: () => () => h('div'),
});

/**
 * Relative child paths that match production SPA destinations commonly linked
 * from shared chrome (AuthSimpleLayout, AppSidebar, settings Layout, TextLink).
 */
export const spaLinkChildPaths = [
    '',
    'login',
    'register',
    'forgot-password',
    'reset-password/:token',
    'two-factor-challenge',
    'verify-email',
    'confirm-password',
    'dashboard',
    'settings/profile',
    'settings/security',
    'settings/appearance',
] as const;

/**
 * Merge page-specific children with stubs for common SPA link targets.
 * Explicit children win on path collision so the page under test stays real.
 */
export function withSpaLinkStubs(
    children: RouteRecordRaw[],
    stub: Component = TestStubPage,
): RouteRecordRaw[] {
    const byPath = new Map<string, RouteRecordRaw>();

    for (const path of spaLinkChildPaths) {
        byPath.set(path, { path, component: stub });
    }

    for (const child of children) {
        if (typeof child.path === 'string') {
            byPath.set(child.path, child);
        }
    }

    return [...byPath.values()];
}

type CreateSpaTestRouterOptions = {
    children: RouteRecordRaw[];
    /** Parent shell for nested children (defaults to a plain RouterView host). */
    shell?: Component;
};

/**
 * Memory router with a `/` shell and stubbed SPA link destinations.
 * Does not import production guards, AuthProvider, or AppShell.
 */
export function createSpaTestRouter(
    options: CreateSpaTestRouterOptions,
): Router {
    const shell =
        options.shell ??
        defineComponent({
            name: 'TestRouterShell',
            setup: () => () => h(RouterView),
        });

    return createRouter({
        history: createMemoryHistory(),
        routes: [
            {
                path: '/',
                component: shell,
                children: withSpaLinkStubs(options.children),
            },
        ],
    });
}
