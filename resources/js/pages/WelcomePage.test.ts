import { mount, flushPromises } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { createMemoryHistory, createRouter, RouterView } from 'vue-router';
import AuthProvider from '@/auth/AuthProvider.vue';
import { useAuth } from '@/auth/use-auth';
import WelcomePage from '@/pages/WelcomePage.vue';
import type { User } from '@/types';

vi.mock('@/lib/auth-api', () => ({
    fetchCurrentUser: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    requestPasswordReset: vi.fn(),
    resetPassword: vi.fn(),
    resendVerificationEmail: vi.fn(),
    confirmPassword: vi.fn(),
    submitTwoFactorChallenge: vi.fn(),
}));

import { fetchCurrentUser } from '@/lib/auth-api';

const mockedFetchCurrentUser = vi.mocked(fetchCurrentUser);

const verifiedUser: User = {
    id: 1,
    name: 'Jane Doe',
    email: 'jane@example.com',
    email_verified_at: '2026-01-01T00:00:00+00:00',
};

const AuthReadyShell = defineComponent({
    setup() {
        const { isLoading } = useAuth();

        return () => (isLoading.value ? null : h(RouterView));
    },
});

async function mountWelcome(user: User | null = null) {
    mockedFetchCurrentUser.mockResolvedValue(user);

    const router = createRouter({
        history: createMemoryHistory(),
        routes: [
            {
                path: '/',
                component: AuthReadyShell,
                children: [
                    {
                        path: '',
                        component: WelcomePage,
                    },
                    {
                        path: 'login',
                        component: defineComponent({
                            template: '<div>Login ready</div>',
                        }),
                    },
                    {
                        path: 'register',
                        component: defineComponent({
                            template: '<div>Register ready</div>',
                        }),
                    },
                    {
                        path: 'dashboard',
                        component: defineComponent({
                            template: '<div>Dashboard ready</div>',
                        }),
                    },
                ],
            },
        ],
    });

    await router.push('/');
    await router.isReady();

    const wrapper = mount(
        defineComponent({
            components: { AuthProvider, RouterView },
            template: '<AuthProvider><RouterView /></AuthProvider>',
        }),
        {
            global: {
                plugins: [router],
            },
        },
    );

    await flushPromises();

    return { wrapper, router };
}

describe('WelcomePage', () => {
    beforeEach(() => {
        mockedFetchCurrentUser.mockReset();
    });

    it('shows Log in and Register for guests without stale phase copy', async () => {
        const { wrapper } = await mountWelcome(null);

        expect(wrapper.text()).toContain('Laravel Vue SPA Starter Kit');
        expect(wrapper.text()).toContain('Log in');
        expect(wrapper.text()).toContain('Register');
        expect(wrapper.text()).not.toContain('Dashboard');
        expect(wrapper.text()).not.toContain('Phase 1');
        expect(wrapper.text()).not.toContain('architecture proof');
        expect(wrapper.text()).not.toContain('UI parity');

        const loginLink = wrapper.find('a[href="/login"]');
        const registerLink = wrapper.find('a[href="/register"]');

        expect(loginLink.exists()).toBe(true);
        expect(registerLink.exists()).toBe(true);
        expect(mockedFetchCurrentUser).toHaveBeenCalledTimes(1);
    });

    it('shows Dashboard for authenticated users and keeps a single bootstrap user fetch', async () => {
        const { wrapper } = await mountWelcome(verifiedUser);

        expect(wrapper.text()).toContain('Dashboard');
        expect(wrapper.text()).not.toContain('Log in');
        expect(wrapper.text()).not.toContain('Register');

        const dashboardLink = wrapper.find('a[href="/dashboard"]');

        expect(dashboardLink.exists()).toBe(true);
        expect(mockedFetchCurrentUser).toHaveBeenCalledTimes(1);
    });

    it('points documentation at the project repository README', async () => {
        const { wrapper } = await mountWelcome(null);

        const docsLink = wrapper.find(
            'a[href="https://github.com/muradyanvano/laravel-vue-spa-starter-kit#readme"]',
        );

        expect(docsLink.exists()).toBe(true);
        expect(docsLink.text()).toContain('Documentation');
    });
});
