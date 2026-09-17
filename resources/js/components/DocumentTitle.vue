<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue';

const props = withDefaults(
    defineProps<{
        title?: string;
    }>(),
    {
        title: undefined,
    },
);

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

function applyTitle(title: string | undefined): void {
    document.title = title ? `${title} - ${appName}` : appName;
}

watch(
    () => props.title,
    (title) => {
        applyTitle(title);
    },
    { immediate: true },
);

onMounted(() => {
    applyTitle(props.title);
});

onUnmounted(() => {
    document.title = appName;
});
</script>

<template>
    <span class="hidden" aria-hidden="true" />
</template>
