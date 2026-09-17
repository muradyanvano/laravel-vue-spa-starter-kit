import { mount, flushPromises } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';
import PasskeyRegister from '@/components/PasskeyRegister.vue';
import { usePasskeyRegister } from '@laravel/passkeys/vue';
import { passkeyRegisterMock } from '@/testing/mock-passkeys';

vi.mock('@/lib/passkeys', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/lib/passkeys')>();

    return {
        ...actual,
        preparePasskeyCeremony: vi.fn().mockResolvedValue(undefined),
    };
});

import { preparePasskeyCeremony } from '@/lib/passkeys';

const mockedPreparePasskeyCeremony = vi.mocked(preparePasskeyCeremony);
const mockedUsePasskeyRegister = vi.mocked(usePasskeyRegister);

async function mountPasskeyRegister() {
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

    await router.push('/settings/security');
    await router.isReady();

    const wrapper = mount(PasskeyRegister, {
        attachTo: document.body,
        global: { plugins: [router] },
    });

    await flushPromises();

    return { wrapper, router };
}

describe('PasskeyRegister', () => {
    beforeEach(() => {
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

    it('shows official Add passkey wording', async () => {
        const { wrapper } = await mountPasskeyRegister();

        expect(wrapper.find('[data-test="passkey-add-button"]').text()).toBe(
            'Add passkey',
        );
    });

    it('prepares CSRF before registration ceremony', async () => {
        const { wrapper } = await mountPasskeyRegister();

        await wrapper.find('[data-test="passkey-add-button"]').trigger('click');
        await wrapper
            .find('input[placeholder="e.g., MacBook Pro, iPhone"]')
            .setValue('MacBook Pro');
        await wrapper
            .find('[data-test="passkey-register-submit"]')
            .trigger('click');
        await flushPromises();

        expect(mockedPreparePasskeyCeremony).toHaveBeenCalledTimes(1);
        expect(passkeyRegisterMock.register).toHaveBeenCalledTimes(1);
    });

    it('emits success without refreshing user data', async () => {
        const { wrapper } = await mountPasskeyRegister();

        await wrapper.find('[data-test="passkey-add-button"]').trigger('click');
        await wrapper
            .find('input[placeholder="e.g., MacBook Pro, iPhone"]')
            .setValue('MacBook Pro');
        await wrapper
            .find('[data-test="passkey-register-submit"]')
            .trigger('click');
        await flushPromises();

        expect(wrapper.emitted('success')).toHaveLength(1);
        expect(
            wrapper.find('[data-test="passkey-register-form"]').exists(),
        ).toBe(false);
    });

    it('shows throttled registration errors safely', async () => {
        const { PasskeyError } = await import('@laravel/passkeys');

        mockedUsePasskeyRegister.mockImplementation((options) => ({
            register: async (name: string) => {
                await passkeyRegisterMock.register(name);
                options?.onError?.(new PasskeyError('Too many attempts.'));
            },
            isLoading: ref(false),
            error: ref('Too many attempts.'),
            errorInstance: ref(new PasskeyError('Too many attempts.')),
            isSupported: ref(true),
        }));

        const { wrapper } = await mountPasskeyRegister();

        await wrapper.find('[data-test="passkey-add-button"]').trigger('click');
        await wrapper
            .find('input[placeholder="e.g., MacBook Pro, iPhone"]')
            .setValue('MacBook Pro');
        await wrapper
            .find('[data-test="passkey-register-submit"]')
            .trigger('click');
        await flushPromises();

        expect(wrapper.text()).toContain('Too many attempts');
        expect(passkeyRegisterMock.register).toHaveBeenCalledTimes(1);
    });
});
