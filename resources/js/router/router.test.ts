import { router } from '@/router';
import { describe, expect, it } from 'vitest';

describe('vue router architecture', () => {
    it('registers core spa routes without lazy/async components', () => {
        const names = router.getRoutes().map((route) => route.name);

        expect(names).toContain('home');
        expect(names).toContain('dashboard');
        expect(names).toContain('login');
        expect(names).toContain('register');
        expect(names).toContain('settings.profile');
        expect(names).toContain('settings.security');
        expect(names).toContain('settings.appearance');

        for (const route of router.getRoutes()) {
            if (!route.components) {
                continue;
            }

            for (const component of Object.values(route.components)) {
                expect(typeof component).not.toBe('function');
            }
        }
    });

    it('redirects legacy settings password and two-factor paths to security', () => {
        const routes = router.getRoutes();

        expect(
            routes.find((route) => route.path === '/settings/password')
                ?.redirect,
        ).toBe('/settings/security');
        expect(
            routes.find((route) => route.path === '/settings/two-factor')
                ?.redirect,
        ).toBe('/settings/security');
        expect(
            routes.find((route) => route.path === '/settings')?.redirect,
        ).toBe('/settings/profile');
    });
});
