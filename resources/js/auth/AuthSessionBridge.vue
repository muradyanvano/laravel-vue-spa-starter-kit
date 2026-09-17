<script setup lang="ts">
import { useAuth } from '@/auth/use-auth';
import {
    configureAuthSessionHandlers,
    setAuthSessionHandlersSuppressed,
} from '@/lib/http';
import { getSafeInternalPath, locationToPath } from '@/lib/navigation';
import { onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const GUEST_AUTH_PREFIXES = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/two-factor-challenge',
] as const;

function isGuestAuthPath(pathname: string): boolean {
    return GUEST_AUTH_PREFIXES.some(
        (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );
}

/**
 * Bridges Axios session-expiration 401 to auth state + Vue Router.
 * Password-confirmation (423) is handled contextually by sensitive callers.
 */
const { status, setUser } = useAuth();
const router = useRouter();
const route = useRoute();

let currentStatus = status.value;
let currentPath = locationToPath(route);

watch(status, (value) => {
    currentStatus = value;
});

watch(
    () => locationToPath(route),
    (value) => {
        currentPath = value;
    },
);

onMounted(() => {
    configureAuthSessionHandlers({
        onUnauthenticated: () => {
            if (currentStatus !== 'authenticated') {
                return;
            }

            setUser(null);

            const pathname = currentPath.split('?')[0] ?? currentPath;

            if (isGuestAuthPath(pathname)) {
                return;
            }

            const intended = getSafeInternalPath(currentPath);

            void router.replace({
                path: '/login',
                state: { from: intended },
            });
        },
    });
});

onUnmounted(() => {
    configureAuthSessionHandlers({});
    setAuthSessionHandlersSuppressed(false);
});
</script>

<template>
    <span class="hidden" aria-hidden="true" />
</template>
