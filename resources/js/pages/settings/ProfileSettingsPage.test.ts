import { mount, flushPromises } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { createMemoryHistory, createRouter, RouterView } from 'vue-router';
import AuthProvider from '@/auth/AuthProvider.vue';
import { useAuth } from '@/auth/use-auth';
import ProfileSettingsPage from '@/pages/settings/ProfileSettingsPage.vue';
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
    deleteAccount: vi.fn(),
    fetchPasswordConfirmationStatus: vi.fn(),
    fetchSecuritySettings: vi.fn(),
    fetchRecoveryCodes: vi.fn(),
    updatePassword: vi.fn(),
    enableTwoFactor: vi.fn(),
    disableTwoFactor: vi.fn(),
    confirmTwoFactor: vi.fn(),
    fetchTwoFactorQrCode: vi.fn(),
    fetchTwoFactorSecretKey: vi.fn(),
    regenerateRecoveryCodes: vi.fn(),
}));

import { fetchCurrentUser } from '@/lib/auth-api';
import { updateProfile } from '@/lib/settings-api';

const mockedFetchCurrentUser = vi.mocked(fetchCurrentUser);
const mockedUpdateProfile = vi.mocked(updateProfile);

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

async function mountProfile(user: User = verifiedUser) {
    mockedFetchCurrentUser.mockResolvedValue(user);

    const router = createRouter({
        history: createMemoryHistory(),
        routes: [
            {
                path: '/',
                component: AuthReadyShell,
                children: [
                    {
                        path: 'settings/profile',
                        component: ProfileSettingsPage,
                    },
                ],
            },
        ],
    });

    await router.push('/settings/profile');
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
                    DeleteUser: true,
                },
            },
        },
    );

    await flushPromises();

    return { wrapper, router };
}

describe('ProfileSettingsPage', () => {
    beforeEach(() => {
        mockedFetchCurrentUser.mockReset();
        mockedUpdateProfile.mockReset();
    });

    it('renders name and email from the auth user', async () => {
        const { wrapper } = await mountProfile();

        const name = wrapper.find('input#name');
        const email = wrapper.find('input#email');

        expect((name.element as HTMLInputElement).value).toBe('Jane Doe');
        expect((email.element as HTMLInputElement).value).toBe(
            'jane@example.com',
        );
    });

    it('submits updateProfile then refreshUser', async () => {
        mockedUpdateProfile.mockResolvedValue(undefined);
        mockedFetchCurrentUser
            .mockResolvedValueOnce(verifiedUser)
            .mockResolvedValueOnce({
                ...verifiedUser,
                name: 'Jane Updated',
            });

        const { wrapper } = await mountProfile();

        await wrapper.find('input#name').setValue('Jane Updated');
        await wrapper.find('form').trigger('submit.prevent');
        await flushPromises();

        expect(mockedUpdateProfile).toHaveBeenCalledTimes(1);
        expect(mockedUpdateProfile).toHaveBeenCalledWith({
            name: 'Jane Updated',
            email: 'jane@example.com',
        });
        // bootstrap + refresh after profile update
        expect(mockedFetchCurrentUser).toHaveBeenCalledTimes(2);
        expect(wrapper.text()).toContain('Profile updated.');
    });

    it('shows unverified email UI when email_verified_at is null', async () => {
        const { wrapper } = await mountProfile({
            ...verifiedUser,
            email_verified_at: null,
        });

        await nextTick();

        expect(wrapper.text()).toContain('Your email address is unverified.');
        expect(wrapper.text()).toContain(
            'Click here to re-send the verification email.',
        );
    });
});
