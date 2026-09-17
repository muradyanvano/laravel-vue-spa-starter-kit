import { mount, flushPromises } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { RouterView } from 'vue-router';
import AuthProvider from '@/auth/AuthProvider.vue';
import { useAuth } from '@/auth/use-auth';
import SecuritySettingsPage from '@/pages/settings/SecuritySettingsPage.vue';
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
    fetchPasswordConfirmationStatus: vi.fn(),
    fetchSecuritySettings: vi.fn(),
    fetchRecoveryCodes: vi.fn(),
    updatePassword: vi.fn(),
    updateProfile: vi.fn(),
    deleteAccount: vi.fn(),
    enableTwoFactor: vi.fn(),
    disableTwoFactor: vi.fn(),
    confirmTwoFactor: vi.fn(),
    fetchTwoFactorQrCode: vi.fn(),
    fetchTwoFactorSecretKey: vi.fn(),
    regenerateRecoveryCodes: vi.fn(),
}));

import { fetchCurrentUser } from '@/lib/auth-api';
import {
    fetchPasswordConfirmationStatus,
    fetchRecoveryCodes,
    fetchSecuritySettings,
} from '@/lib/settings-api';

const mockedFetchCurrentUser = vi.mocked(fetchCurrentUser);
const mockedFetchPasswordConfirmationStatus = vi.mocked(
    fetchPasswordConfirmationStatus,
);
const mockedFetchSecuritySettings = vi.mocked(fetchSecuritySettings);
const mockedFetchRecoveryCodes = vi.mocked(fetchRecoveryCodes);

const verifiedUser: User = {
    id: 1,
    name: 'Jane Doe',
    email: 'jane@example.com',
    email_verified_at: '2026-01-01T00:00:00+00:00',
};

const securitySettings = {
    canManageTwoFactor: true,
    twoFactorEnabled: false,
    requiresConfirmation: true,
    passwordRules: 'minlength: 8;',
};

const AuthReadyShell = defineComponent({
    setup() {
        const { isLoading } = useAuth();

        return () => (isLoading.value ? null : h(RouterView));
    },
});

async function mountSecurity(path = '/settings/security') {
    mockedFetchCurrentUser.mockResolvedValue(verifiedUser);

    const router = createSpaTestRouter({
        shell: AuthReadyShell,
        children: [
            {
                path: 'settings/security',
                component: SecuritySettingsPage,
            },
            {
                path: 'confirm-password',
                component: defineComponent({
                    template: '<div>Confirm password ready</div>',
                }),
            },
        ],
    });

    await router.push(path);
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

    return { wrapper, router };
}

describe('SecuritySettingsPage', () => {
    beforeEach(() => {
        mockedFetchCurrentUser.mockReset();
        mockedFetchPasswordConfirmationStatus.mockReset();
        mockedFetchSecuritySettings.mockReset();
        mockedFetchRecoveryCodes.mockReset();
    });

    it('shows security-skeleton before password controls', async () => {
        let resolveStatus: (value: { confirmed: boolean }) => void = () =>
            undefined;

        mockedFetchPasswordConfirmationStatus.mockImplementation(
            () =>
                new Promise((resolve) => {
                    resolveStatus = resolve;
                }),
        );
        mockedFetchSecuritySettings.mockResolvedValue(securitySettings);

        const { wrapper } = await mountSecurity();

        expect(wrapper.find('[data-testid="security-skeleton"]').exists()).toBe(
            true,
        );
        expect(wrapper.find('#current_password').exists()).toBe(false);
        expect(wrapper.text()).not.toContain('Update password');

        resolveStatus({ confirmed: true });
        await flushPromises();
        await nextTick();

        expect(wrapper.find('[data-testid="security-skeleton"]').exists()).toBe(
            false,
        );
        expect(wrapper.find('#current_password').exists()).toBe(true);
    });

    it('redirects to confirm-password when confirmation status is false without flashing controls', async () => {
        mockedFetchPasswordConfirmationStatus.mockResolvedValue({
            confirmed: false,
        });

        const { wrapper, router } = await mountSecurity();

        expect(router.currentRoute.value.path).toBe('/confirm-password');
        expect(wrapper.find('#current_password').exists()).toBe(false);
        expect(
            wrapper.find('[data-test="update-password-button"]').exists(),
        ).toBe(false);
        expect(wrapper.text()).not.toContain('Update password');
        expect(mockedFetchSecuritySettings).not.toHaveBeenCalled();
        expect(mockedFetchRecoveryCodes).not.toHaveBeenCalled();
    });

    it('when confirmed loads security settings once and never fetches recovery codes', async () => {
        mockedFetchPasswordConfirmationStatus.mockResolvedValue({
            confirmed: true,
        });
        mockedFetchSecuritySettings.mockResolvedValue(securitySettings);

        const { wrapper } = await mountSecurity();

        expect(mockedFetchPasswordConfirmationStatus).toHaveBeenCalledTimes(1);
        expect(mockedFetchSecuritySettings).toHaveBeenCalledTimes(1);
        expect(mockedFetchRecoveryCodes).not.toHaveBeenCalled();
        expect(wrapper.find('#current_password').exists()).toBe(true);
        expect(wrapper.text()).toContain('Update password');
    });

    it('when twoFactorEnabled shows Disable 2FA and View recovery codes without fetching codes', async () => {
        mockedFetchPasswordConfirmationStatus.mockResolvedValue({
            confirmed: true,
        });
        mockedFetchSecuritySettings.mockResolvedValue({
            ...securitySettings,
            twoFactorEnabled: true,
        });

        const { wrapper } = await mountSecurity();

        expect(wrapper.text()).toContain('Disable 2FA');
        expect(wrapper.text()).toContain('View recovery codes');
        expect(mockedFetchRecoveryCodes).not.toHaveBeenCalled();
    });
});
