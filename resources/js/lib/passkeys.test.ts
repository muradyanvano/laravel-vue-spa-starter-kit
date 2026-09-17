import { PasskeyError, UserCancelledError } from '@laravel/passkeys';
import {
    isPasskeyCancellation,
    passkeyErrorMessage,
    PASSKEY_CONFIRM_ROUTES,
    PASSKEY_LOGIN_ROUTES,
} from '@/lib/passkeys';
import { describe, expect, it } from 'vitest';

describe('passkeys helpers', () => {
    it('exports native login and confirmation route overrides', () => {
        expect(PASSKEY_LOGIN_ROUTES).toEqual({
            options: '/passkeys/login/options',
            submit: '/passkeys/login',
        });
        expect(PASSKEY_CONFIRM_ROUTES).toEqual({
            options: '/passkeys/confirm/options',
            submit: '/passkeys/confirm',
        });
    });

    it('identifies cancellation errors', () => {
        expect(isPasskeyCancellation(new UserCancelledError())).toBe(true);
        expect(isPasskeyCancellation(new PasskeyError('Failed'))).toBe(false);
    });

    it('maps csrf-related failures to a safe message', () => {
        expect(
            passkeyErrorMessage(new PasskeyError('CSRF token mismatch.')),
        ).toContain('session expired');
    });
});
