import { mount, flushPromises } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { RouterView } from 'vue-router';
import AuthProvider from '@/auth/AuthProvider.vue';
import { useAuth } from '@/auth/use-auth';
import AppearanceSettingsPage from '@/pages/settings/AppearanceSettingsPage.vue';
import { createSpaTestRouter } from '@/testing/create-test-router';
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

async function mountAppearance() {
    mockedFetchCurrentUser.mockResolvedValue(verifiedUser);
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    document.cookie = 'appearance=; Max-Age=0; path=/';

    const router = createSpaTestRouter({
        shell: AuthReadyShell,
        children: [
            {
                path: 'settings/appearance',
                component: AppearanceSettingsPage,
            },
        ],
    });

    await router.push('/settings/appearance');
    await router.isReady();

    const wrapper = mount(
        defineComponent({
            components: { AuthProvider, RouterView },
            template: '<AuthProvider><RouterView /></AuthProvider>',
        }),
        {
            global: {
                plugins: [router],
                stubs: {
                    NavUser: true,
                },
            },
        },
    );

    await flushPromises();

    return { wrapper };
}

describe('AppearanceSettingsPage', () => {
    beforeEach(() => {
        mockedFetchCurrentUser.mockReset();
    });

    it('renders Light, Dark, and System with aria-pressed', async () => {
        const { wrapper } = await mountAppearance();

        const buttons = wrapper.findAll('button[aria-pressed]');

        expect(buttons).toHaveLength(3);
        expect(buttons.map((button) => button.text().trim())).toEqual([
            'Light',
            'Dark',
            'System',
        ]);

        const pressed = buttons.filter(
            (button) => button.attributes('aria-pressed') === 'true',
        );
        expect(pressed).toHaveLength(1);
    });

    it('updates appearance when a tab is clicked', async () => {
        const { wrapper } = await mountAppearance();

        const darkButton = wrapper
            .findAll('button[aria-pressed]')
            .find((button) => button.text().includes('Dark'));

        expect(darkButton).toBeDefined();
        await darkButton!.trigger('click');
        await nextTick();

        expect(darkButton!.attributes('aria-pressed')).toBe('true');
        expect(localStorage.getItem('appearance')).toBe('dark');
        expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
});
