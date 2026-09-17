import { createAuthState } from '@/auth/use-auth';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';

vi.mock('@/lib/auth-api', () => ({
    fetchCurrentUser: vi.fn(),
    logout: vi.fn(),
}));

import { fetchCurrentUser, logout as logoutRequest } from '@/lib/auth-api';

const mockedFetchCurrentUser = vi.mocked(fetchCurrentUser);
const mockedLogout = vi.mocked(logoutRequest);

describe('createAuthState', () => {
    beforeEach(() => {
        mockedFetchCurrentUser.mockReset();
        mockedLogout.mockReset();
    });

    it('bootstraps as authenticated when the current user endpoint returns a user', async () => {
        mockedFetchCurrentUser.mockResolvedValue({
            id: 1,
            name: 'Jane',
            email: 'jane@example.com',
            email_verified_at: '2026-01-01T00:00:00+00:00',
        });

        const auth = createAuthState();
        const stop = auth.startBootstrap();

        expect(auth.isLoading.value).toBe(true);

        await flushPromises();

        expect(auth.isAuthenticated.value).toBe(true);
        expect(auth.isVerified.value).toBe(true);
        expect(auth.user.value?.email).toBe('jane@example.com');
        expect(mockedFetchCurrentUser).toHaveBeenCalledTimes(1);

        stop();
    });

    it('bootstraps as unauthenticated on guest 401/null', async () => {
        mockedFetchCurrentUser.mockResolvedValue(null);

        const auth = createAuthState();
        auth.startBootstrap();

        await flushPromises();

        expect(auth.isAuthenticated.value).toBe(false);
        expect(auth.user.value).toBeNull();
    });

    it('clearUser and logout reset auth state', async () => {
        mockedFetchCurrentUser.mockResolvedValue({
            id: 1,
            name: 'Jane',
            email: 'jane@example.com',
            email_verified_at: null,
        });
        mockedLogout.mockResolvedValue(undefined);

        const auth = createAuthState();
        auth.startBootstrap();
        await flushPromises();

        expect(auth.isVerified.value).toBe(false);

        await auth.logout();

        expect(auth.user.value).toBeNull();
        expect(auth.isAuthenticated.value).toBe(false);
        expect(mockedLogout).toHaveBeenCalledTimes(1);

        auth.setUser({
            id: 2,
            name: 'Bob',
            email: 'bob@example.com',
            email_verified_at: '2026-01-01T00:00:00+00:00',
        });
        auth.clearUser();

        expect(auth.user.value).toBeNull();
    });
});
