<script setup lang="ts">
import AppLayout from '@/layouts/AppLayout.vue';
import SettingsNavLayout from '@/layouts/settings/Layout.vue';
import type { BreadcrumbItem } from '@/types';

defineProps<{ breadcrumbs?: BreadcrumbItem[] }>();
</script>

<template>
    <AppLayout :breadcrumbs="breadcrumbs ?? []">
        <SettingsNavLayout>
            <slot />
        </SettingsNavLayout>
    </AppLayout>
</template>
