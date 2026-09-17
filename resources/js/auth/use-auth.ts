import { fetchCurrentUser, logout as logoutRequest } from '@/lib/auth-api';
import { isRequestAborted, setAuthSessionHandlersSuppressed } from '@/lib/http';
import type { User } from '@/types/auth';
import {
    computed,
    inject,
    provide,
    ref,
    type ComputedRef,
    type InjectionKey,
    type Ref,
} from 'vue';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export type AuthContext = {
    user: Ref<User | null>;
    status: Ref<AuthStatus>;
    isAuthenticated: ComputedRef<boolean>;
    isLoading: ComputedRef<boolean>;
    isVerified: ComputedRef<boolean>;
    refreshUser: () => Promise<User | null>;
    setUser: (user: User | null) => void;
    clearUser: () => void;
    logout: () => Promise<void>;
    /** Start the single bootstrap GET /api/v1/user. Returns an abort/cleanup fn. */
    startBootstrap: () => () => void;
};

export const authInjectionKey: InjectionKey<AuthContext> = Symbol('auth');

/**
 * Create the single owner of current-user state for the SPA.
 *
 * Pinia was not introduced: one reactive owner + provide/inject is enough for
 * bootstrap, guards, and refresh/clear without a global store library.
 */
export function createAuthState(): AuthContext {
    const user = ref<User | null>(null);
    const status = ref<AuthStatus>('loading');

    const setUser = (nextUser: User | null): void => {
        user.value = nextUser;
        status.value = nextUser ? 'authenticated' : 'unauthenticated';
    };

    const clearUser = (): void => {
        setUser(null);
    };

    const refreshUser = async (): Promise<User | null> => {
        try {
            const nextUser = await fetchCurrentUser();
            setUser(nextUser);

            return nextUser;
        } catch (error) {
            if (isRequestAborted(error)) {
                return null;
            }

            setUser(null);

            return null;
        }
    };

    const logout = async (): Promise<void> => {
        try {
            await logoutRequest();
        } finally {
            setUser(null);
        }
    };

    const startBootstrap = (): (() => void) => {
        const controller = new AbortController();
        let active = true;

        setAuthSessionHandlersSuppressed(true);

        void (async () => {
            try {
                const nextUser = await fetchCurrentUser({
                    signal: controller.signal,
                });

                if (!active) {
                    return;
                }

                setUser(nextUser);
            } catch (error) {
                if (!active || isRequestAborted(error)) {
                    return;
                }

                setUser(null);
            } finally {
                if (active) {
                    setAuthSessionHandlersSuppressed(false);
                }
            }
        })();

        return () => {
            active = false;
            controller.abort();
            setAuthSessionHandlersSuppressed(false);
        };
    };

    return {
        user,
        status,
        isAuthenticated: computed(() => status.value === 'authenticated'),
        isLoading: computed(() => status.value === 'loading'),
        isVerified: computed(
            () => user.value !== null && user.value.email_verified_at !== null,
        ),
        refreshUser,
        setUser,
        clearUser,
        logout,
        startBootstrap,
    };
}

export function provideAuth(
    state: AuthContext = createAuthState(),
): AuthContext {
    provide(authInjectionKey, state);

    return state;
}

export function useAuth(): AuthContext {
    const context = inject(authInjectionKey);

    if (!context) {
        throw new Error('useAuth() must be used within provideAuth()');
    }

    return context;
}
