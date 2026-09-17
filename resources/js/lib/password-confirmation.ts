import { PasskeyError } from '@laravel/passkeys';
import { isNormalizedApiError, normalizeApiError } from '@/lib/http';
import { getSafeInternalPath } from '@/lib/navigation';
import type { Router } from 'vue-router';

function isPasswordConfirmationRequired(error: unknown): boolean {
    if (error instanceof PasskeyError) {
        const message = error.message.toLowerCase();

        return (
            message.includes('423') || message.includes('confirm your password')
        );
    }

    const normalized = isNormalizedApiError(error)
        ? error
        : normalizeApiError(error);

    return normalized.kind === 'password_confirmation';
}

/**
 * If the error is HTTP 423, navigate to password confirmation and return true.
 * Callers must not automatically replay the failed mutation.
 */
export function navigateToConfirmPasswordIfRequired(
    error: unknown,
    router: Router,
    from: string,
): boolean {
    if (!isPasswordConfirmationRequired(error)) {
        return false;
    }

    const intended = getSafeInternalPath(from, '/settings/security');

    void router.replace({
        path: '/confirm-password',
        state: { from: intended },
    });

    return true;
}
