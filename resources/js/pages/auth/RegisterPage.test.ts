import { mount, flushPromises } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { createMemoryHistory, createRouter, RouterView } from 'vue-router';
import AuthProvider from '@/auth/AuthProvider.vue';
import RegisterPage from '@/pages/auth/RegisterPage.vue';

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

import { fetchCurrentUser, register } from '@/lib/auth-api';

const mockedFetchCurrentUser = vi.mocked(fetchCurrentUser);
const mockedRegister = vi.mocked(register);

describe('RegisterPage', () => {
    beforeEach(() => {
        mockedFetchCurrentUser.mockReset();
        mockedRegister.mockReset();
        mockedFetchCurrentUser.mockResolvedValue(null);
    });

    it('registers, refreshes once, and routes verified users to dashboard', async () => {
        mockedRegister.mockResolvedValue(undefined);
        mockedFetchCurrentUser
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce({
                id: 1,
                name: 'Jane',
                email: 'jane@example.com',
                email_verified_at: '2026-01-01T00:00:00+00:00',
            });

        const router = createRouter({
            history: createMemoryHistory(),
            routes: [
                {
                    path: '/',
                    component: defineComponent({
                        setup: () => () => h(RouterView),
                    }),
                    children: [
                        { path: 'register', component: RegisterPage },
                        {
                            path: 'dashboard',
                            component: defineComponent({
                                template: '<div>Dashboard ready</div>',
                            }),
                        },
                        {
                            path: 'verify-email',
                            component: defineComponent({
                                template: '<div>Verify ready</div>',
                            }),
                        },
                    ],
                },
            ],
        });

        await router.push('/register');
        await router.isReady();

        const wrapper = mount(
            defineComponent({
                components: { AuthProvider, RouterView },
                template: '<AuthProvider><RouterView /></AuthProvider>',
            }),
            { global: { plugins: [router] } },
        );

        await flushPromises();

        await wrapper.find('input#name').setValue('Jane');
        await wrapper.find('input#email').setValue('jane@example.com');
        await wrapper.find('input#password').setValue('password');
        await wrapper.find('input#password_confirmation').setValue('password');
        await wrapper.find('form').trigger('submit.prevent');
        await flushPromises();

        expect(mockedRegister).toHaveBeenCalledTimes(1);
        expect(mockedFetchCurrentUser).toHaveBeenCalledTimes(2);
        expect(router.currentRoute.value.path).toBe('/dashboard');
    });

    it('routes unverified users to verification notice after register', async () => {
        mockedRegister.mockResolvedValue(undefined);
        mockedFetchCurrentUser
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce({
                id: 1,
                name: 'Jane',
                email: 'jane@example.com',
                email_verified_at: null,
            });

        const router = createRouter({
            history: createMemoryHistory(),
            routes: [
                {
                    path: '/',
                    component: defineComponent({
                        setup: () => () => h(RouterView),
                    }),
                    children: [
                        { path: 'register', component: RegisterPage },
                        {
                            path: 'dashboard',
                            component: defineComponent({
                                template: '<div>Dashboard ready</div>',
                            }),
                        },
                        {
                            path: 'verify-email',
                            component: defineComponent({
                                template: '<div>Verify ready</div>',
                            }),
                        },
                    ],
                },
            ],
        });

        await router.push('/register');
        await router.isReady();

        const wrapper = mount(
            defineComponent({
                components: { AuthProvider, RouterView },
                template: '<AuthProvider><RouterView /></AuthProvider>',
            }),
            { global: { plugins: [router] } },
        );

        await flushPromises();

        await wrapper.find('input#name').setValue('Jane');
        await wrapper.find('input#email').setValue('jane@example.com');
        await wrapper.find('input#password').setValue('password');
        await wrapper.find('input#password_confirmation').setValue('password');
        await wrapper.find('form').trigger('submit.prevent');
        await flushPromises();
        await nextTick();

        expect(router.currentRoute.value.path).toBe('/verify-email');
    });
});
