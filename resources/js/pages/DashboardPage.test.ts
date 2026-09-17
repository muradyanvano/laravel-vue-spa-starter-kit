import { mount, flushPromises } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { RouterView } from 'vue-router';
import AuthProvider from '@/auth/AuthProvider.vue';
import { useAuth } from '@/auth/use-auth';
import DashboardPage from '@/pages/DashboardPage.vue';
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

vi.mock('@/lib/settings-api', () => ({
    updateProfile: vi.fn(),
    updatePassword: vi.fn(),
    deleteAccount: vi.fn(),
    fetchSecuritySettings: vi.fn(),
    fetchPasswordConfirmationStatus: vi.fn(),
    fetchRecoveryCodes: vi.fn(),
    enableTwoFactor: vi.fn(),
    disableTwoFactor: vi.fn(),
    confirmTwoFactor: vi.fn(),
    fetchTwoFactorQrCode: vi.fn(),
    fetchTwoFactorSecretKey: vi.fn(),
    regenerateRecoveryCodes: vi.fn(),
}));

import { fetchCurrentUser } from '@/lib/auth-api';
import * as settingsApi from '@/lib/settings-api';

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

async function mountDashboard() {
    mockedFetchCurrentUser.mockResolvedValue(verifiedUser);

    const router = createSpaTestRouter({
        shell: AuthReadyShell,
        children: [
            {
                path: 'dashboard',
                component: DashboardPage,
            },
        ],
    });

    await router.push('/dashboard');
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

describe('DashboardPage', () => {
    beforeEach(() => {
        mockedFetchCurrentUser.mockReset();

        for (const value of Object.values(settingsApi)) {
            if (typeof value === 'function' && 'mockReset' in value) {
                (value as ReturnType<typeof vi.fn>).mockReset();
            }
        }
    });

    it('renders within AppLayout without calling settings-api or refreshing beyond bootstrap', async () => {
        const { wrapper } = await mountDashboard();

        expect(wrapper.find('[data-slot="sidebar-wrapper"]').exists()).toBe(
            true,
        );
        expect(document.title).toContain('Dashboard');
        expect(mockedFetchCurrentUser).toHaveBeenCalledTimes(1);

        for (const [name, value] of Object.entries(settingsApi)) {
            if (typeof value === 'function' && 'mock' in value) {
                expect(
                    value,
                    `settings-api.${name} should not be called`,
                ).not.toHaveBeenCalled();
            }
        }
    });
});
