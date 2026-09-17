import { mount, flushPromises } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent } from 'vue';
import { RouterView } from 'vue-router';
import AuthProvider from '@/auth/AuthProvider.vue';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage.vue';
import TwoFactorChallengePage from '@/pages/auth/TwoFactorChallengePage.vue';
import ConfirmPasswordPage from '@/pages/auth/ConfirmPasswordPage.vue';
import { createSpaTestRouter } from '@/testing/create-test-router';

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

import {
    confirmPassword,
    fetchCurrentUser,
    requestPasswordReset,
    submitTwoFactorChallenge,
} from '@/lib/auth-api';

const mockedFetchCurrentUser = vi.mocked(fetchCurrentUser);
const mockedRequestPasswordReset = vi.mocked(requestPasswordReset);
const mockedSubmitTwoFactorChallenge = vi.mocked(submitTwoFactorChallenge);
const mockedConfirmPassword = vi.mocked(confirmPassword);

describe('ForgotPasswordPage', () => {
    beforeEach(() => {
        mockedFetchCurrentUser.mockReset();
        mockedRequestPasswordReset.mockReset();
        mockedFetchCurrentUser.mockResolvedValue(null);
    });

    it('shows success status after requesting a reset link', async () => {
        mockedRequestPasswordReset.mockResolvedValue(
            'We have emailed your password reset link.',
        );

        const router = createSpaTestRouter({
            children: [
                {
                    path: 'forgot-password',
                    component: ForgotPasswordPage,
                },
            ],
        });

        await router.push('/forgot-password');
        await router.isReady();

        const wrapper = mount(
            defineComponent({
                components: { AuthProvider, RouterView },
                template: '<AuthProvider><RouterView /></AuthProvider>',
            }),
            { global: { plugins: [router] } },
        );

        await flushPromises();

        await wrapper.find('input#email').setValue('jane@example.com');
        await wrapper.find('form').trigger('submit.prevent');
        await flushPromises();

        expect(wrapper.text()).toContain(
            'We have emailed your password reset link.',
        );
    });
});

describe('TwoFactorChallengePage', () => {
    beforeEach(() => {
        mockedFetchCurrentUser.mockReset();
        mockedSubmitTwoFactorChallenge.mockReset();
        mockedFetchCurrentUser.mockResolvedValue(null);
    });

    it('toggles between otp and recovery modes', async () => {
        const router = createSpaTestRouter({
            children: [
                {
                    path: 'two-factor-challenge',
                    component: TwoFactorChallengePage,
                },
            ],
        });

        await router.push('/two-factor-challenge');
        await router.isReady();

        const wrapper = mount(
            defineComponent({
                components: { AuthProvider, RouterView },
                template: '<AuthProvider><RouterView /></AuthProvider>',
            }),
            { global: { plugins: [router] } },
        );

        await flushPromises();

        expect(wrapper.text()).toContain('Authentication code');
        await wrapper
            .findAll('button')
            .find((button) =>
                button.text().includes('login using a recovery code'),
            )
            ?.trigger('click');
        await flushPromises();

        expect(wrapper.text()).toContain('Recovery code');
        expect(wrapper.find('input#recovery_code').exists()).toBe(true);
    });
});

describe('ConfirmPasswordPage', () => {
    beforeEach(() => {
        mockedFetchCurrentUser.mockReset();
        mockedConfirmPassword.mockReset();
        mockedFetchCurrentUser.mockResolvedValue({
            id: 1,
            name: 'Jane',
            email: 'jane@example.com',
            email_verified_at: '2026-01-01T00:00:00+00:00',
        });
    });

    it('confirms password and navigates to a safe intended path', async () => {
        mockedConfirmPassword.mockResolvedValue(undefined);

        const router = createSpaTestRouter({
            children: [
                {
                    path: 'confirm-password',
                    component: ConfirmPasswordPage,
                },
                {
                    path: 'settings/security',
                    component: defineComponent({
                        template: '<div>Security ready</div>',
                    }),
                },
            ],
        });

        await router.push('/confirm-password');
        await router.isReady();

        const wrapper = mount(
            defineComponent({
                components: { AuthProvider, RouterView },
                template: '<AuthProvider><RouterView /></AuthProvider>',
            }),
            { global: { plugins: [router] } },
        );

        await flushPromises();

        await wrapper.find('input#password').setValue('password');
        await wrapper.find('form').trigger('submit.prevent');
        await flushPromises();

        expect(mockedConfirmPassword).toHaveBeenCalledTimes(1);
        expect(router.currentRoute.value.path).toBe('/settings/security');
    });
});
