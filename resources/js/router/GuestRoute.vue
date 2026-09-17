<script setup lang="ts">
import { useAuth } from '@/auth/use-auth';
import { getPostAuthPath } from '@/lib/navigation';
import { watchEffect } from 'vue';
import { RouterView, useRouter } from 'vue-router';

const { isLoading, isAuthenticated, isVerified } = useAuth();
const router = useRouter();

function historyFrom(): unknown {
    return (window.history.state as { from?: string } | null)?.from;
}

watchEffect(() => {
    if (isLoading.value) {
        return;
    }

    if (!isAuthenticated.value) {
        return;
    }

    if (!isVerified.value) {
        void router.replace('/verify-email');

        return;
    }

    void router.replace(getPostAuthPath(historyFrom(), '/dashboard'));
});
</script>

<template>
    <RouterView v-if="!isLoading && !isAuthenticated" />
</template>
