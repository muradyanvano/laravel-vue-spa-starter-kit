<script setup lang="ts">
import { provideAuth } from '@/auth/use-auth';
import { onMounted, onUnmounted } from 'vue';

const auth = provideAuth();
let stopBootstrap: (() => void) | undefined;

onMounted(() => {
    stopBootstrap = auth.startBootstrap();
});

onUnmounted(() => {
    stopBootstrap?.();
});
</script>

<template>
    <slot />
</template>
