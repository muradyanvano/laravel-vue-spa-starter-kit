import { mount, flushPromises } from '@vue/test-utils';
import { PasskeyError, UserCancelledError } from '@laravel/passkeys';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PasskeyVerify from '@/components/PasskeyVerify.vue';
import { PASSKEY_CONFIRM_ROUTES, preparePasskeyCeremony } from '@/lib/passkeys';
import { passkeyVerifyMock } from '@/testing/mock-passkeys';
import { usePasskeyVerify } from '@laravel/passkeys/vue';

vi.mock('@/lib/passkeys', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/lib/passkeys')>();

    return {
        ...actual,
        preparePasskeyCeremony: vi.fn().mockResolvedValue(undefined),
    };
});

const mockedPreparePasskeyCeremony = vi.mocked(preparePasskeyCeremony);
const mockedUsePasskeyVerify = vi.mocked(usePasskeyVerify);

describe('PasskeyVerify', () => {
    beforeEach(() => {
        mockedPreparePasskeyCeremony.mockClear();
        passkeyVerifyMock.verify.mockReset();
        passkeyVerifyMock.isSupported.value = true;
        passkeyVerifyMock.isLoading.value = false;
        passkeyVerifyMock.error.value = null;
        passkeyVerifyMock.errorInstance.value = null;
    });

    it('renders the passkey button when supported', () => {
        const wrapper = mount(PasskeyVerify);

        expect(
            wrapper.find('[data-test="passkey-verify-button"]').exists(),
        ).toBe(true);
        expect(wrapper.text()).toContain('Sign in with a passkey');
    });

    it('hides the entire passkey block when unsupported', () => {
        passkeyVerifyMock.isSupported.value = false;

        const wrapper = mount(PasskeyVerify);

        expect(
            wrapper.find('[data-test="passkey-verify-button"]').exists(),
        ).toBe(false);
        expect(wrapper.text()).not.toContain('Or continue with email');
    });

    it('uses default login routes when no override is provided', async () => {
        mount(PasskeyVerify);

        expect(mockedUsePasskeyVerify).toHaveBeenCalledWith(
            expect.objectContaining({
                autofill: false,
            }),
        );
    });

    it('accepts confirmation route overrides', () => {
        mount(PasskeyVerify, {
            props: {
                routes: PASSKEY_CONFIRM_ROUTES,
                label: 'Confirm with passkey',
            },
        });

        expect(mockedUsePasskeyVerify).toHaveBeenCalledWith(
            expect.objectContaining({
                routes: PASSKEY_CONFIRM_ROUTES,
            }),
        );
    });

    it('prepares CSRF before starting verification', async () => {
        passkeyVerifyMock.verify.mockResolvedValue(undefined);

        const wrapper = mount(PasskeyVerify);

        await wrapper
            .find('[data-test="passkey-verify-button"]')
            .trigger('click');
        await flushPromises();

        expect(mockedPreparePasskeyCeremony).toHaveBeenCalledTimes(1);
        expect(passkeyVerifyMock.verify).toHaveBeenCalledTimes(1);
    });

    it('keeps cancellation silent', async () => {
        passkeyVerifyMock.error.value = 'The passkey operation was cancelled.';
        passkeyVerifyMock.errorInstance.value = new UserCancelledError();

        const wrapper = mount(PasskeyVerify);

        expect(wrapper.text()).not.toContain('cancelled');
    });

    it('shows a safe error for real failures', async () => {
        passkeyVerifyMock.error.value = 'Server unavailable';
        passkeyVerifyMock.errorInstance.value = new PasskeyError(
            'Server unavailable',
        );

        const wrapper = mount(PasskeyVerify);

        expect(wrapper.text()).toContain('Server unavailable');
    });

    it('disables the button while loading', () => {
        passkeyVerifyMock.isLoading.value = true;

        const wrapper = mount(PasskeyVerify);

        expect(
            wrapper
                .find('[data-test="passkey-verify-button"]')
                .attributes('disabled'),
        ).toBeDefined();
        expect(wrapper.text()).toContain('Authenticating...');
    });

    it('emits success once from the package callback', async () => {
        let capturedOnSuccess:
            | ((response: { redirect?: string }) => void)
            | undefined;

        mockedUsePasskeyVerify.mockImplementation((options) => {
            capturedOnSuccess = options?.onSuccess;

            return {
                verify: async () => {
                    options?.onSuccess?.({ redirect: '/dashboard' });
                },
                isLoading: passkeyVerifyMock.isLoading,
                error: passkeyVerifyMock.error,
                errorInstance: passkeyVerifyMock.errorInstance,
                isSupported: passkeyVerifyMock.isSupported,
            };
        });

        const wrapper = mount(PasskeyVerify);

        capturedOnSuccess?.({ redirect: '/dashboard' });
        await flushPromises();

        expect(wrapper.emitted('success')).toHaveLength(1);

        mockedUsePasskeyVerify.mockReset();
    });
});
