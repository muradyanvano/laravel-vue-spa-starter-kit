<script setup lang="ts">
import DocumentTitle from '@/components/DocumentTitle.vue';
import PlaceholderPattern from '@/components/PlaceholderPattern.vue';
import AppLayout from '@/layouts/AppLayout.vue';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];
</script>

<template>
    <AppLayout :breadcrumbs="breadcrumbs">
        <DocumentTitle title="Dashboard" />

        <div
            class="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4"
        >
            <div class="grid auto-rows-min gap-4 md:grid-cols-3">
                <div
                    class="border-sidebar-border/70 dark:border-sidebar-border relative aspect-video overflow-hidden rounded-xl border"
                >
                    <PlaceholderPattern />
                </div>
                <div
                    class="border-sidebar-border/70 dark:border-sidebar-border relative aspect-video overflow-hidden rounded-xl border"
                >
                    <PlaceholderPattern />
                </div>
                <div
                    class="border-sidebar-border/70 dark:border-sidebar-border relative aspect-video overflow-hidden rounded-xl border"
                >
                    <PlaceholderPattern />
                </div>
            </div>
            <div
                class="border-sidebar-border/70 dark:border-sidebar-border relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border md:min-h-min"
            >
                <PlaceholderPattern />
            </div>
        </div>
    </AppLayout>
</template>
