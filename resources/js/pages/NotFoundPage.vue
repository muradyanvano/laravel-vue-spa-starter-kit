<script setup lang="ts">
import DocumentTitle from '@/components/DocumentTitle.vue';
import { RouterLink } from 'vue-router';
</script>

<template>
    <DocumentTitle title="Not found" />
    <div
        class="bg-background flex min-h-svh flex-col items-center justify-center gap-4 p-6"
    >
        <h1 class="text-2xl font-medium">Page not found</h1>
        <RouterLink class="underline" to="/">Go home</RouterLink>
    </div>
</template>
