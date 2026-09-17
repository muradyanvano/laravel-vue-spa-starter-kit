import { PasskeyError } from '@laravel/passkeys';
import { navigateToConfirmPasswordIfRequired } from '@/lib/password-confirmation';
import axios, { AxiosError, type AxiosResponse } from 'axios';
import { describe, expect, it, vi } from 'vitest';
import type { Router } from 'vue-router';

function createRouterMock() {
    return {
        replace: vi.fn().mockResolvedValue(undefined),
    } as unknown as Router & { replace: ReturnType<typeof vi.fn> };
}

function axiosErrorFrom(status: number, data: unknown): AxiosError {
    const response = {
        status,
        data,
        statusText: 'Error',
        headers: {},
        config: { headers: new axios.AxiosHeaders() },
    } as AxiosResponse;

    return new AxiosError(
        'Request failed',
        AxiosError.ERR_BAD_REQUEST,
        undefined,
        undefined,
        response,
    );
}

describe('navigateToConfirmPasswordIfRequired', () => {
    it('returns true on password_confirmation and replaces to confirm-password with from state', () => {
        const router = createRouterMock();

        const result = navigateToConfirmPasswordIfRequired(
            {
                kind: 'password_confirmation',
                status: 423,
                message: 'Please confirm your password before continuing.',
                errors: {},
            },
            router,
            '/settings/security',
        );

        expect(result).toBe(true);
        expect(router.replace).toHaveBeenCalledWith({
            path: '/confirm-password',
            state: { from: '/settings/security' },
        });
    });

    it('returns true for a raw 423 error after normalization', () => {
        const router = createRouterMock();

        const result = navigateToConfirmPasswordIfRequired(
            axiosErrorFrom(423, {
                message: 'Password confirmation required.',
            }),
            router,
            '/settings/profile',
        );

        expect(result).toBe(true);
        expect(router.replace).toHaveBeenCalledWith({
            path: '/confirm-password',
            state: { from: '/settings/profile' },
        });
    });

    it('returns true for passkey package password confirmation errors', () => {
        const router = createRouterMock();

        const result = navigateToConfirmPasswordIfRequired(
            new PasskeyError('Please confirm your password before continuing.'),
            router,
            '/settings/security',
        );

        expect(result).toBe(true);
        expect(router.replace).toHaveBeenCalledWith({
            path: '/confirm-password',
            state: { from: '/settings/security' },
        });
    });

    it('returns false for other errors without navigating', () => {
        const router = createRouterMock();

        expect(
            navigateToConfirmPasswordIfRequired(
                {
                    kind: 'validation',
                    status: 422,
                    message: 'The given data was invalid.',
                    errors: { password: ['Required.'] },
                },
                router,
                '/settings/security',
            ),
        ).toBe(false);

        expect(
            navigateToConfirmPasswordIfRequired(
                {
                    kind: 'unauthenticated',
                    status: 401,
                    message: 'Unauthenticated.',
                    errors: {},
                },
                router,
                '/settings/security',
            ),
        ).toBe(false);

        expect(router.replace).not.toHaveBeenCalled();
    });
});
