import { mount, flushPromises } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { createMemoryHistory, createRouter, RouterView } from 'vue-router';
import AuthProvider from '@/auth/AuthProvider.vue';
import LoginPage from '@/pages/auth/LoginPage.vue';

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

import { fetchCurrentUser, login } from '@/lib/auth-api';

const mockedFetchCurrentUser = vi.mocked(fetchCurrentUser);
const mockedLogin = vi.mocked(login);

async function mountLogin() {
    mockedFetchCurrentUser.mockResolvedValue(null);

    const router = createRouter({
        history: createMemoryHistory(),
        routes: [
            {
                path: '/',
                component: defineComponent({
                    setup() {
                        return () => h(RouterView);
                    },
                }),
                children: [
                    {
                        path: 'login',
                        component: LoginPage,
                    },
                    {
                        path: 'dashboard',
                        component: defineComponent({
                            template: '<div>Dashboard ready</div>',
                        }),
                    },
                    {
                        path: 'two-factor-challenge',
                        component: defineComponent({
                            template: '<div>Two factor ready</div>',
                        }),
                    },
                    {
                        path: 'verify-email',
                        component: defineComponent({
                            template: '<div>Verify email ready</div>',
                        }),
                    },
                ],
            },
        ],
    });

    await router.push('/login');
    await router.isReady();

    const wrapper = mount(
        defineComponent({
            components: { AuthProvider, RouterView },
            template: '<AuthProvider><RouterView /></AuthProvider>',
        }),
        {
            global: {
                plugins: [router],
            },
        },
    );

    await flushPromises();

    return { wrapper, router };
}

describe('LoginPage', () => {
    beforeEach(() => {
        mockedFetchCurrentUser.mockReset();
        mockedLogin.mockReset();
    });

    it('renders login fields and links', async () => {
        const { wrapper } = await mountLogin();

        expect(wrapper.text()).toContain('Log in to your account');
        expect(wrapper.find('input#email').exists()).toBe(true);
        expect(wrapper.find('input#password').exists()).toBe(true);
        expect(wrapper.text()).toContain('Forgot your password?');
        expect(wrapper.text()).toContain('Sign up');
    });

    it('submits login, refreshes user once, and navigates to dashboard', async () => {
        mockedLogin.mockResolvedValue({ two_factor: false });
        mockedFetchCurrentUser
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce({
                id: 1,
                name: 'Jane',
                email: 'jane@example.com',
                email_verified_at: '2026-01-01T00:00:00+00:00',
            });

        const { wrapper, router } = await mountLogin();

        await wrapper.find('input#email').setValue('jane@example.com');
        await wrapper.find('input#password').setValue('password');
        await wrapper.find('form').trigger('submit.prevent');
        await flushPromises();

        expect(mockedLogin).toHaveBeenCalledTimes(1);
        // bootstrap + refresh after login
        expect(mockedFetchCurrentUser).toHaveBeenCalledTimes(2);
        expect(router.currentRoute.value.path).toBe('/dashboard');
    });

    it('navigates to two-factor challenge when required', async () => {
        mockedLogin.mockResolvedValue({ two_factor: true });

        const { wrapper, router } = await mountLogin();

        await wrapper.find('input#email').setValue('jane@example.com');
        await wrapper.find('input#password').setValue('password');
        await wrapper.find('form').trigger('submit.prevent');
        await flushPromises();

        expect(router.currentRoute.value.path).toBe('/two-factor-challenge');
        // bootstrap only — no refresh until challenge succeeds
        expect(mockedFetchCurrentUser).toHaveBeenCalledTimes(1);
    });

    it('maps validation errors onto fields with accessibility attributes', async () => {
        mockedLogin.mockRejectedValue({
            kind: 'validation',
            status: 422,
            message: 'The given data was invalid.',
            errors: {
                email: ['These credentials do not match our records.'],
            },
        });

        const { wrapper } = await mountLogin();

        await wrapper.find('form').trigger('submit.prevent');
        await flushPromises();
        await nextTick();

        const email = wrapper.find('input#email');
        expect(email.attributes('aria-invalid')).toBe('true');
        expect(email.attributes('aria-describedby')).toBe('email-error');
        expect(wrapper.find('#email-error').text()).toContain(
            'These credentials do not match our records.',
        );
    });
});
