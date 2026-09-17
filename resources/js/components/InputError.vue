<script setup lang="ts">
/**
 * Field validation message. Place as the last child of a `grid gap-2` field
 * unit (Label, Input, InputError). Do not add top margin — the grid gap owns
 * spacing between the control and this message.
 */
defineProps<{
    message?: string;
    id?: string;
}>();
</script>

<template>
    <div v-show="message">
        <p :id="id" class="text-sm text-red-600 dark:text-red-500" role="alert">
            {{ message }}
        </p>
    </div>
</template>
