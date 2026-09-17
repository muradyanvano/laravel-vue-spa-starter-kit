/**
 * Return a safe same-origin SPA path for post-login redirects.
 * Rejects protocol-relative, absolute, and malformed destinations.
 */
export function getSafeInternalPath(
    candidate: unknown,
    fallback = '/dashboard',
): string {
    if (typeof candidate !== 'string' || candidate.length === 0) {
        return fallback;
    }

    if (
        !candidate.startsWith('/') ||
        candidate.startsWith('//') ||
        candidate.includes('://') ||
        candidate.includes('\\')
    ) {
        return fallback;
    }

    return candidate;
}

/**
 * Post-auth destination after login / 2FA.
 * Never resume password-confirmation or the 2FA challenge itself.
 */
export function getPostAuthPath(
    candidate: unknown,
    fallback = '/dashboard',
): string {
    const path = getSafeInternalPath(candidate, fallback);
    const pathname = path.split('?')[0] ?? path;

    if (
        pathname === '/confirm-password' ||
        pathname === '/two-factor-challenge'
    ) {
        return fallback;
    }

    return path;
}

export function locationToPath(location: {
    fullPath?: string;
    path?: string;
    pathname?: string;
    search?: string;
}): string {
    if (typeof location.fullPath === 'string' && location.fullPath.length > 0) {
        return location.fullPath;
    }

    if (typeof location.path === 'string') {
        return location.path;
    }

    return `${location.pathname ?? ''}${location.search ?? ''}`;
}

export function historyStateFrom(): string | undefined {
    return (window.history.state as { from?: string; status?: string } | null)
        ?.from;
}

export function historyStateStatus(): string | undefined {
    return (window.history.state as { from?: string; status?: string } | null)
        ?.status;
}
