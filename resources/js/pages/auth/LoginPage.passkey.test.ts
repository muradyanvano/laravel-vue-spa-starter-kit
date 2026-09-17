import { mount, flushPromises } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, ref } from 'vue';
import { RouterView } from 'vue-router';
import AuthProvider from '@/auth/AuthProvider.vue';
import LoginPage from '@/pages/auth/LoginPage.vue';
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

import { fetchCurrentUser, login } from '@/lib/auth-api';

const mockedFetchCurrentUser = vi.mocked(fetchCurrentUser);
const mockedLogin = vi.mocked(login);
const mockedUsePasskeyVerify = vi.mocked(usePasskeyVerify);

async function mountLogin(from?: string) {
    mockedFetchCurrentUser.mockResolvedValue(null);

    const router = createSpaTestRouter({
        children: [
            { path: 'login', component: LoginPage },
            {
                path: 'dashboard',
                component: defineComponent({
                    template: '<div>Dashboard ready</div>',
                }),
            },
            {
                path: 'verify-email',
                component: defineComponent({
                    template: '<div>Verify email ready</div>',
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

    await router.push('/login');
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
                options?.onSuccess?.({ redirect: '/dashboard' });
                isLoading.value = false;
            },
            isLoading,
            error: ref(null),
            errorInstance: ref(null),
            isSupported: ref(true),
        };
    });
}

describe('LoginPage passkeys', () => {
    beforeEach(() => {
        mockedFetchCurrentUser.mockReset();
        mockedLogin.mockReset();
        mockedUsePasskeyVerify.mockReset();
        mockSupportedPasskeyVerify();
    });

    it('renders passkey UI before the password form with official wording', async () => {
        const { wrapper } = await mountLogin();

        const passkeyButton = wrapper.find(
            '[data-test="passkey-verify-button"]',
        );
        const emailInput = wrapper.find('input#email');

        expect(passkeyButton.exists()).toBe(true);
        expect(passkeyButton.text()).toContain('Sign in with a passkey');
        expect(wrapper.text()).toContain('Or continue with email');
        expect(wrapper.find('input#password').exists()).toBe(true);
        expect(wrapper.find('[data-test="login-button"]').exists()).toBe(true);
        expect(
            passkeyButton.element.compareDocumentPosition(emailInput.element) &
                Node.DOCUMENT_POSITION_FOLLOWING,
        ).toBeTruthy();
    });

    it('refreshes the current user once after passkey success and navigates once', async () => {
        mockedFetchCurrentUser
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce({
                id: 1,
                name: 'Jane',
                email: 'jane@example.com',
                email_verified_at: '2026-01-01T00:00:00+00:00',
            });

        const { wrapper, router } = await mountLogin();

        await wrapper
            .find('[data-test="passkey-verify-button"]')
            .trigger('click');
        await flushPromises();

        expect(mockedLogin).not.toHaveBeenCalled();
        expect(mockedFetchCurrentUser).toHaveBeenCalledTimes(2);
        expect(router.currentRoute.value.path).toBe('/dashboard');
    });

    it('sends unverified users to verify-email after passkey success', async () => {
        mockedFetchCurrentUser
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce({
                id: 1,
                name: 'Jane',
                email: 'jane@example.com',
                email_verified_at: null,
            });

        const { wrapper, router } = await mountLogin();

        await wrapper
            .find('[data-test="passkey-verify-button"]')
            .trigger('click');
        await flushPromises();

        expect(router.currentRoute.value.path).toBe('/verify-email');
    });

    it('rejects external intended destinations after passkey success', async () => {
        mockedFetchCurrentUser
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce({
                id: 1,
                name: 'Jane',
                email: 'jane@example.com',
                email_verified_at: '2026-01-01T00:00:00+00:00',
            });

        const { wrapper, router } = await mountLogin('https://evil.example');

        await wrapper
            .find('[data-test="passkey-verify-button"]')
            .trigger('click');
        await flushPromises();

        expect(router.currentRoute.value.path).toBe('/dashboard');
    });

    it('rejects protocol-relative intended destinations after passkey success', async () => {
        mockedFetchCurrentUser
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce({
                id: 1,
                name: 'Jane',
                email: 'jane@example.com',
                email_verified_at: '2026-01-01T00:00:00+00:00',
            });

        const { wrapper, router } = await mountLogin('//evil.example');

        await wrapper
            .find('[data-test="passkey-verify-button"]')
            .trigger('click');
        await flushPromises();

        expect(router.currentRoute.value.path).toBe('/dashboard');
    });

    it('does not resume confirm-password as an intended destination', async () => {
        mockedFetchCurrentUser
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce({
                id: 1,
                name: 'Jane',
                email: 'jane@example.com',
                email_verified_at: '2026-01-01T00:00:00+00:00',
            });

        const { wrapper, router } = await mountLogin('/confirm-password');

        await wrapper
            .find('[data-test="passkey-verify-button"]')
            .trigger('click');
        await flushPromises();

        expect(router.currentRoute.value.path).toBe('/dashboard');
    });

    it('does not resume two-factor-challenge as an intended destination', async () => {
        mockedFetchCurrentUser
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce({
                id: 1,
                name: 'Jane',
                email: 'jane@example.com',
                email_verified_at: '2026-01-01T00:00:00+00:00',
            });

        const { wrapper, router } = await mountLogin('/two-factor-challenge');

        await wrapper
            .find('[data-test="passkey-verify-button"]')
            .trigger('click');
        await flushPromises();

        expect(router.currentRoute.value.path).toBe('/dashboard');
    });

    it('does not refresh or navigate when passkey verification fails', async () => {
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

        const { wrapper, router } = await mountLogin();

        await wrapper
            .find('[data-test="passkey-verify-button"]')
            .trigger('click');
        await flushPromises();

        expect(mockedFetchCurrentUser).toHaveBeenCalledTimes(1);
        expect(router.currentRoute.value.path).toBe('/login');
    });

    it('does not refresh or navigate when passkey verification is cancelled', async () => {
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

        const { wrapper, router } = await mountLogin();

        await wrapper
            .find('[data-test="passkey-verify-button"]')
            .trigger('click');
        await flushPromises();

        expect(mockedFetchCurrentUser).toHaveBeenCalledTimes(1);
        expect(router.currentRoute.value.path).toBe('/login');
    });

    it('does not route passkey success through the password-login two-factor challenge', async () => {
        mockedFetchCurrentUser
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce({
                id: 1,
                name: 'Jane',
                email: 'jane@example.com',
                email_verified_at: '2026-01-01T00:00:00+00:00',
            });

        const { wrapper, router } = await mountLogin();

        await wrapper
            .find('[data-test="passkey-verify-button"]')
            .trigger('click');
        await flushPromises();

        expect(mockedLogin).not.toHaveBeenCalled();
        expect(router.currentRoute.value.path).not.toBe(
            '/two-factor-challenge',
        );
        expect(router.currentRoute.value.path).toBe('/dashboard');
    });
});
