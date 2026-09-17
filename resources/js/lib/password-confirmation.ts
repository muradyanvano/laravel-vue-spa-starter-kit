import { isNormalizedApiError, normalizeApiError } from '@/lib/http';
import { getSafeInternalPath } from '@/lib/navigation';
import type { Router } from 'vue-router';

/**
 * If the error is HTTP 423, navigate to password confirmation and return true.
 * Callers must not automatically replay the failed mutation.
 */
export function navigateToConfirmPasswordIfRequired(
    error: unknown,
    router: Router,
    from: string,
): boolean {
    const normalized = isNormalizedApiError(error)
        ? error
        : normalizeApiError(error);

    if (normalized.kind !== 'password_confirmation') {
        return false;
    }

    const intended = getSafeInternalPath(from, '/settings/security');

    void router.replace({
        path: '/confirm-password',
        state: { from: intended },
    });

    return true;
}
