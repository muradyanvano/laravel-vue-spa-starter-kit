<script setup lang="ts">
import AuthProvider from '@/auth/AuthProvider.vue';
</script>

<template>
    <AuthProvider>
        <RouterView />
    </AuthProvider>
</template>
