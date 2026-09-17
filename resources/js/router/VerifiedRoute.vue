<script setup lang="ts">
import { useAuth } from '@/auth/use-auth';
import { locationToPath } from '@/lib/navigation';
import { watchEffect } from 'vue';
import { RouterView, useRoute, useRouter } from 'vue-router';

const { isLoading, isAuthenticated, isVerified } = useAuth();
const route = useRoute();
const router = useRouter();

watchEffect(() => {
    if (isLoading.value) {
        return;
    }

    if (!isAuthenticated.value) {
        void router.replace({
            path: '/login',
            state: { from: locationToPath(route) },
        });

        return;
    }

    if (!isVerified.value) {
        void router.replace('/verify-email');
    }
});
</script>

<template>
    <RouterView v-if="!isLoading && isAuthenticated && isVerified" />
</template>
