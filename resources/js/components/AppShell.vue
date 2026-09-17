<script setup lang="ts">
import { SidebarProvider } from '@/components/ui/sidebar';
import type { AppVariant } from '@/types';

type Props = {
    variant?: AppVariant;
};

withDefaults(defineProps<Props>(), {
    variant: 'sidebar',
});

/** The sidebar writes its own `sidebar_state` cookie; read it back for the initial render. */
function readSidebarState(): boolean {
    if (typeof document === 'undefined') {
        return true;
    }

    const match = document.cookie.match(
        /(?:^|;\s*)sidebar_state=(true|false)(?:;|$)/,
    );

    return match ? match[1] === 'true' : true;
}

const isOpen = readSidebarState();
</script>

<template>
    <div v-if="variant === 'header'" class="flex min-h-screen w-full flex-col">
        <slot />
    </div>
    <SidebarProvider v-else :default-open="isOpen">
        <slot />
    </SidebarProvider>
</template>
