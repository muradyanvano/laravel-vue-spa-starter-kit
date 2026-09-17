<script setup lang="ts">
import AuthSessionBridge from '@/auth/AuthSessionBridge.vue';
import { useAuth } from '@/auth/use-auth';
import AppLoader from '@/components/AppLoader.vue';
import { RouterView } from 'vue-router';

const { isLoading } = useAuth();
</script>

<template>
    <AppLoader v-if="isLoading" />
    <template v-else>
        <AuthSessionBridge />
        <RouterView />
    </template>
</template>
