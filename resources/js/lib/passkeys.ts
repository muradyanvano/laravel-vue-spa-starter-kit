import {
    InvalidDomainError,
    NotSupportedError,
    PasskeyError,
    Passkeys,
    UserCancelledError,
} from '@laravel/passkeys';
import { ensureCsrfCookie } from '@/lib/http';

export const PASSKEY_LOGIN_ROUTES = {
    options: '/passkeys/login/options',
    submit: '/passkeys/login',
} as const;

export const PASSKEY_CONFIRM_ROUTES = {
    options: '/passkeys/confirm/options',
    submit: '/passkeys/confirm',
} as const;

export type PasskeyRouteOverrides = {
    options: string;
    submit: string;
};

/**
 * Configure @laravel/passkeys once for same-origin Sanctum session cookies.
 */
export function configurePasskeysClient(): void {
    Passkeys.configure({
        fetch: {
            credentials: 'include',
        },
    });
}

/**
 * Initialize Sanctum CSRF before a WebAuthn ceremony owned by @laravel/passkeys.
 */
export async function preparePasskeyCeremony(): Promise<void> {
    await ensureCsrfCookie();
}

export function isPasskeyCancellation(error: unknown): boolean {
    return error instanceof UserCancelledError;
}

export function passkeyErrorMessage(error: PasskeyError): string {
    if (error instanceof NotSupportedError) {
        return 'Passkeys are not supported in this browser.';
    }

    if (error instanceof InvalidDomainError) {
        return error.message;
    }

    if (error.message.toLowerCase().includes('csrf')) {
        return 'Your session expired. Refresh the page and try again.';
    }

    if (error.message.toLowerCase().includes('too many')) {
        return 'Too many attempts. Please wait before trying again.';
    }

    return error.message || 'Unable to complete passkey authentication.';
}
