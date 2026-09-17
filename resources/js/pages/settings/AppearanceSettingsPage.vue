<script setup lang="ts">
import AppearanceTabs from '@/components/AppearanceTabs.vue';
import DocumentTitle from '@/components/DocumentTitle.vue';
import Heading from '@/components/Heading.vue';
import SettingsLayout from '@/layouts/SettingsLayout.vue';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Appearance settings',
        href: '/settings/appearance',
    },
];
</script>

<template>
    <SettingsLayout :breadcrumbs="breadcrumbs">
        <DocumentTitle title="Appearance settings" />

        <h1 class="sr-only">Appearance settings</h1>

        <div class="space-y-6">
            <Heading
                variant="small"
                title="Appearance settings"
                description="Update the appearance settings for your account"
            />
            <AppearanceTabs />
        </div>
    </SettingsLayout>
</template>
