import { mount, flushPromises } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';
import ManagePasskeys from '@/components/ManagePasskeys.vue';
import { usePasskeyRegister } from '@laravel/passkeys/vue';
import { passkeyRegisterMock } from '@/testing/mock-passkeys';

vi.mock('@/lib/settings-api', () => ({
    fetchPasskeys: vi.fn(),
    deletePasskey: vi.fn(),
}));

vi.mock('@/lib/passkeys', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/lib/passkeys')>();

    return {
        ...actual,
        preparePasskeyCeremony: vi.fn().mockResolvedValue(undefined),
    };
});

import { deletePasskey, fetchPasskeys } from '@/lib/settings-api';
import { preparePasskeyCeremony } from '@/lib/passkeys';

const mockedFetchPasskeys = vi.mocked(fetchPasskeys);
const mockedDeletePasskey = vi.mocked(deletePasskey);
const mockedPreparePasskeyCeremony = vi.mocked(preparePasskeyCeremony);
const mockedUsePasskeyRegister = vi.mocked(usePasskeyRegister);

const samplePasskeys = [
    {
        id: 1,
        name: 'Chrome on Windows',
        authenticator: 'Windows Hello',
        created_at_diff: '2 days ago',
        last_used_at_diff: '1 hour ago',
    },
    {
        id: 2,
        name: 'Safari on iPhone',
        authenticator: null,
        created_at_diff: '1 week ago',
        last_used_at_diff: null,
    },
];

function passkeyNameInput(wrapper: ReturnType<typeof mount>) {
    return wrapper.find('input[placeholder="e.g., MacBook Pro, iPhone"]');
}

async function confirmPasskeyDelete(): Promise<void> {
    const confirmButton = document.body.querySelector(
        '[data-test="passkey-delete-confirm"]',
    );

    expect(confirmButton).not.toBeNull();
    confirmButton!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushPromises();
}

async function mountManagePasskeys(
    canManagePasskeys = true,
    path = '/settings/security',
) {
    const router = createRouter({
        history: createMemoryHistory(),
        routes: [
            { path: '/settings/security', component: { template: '<div />' } },
            {
                path: '/confirm-password',
                component: { template: '<div />' },
            },
        ],
    });

    await router.push(path);
    await router.isReady();

    const wrapper = mount(ManagePasskeys, {
        props: { canManagePasskeys },
        attachTo: document.body,
        global: { plugins: [router] },
    });

    await flushPromises();

    return { wrapper, router };
}

