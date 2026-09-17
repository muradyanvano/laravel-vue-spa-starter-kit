<script setup lang="ts">
import { useAuth } from '@/auth/use-auth';
import { getPostAuthPath, locationToPath } from '@/lib/navigation';
import { watchEffect } from 'vue';
import { RouterView, useRoute, useRouter } from 'vue-router';

const { isLoading, isAuthenticated } = useAuth();
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
    }
});
</script>

<template>
    <RouterView v-if="!isLoading && isAuthenticated" />
</template>
