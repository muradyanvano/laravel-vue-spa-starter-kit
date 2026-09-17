import { mount, flushPromises } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, ref } from 'vue';
import { RouterView } from 'vue-router';
import AuthProvider from '@/auth/AuthProvider.vue';
import ConfirmPasswordPage from '@/pages/auth/ConfirmPasswordPage.vue';
import { PASSKEY_CONFIRM_ROUTES } from '@/lib/passkeys';
import { createSpaTestRouter } from '@/testing/create-test-router';
import { usePasskeyVerify } from '@laravel/passkeys/vue';

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

vi.mock('@/lib/passkeys', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/lib/passkeys')>();

    return {
        ...actual,
        preparePasskeyCeremony: vi.fn().mockResolvedValue(undefined),
    };
});

import { fetchCurrentUser } from '@/lib/auth-api';

const mockedFetchCurrentUser = vi.mocked(fetchCurrentUser);
const mockedUsePasskeyVerify = vi.mocked(usePasskeyVerify);

async function mountConfirmPassword(from?: string) {
    mockedFetchCurrentUser.mockResolvedValue({
        id: 1,
        name: 'Jane',
        email: 'jane@example.com',
        email_verified_at: '2026-01-01T00:00:00+00:00',
    });

    const router = createSpaTestRouter({
        children: [
            { path: 'confirm-password', component: ConfirmPasswordPage },
            {
                path: 'settings/security',
                component: defineComponent({
                    template: '<div>Security ready</div>',
                }),
            },
            {
                path: 'two-factor-challenge',
                component: defineComponent({
                    template: '<div>Two factor ready</div>',
                }),
            },
        ],
    });

    if (from !== undefined) {
        window.history.replaceState({ from }, '');
    } else {
        window.history.replaceState({}, '');
    }

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

    return { wrapper, router };
}

function mockSupportedPasskeyVerify(
    onVerify?: () => void | Promise<void>,
): void {
    mockedUsePasskeyVerify.mockImplementation((options) => {
        const isLoading = ref(false);

        return {
            verify: async () => {
                isLoading.value = true;
                await onVerify?.();
                options?.onSuccess?.({ redirect: '/settings/security' });
                isLoading.value = false;
            },
            isLoading,
            error: ref(null),
            errorInstance: ref(null),
            isSupported: ref(true),
        };
    });
}

describe('ConfirmPasswordPage passkeys', () => {
    beforeEach(() => {
        mockedFetchCurrentUser.mockReset();
        mockedUsePasskeyVerify.mockReset();
        mockSupportedPasskeyVerify();
    });

    it('renders passkey confirmation before the password form with official wording', async () => {
        const { wrapper } = await mountConfirmPassword();

        const passkeyButton = wrapper.find(
            '[data-test="passkey-verify-button"]',
        );
        const passwordInput = wrapper.find('input#password');

        expect(passkeyButton.text()).toContain('Confirm with passkey');
        expect(wrapper.text()).toContain('Or confirm with password');
        expect(
            wrapper.find('[data-test="confirm-password-button"]').exists(),
        ).toBe(true);
        expect(
            passkeyButton.element.compareDocumentPosition(
                passwordInput.element,
            ) & Node.DOCUMENT_POSITION_FOLLOWING,
        ).toBeTruthy();
    });

    it('uses native passkey confirmation routes', async () => {
        await mountConfirmPassword();

        expect(mockedUsePasskeyVerify).toHaveBeenCalledWith(
            expect.objectContaining({
                routes: PASSKEY_CONFIRM_ROUTES,
            }),
        );
    });

    it('navigates to the safe intended path without refreshing current user', async () => {
        const { wrapper, router } =
            await mountConfirmPassword('/settings/security');

        await wrapper
            .find('[data-test="passkey-verify-button"]')
            .trigger('click');
        await flushPromises();

        expect(mockedFetchCurrentUser).toHaveBeenCalledTimes(1);
        expect(router.currentRoute.value.path).toBe('/settings/security');
    });

    it('rejects unsafe intended destinations after passkey confirmation', async () => {
        const { wrapper, router } = await mountConfirmPassword(
            'https://evil.example',
        );

        await wrapper
            .find('[data-test="passkey-verify-button"]')
            .trigger('click');
        await flushPromises();

        expect(router.currentRoute.value.path).toBe('/settings/security');
    });

    it('does not resume confirm-password as an intended destination', async () => {
        const { wrapper, router } =
            await mountConfirmPassword('/confirm-password');

        await wrapper
            .find('[data-test="passkey-verify-button"]')
            .trigger('click');
        await flushPromises();

        expect(router.currentRoute.value.path).toBe('/settings/security');
    });

    it('does not resume two-factor-challenge as an intended destination', async () => {
        const { wrapper, router } = await mountConfirmPassword(
            '/two-factor-challenge',
        );

        await wrapper
            .find('[data-test="passkey-verify-button"]')
            .trigger('click');
        await flushPromises();

        expect(router.currentRoute.value.path).toBe('/settings/security');
    });

    it('does not navigate or refresh when passkey confirmation is cancelled', async () => {
        const { UserCancelledError } = await import('@laravel/passkeys');

        mockedUsePasskeyVerify.mockImplementation((options) => ({
            verify: async () => {
                options?.onError?.(new UserCancelledError());
            },
            isLoading: ref(false),
            error: ref(null),
            errorInstance: ref(new UserCancelledError()),
            isSupported: ref(true),
        }));

        const { wrapper, router } =
            await mountConfirmPassword('/settings/security');

        await wrapper
            .find('[data-test="passkey-verify-button"]')
            .trigger('click');
        await flushPromises();

        expect(mockedFetchCurrentUser).toHaveBeenCalledTimes(1);
        expect(router.currentRoute.value.path).toBe('/confirm-password');
    });

    it('shows a safe error without navigating when confirmation fails', async () => {
        const { PasskeyError } = await import('@laravel/passkeys');

        mockedUsePasskeyVerify.mockImplementation((options) => ({
            verify: async () => {
                options?.onError?.(new PasskeyError('Server unavailable'));
            },
            isLoading: ref(false),
            error: ref('Server unavailable'),
            errorInstance: ref(new PasskeyError('Server unavailable')),
            isSupported: ref(true),
        }));

        const { wrapper, router } =
            await mountConfirmPassword('/settings/security');

        await wrapper
            .find('[data-test="passkey-verify-button"]')
            .trigger('click');
        await flushPromises();

        expect(mockedFetchCurrentUser).toHaveBeenCalledTimes(1);
        expect(router.currentRoute.value.path).toBe('/confirm-password');
        expect(wrapper.text()).toContain('Server unavailable');
    });
});