describe('ManagePasskeys', () => {
    beforeEach(() => {
        mockedFetchPasskeys.mockReset();
        mockedDeletePasskey.mockReset();
        mockedPreparePasskeyCeremony.mockClear();
        passkeyRegisterMock.isSupported.value = true;
        mockedUsePasskeyRegister.mockImplementation((options) => ({
            register: async (name: string) => {
                await passkeyRegisterMock.register(name);
                options?.onSuccess?.();
            },
            isLoading: passkeyRegisterMock.isLoading,
            error: passkeyRegisterMock.error,
            errorInstance: passkeyRegisterMock.errorInstance,
            isSupported: passkeyRegisterMock.isSupported,
        }));
    });

    it('does not render when capability is false', async () => {
        const { wrapper } = await mountManagePasskeys(false);

        expect(wrapper.find('[data-test="manage-passkeys"]').exists()).toBe(
            false,
        );
        expect(mockedFetchPasskeys).not.toHaveBeenCalled();
    });

    it('fetches passkey list once when capability is true', async () => {
        mockedFetchPasskeys.mockResolvedValue([]);

        await mountManagePasskeys(true);

        expect(mockedFetchPasskeys).toHaveBeenCalledTimes(1);
    });

    it('shows empty state when no passkeys exist', async () => {
        mockedFetchPasskeys.mockResolvedValue([]);

        const { wrapper } = await mountManagePasskeys(true);

        expect(
            wrapper.find('[data-test="passkeys-empty-state"]').exists(),
        ).toBe(true);
        expect(wrapper.text()).toContain('No passkeys yet');
    });

    it('renders safe passkey metadata', async () => {
        mockedFetchPasskeys.mockResolvedValue(samplePasskeys);

        const { wrapper } = await mountManagePasskeys(true);

        expect(wrapper.text()).toContain('Chrome on Windows');
        expect(wrapper.text()).toContain('Windows Hello');
        expect(wrapper.text()).toContain('Added 2 days ago');
        expect(wrapper.text()).toContain('Last used 1 hour ago');
        expect(wrapper.text()).toContain('Safari on iPhone');
        expect(wrapper.text()).toContain('Added 1 week ago');
        expect(wrapper.text()).not.toContain('null');
    });

    it('shows list error safely', async () => {
        mockedFetchPasskeys.mockRejectedValue({
            kind: 'server',
            status: 500,
            message: 'Something went wrong on the server.',
            errors: {},
        });

        const { wrapper } = await mountManagePasskeys(true);

        expect(wrapper.find('[data-test="passkeys-list-error"]').exists()).toBe(
            true,
        );
        expect(wrapper.text()).toContain('Something went wrong on the server.');
    });

    it('shows Add passkey when registration is supported', async () => {
        mockedFetchPasskeys.mockResolvedValue([]);
        passkeyRegisterMock.isSupported.value = true;

        const { wrapper } = await mountManagePasskeys(true);

        expect(wrapper.find('[data-test="passkey-add-button"]').exists()).toBe(
            true,
        );
    });

    it('shows unsupported message but keeps list when registration is unsupported', async () => {
        mockedFetchPasskeys.mockResolvedValue(samplePasskeys);
        passkeyRegisterMock.isSupported.value = false;

        const { wrapper } = await mountManagePasskeys(true);

        expect(wrapper.find('[data-test="passkey-unsupported"]').exists()).toBe(
            true,
        );
        expect(wrapper.find('[data-test="passkey-add-button"]').exists()).toBe(
            false,
        );
        expect(wrapper.find('[data-test="passkey-item"]').exists()).toBe(true);
    });

    it('registers a passkey and refreshes the list once', async () => {
        mockedFetchPasskeys
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce(samplePasskeys.slice(0, 1));

        const { wrapper } = await mountManagePasskeys(true);

        await wrapper.find('[data-test="passkey-add-button"]').trigger('click');
        await passkeyNameInput(wrapper).setValue('Work Laptop');
        await wrapper
            .find('[data-test="passkey-register-submit"]')
            .trigger('click');
        await flushPromises();

        expect(mockedPreparePasskeyCeremony).toHaveBeenCalledTimes(1);
        expect(passkeyRegisterMock.register).toHaveBeenCalledWith(
            'Work Laptop',
        );
        expect(mockedFetchPasskeys).toHaveBeenCalledTimes(2);
    });

    it('does not refresh list when registration is cancelled', async () => {
        mockedFetchPasskeys.mockResolvedValue([]);

        const { UserCancelledError } = await import('@laravel/passkeys');

        mockedUsePasskeyRegister.mockImplementation((options) => ({
            register: async () => {
                options?.onError?.(new UserCancelledError());
            },
            isLoading: ref(false),
            error: ref(null),
            errorInstance: ref(new UserCancelledError()),
            isSupported: ref(true),
        }));

        const { wrapper } = await mountManagePasskeys(true);

        await wrapper.find('[data-test="passkey-add-button"]').trigger('click');
        await passkeyNameInput(wrapper).setValue('Work Laptop');
        await wrapper
            .find('[data-test="passkey-register-submit"]')
            .trigger('click');
        await flushPromises();

        expect(mockedFetchPasskeys).toHaveBeenCalledTimes(1);
    });

    it('navigates to confirm-password on registration 423 without replay', async () => {
        mockedFetchPasskeys.mockResolvedValue([]);

        const { PasskeyError } = await import('@laravel/passkeys');

        mockedUsePasskeyRegister.mockImplementation((options) => ({
            register: async () => {
                options?.onError?.(
                    new PasskeyError(
                        'Please confirm your password before continuing.',
                    ),
                );
            },
            isLoading: ref(false),
            error: ref('Please confirm your password before continuing.'),
            errorInstance: ref(
                new PasskeyError(
                    'Please confirm your password before continuing.',
                ),
            ),
            isSupported: ref(true),
        }));

        const { wrapper, router } = await mountManagePasskeys(true);

        await wrapper.find('[data-test="passkey-add-button"]').trigger('click');
        await passkeyNameInput(wrapper).setValue('Work Laptop');
        await wrapper
            .find('[data-test="passkey-register-submit"]')
            .trigger('click');
        await flushPromises();

        expect(router.currentRoute.value.path).toBe('/confirm-password');
        expect(mockedFetchPasskeys).toHaveBeenCalledTimes(1);
    });

    it('shows safe registration error on 419 without retry', async () => {
        mockedFetchPasskeys.mockResolvedValue([]);

        const { PasskeyError } = await import('@laravel/passkeys');

        mockedUsePasskeyRegister.mockImplementation((options) => ({
            register: async (name: string) => {
                await passkeyRegisterMock.register(name);
                options?.onError?.(new PasskeyError('CSRF token mismatch.'));
            },
            isLoading: ref(false),
            error: ref('CSRF token mismatch.'),
            errorInstance: ref(new PasskeyError('CSRF token mismatch.')),
            isSupported: ref(true),
        }));

        const { wrapper } = await mountManagePasskeys(true);

        await wrapper.find('[data-test="passkey-add-button"]').trigger('click');
        await passkeyNameInput(wrapper).setValue('Work Laptop');
        await wrapper
            .find('[data-test="passkey-register-submit"]')
            .trigger('click');
        await flushPromises();

        expect(wrapper.text()).toContain('Your session expired');
        expect(mockedFetchPasskeys).toHaveBeenCalledTimes(1);
        expect(passkeyRegisterMock.register).toHaveBeenCalledTimes(1);
    });

    it('requires a passkey name before registering', async () => {
        mockedFetchPasskeys.mockResolvedValue([]);

        const { wrapper } = await mountManagePasskeys(true);

        await wrapper.find('[data-test="passkey-add-button"]').trigger('click');
        await passkeyNameInput(wrapper).setValue('   ');
        await wrapper
            .find('[data-test="passkey-register-form"]')
            .trigger('submit');
        await flushPromises();

        expect(wrapper.text()).toContain(
            'Please enter a name for this passkey.',
        );
        expect(passkeyRegisterMock.register).not.toHaveBeenCalled();
    });

    it('deletes a passkey and refreshes the list once', async () => {
        mockedFetchPasskeys
            .mockResolvedValueOnce(samplePasskeys)
            .mockResolvedValueOnce(samplePasskeys.slice(1));
        mockedDeletePasskey.mockResolvedValue(undefined);

        const { wrapper } = await mountManagePasskeys(true);

        await wrapper
            .find('[data-test="passkey-delete-trigger"]')
            .trigger('click');
        await flushPromises();
        await confirmPasskeyDelete();

        expect(mockedDeletePasskey).toHaveBeenCalledTimes(1);
        expect(mockedDeletePasskey).toHaveBeenCalledWith(1);
        expect(mockedFetchPasskeys).toHaveBeenCalledTimes(2);
    });

    it('navigates to confirm-password on delete 423 without replay', async () => {
        mockedFetchPasskeys.mockResolvedValue(samplePasskeys);
        mockedDeletePasskey.mockRejectedValue({
            kind: 'password_confirmation',
            status: 423,
            message: 'Please confirm your password before continuing.',
            errors: {},
        });

        const { wrapper, router } = await mountManagePasskeys(true);

        await wrapper
            .find('[data-test="passkey-delete-trigger"]')
            .trigger('click');
        await flushPromises();
        await confirmPasskeyDelete();

        expect(router.currentRoute.value.path).toBe('/confirm-password');
        expect(mockedDeletePasskey).toHaveBeenCalledTimes(1);
        expect(mockedFetchPasskeys).toHaveBeenCalledTimes(1);
    });

    it('does not treat 403 delete as success', async () => {
        mockedFetchPasskeys.mockResolvedValue(samplePasskeys);
        mockedDeletePasskey.mockRejectedValue({
            kind: 'forbidden',
            status: 403,
            message: 'This action is unauthorized.',
            errors: {},
        });

        const { wrapper } = await mountManagePasskeys(true);

        await wrapper
            .find('[data-test="passkey-delete-trigger"]')
            .trigger('click');
        await flushPromises();
        await confirmPasskeyDelete();

        expect(wrapper.text()).toContain('This action is unauthorized.');
        expect(mockedFetchPasskeys).toHaveBeenCalledTimes(1);
        expect(wrapper.text()).toContain('Chrome on Windows');
    });
});
