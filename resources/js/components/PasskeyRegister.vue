<script setup lang="ts">
import { usePasskeyRegister } from '@laravel/passkeys/vue';
import { UserCancelledError } from '@laravel/passkeys';
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import InputError from '@/components/InputError.vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { passkeyErrorMessage, preparePasskeyCeremony } from '@/lib/passkeys';
import { locationToPath } from '@/lib/navigation';
import { navigateToConfirmPasswordIfRequired } from '@/lib/password-confirmation';

const emit = defineEmits<{
    success: [];
}>();

const router = useRouter();
const route = useRoute();
const from = locationToPath(route);

function getDefaultPasskeyName(): string {
    const ua = navigator.userAgent;

    const browser = [
        { pattern: /Edg|Edge/, name: 'Edge' },
        { pattern: /OPR|Opera|OPiOS/, name: 'Opera' },
        { pattern: /Firefox|FxiOS/, name: 'Firefox' },
        { pattern: /Chrome|CriOS/, name: 'Chrome' },
        { pattern: /Safari/, name: 'Safari' },
    ].find(({ pattern }) => pattern.test(ua))?.name;

    const os = [
        { pattern: /iPhone/, name: 'iPhone' },
        { pattern: /iPad|Macintosh(?=.*Mobile)/, name: 'iPad' },
        { pattern: /Android/, name: 'Android' },
        { pattern: /Mac/, name: 'Mac' },
        { pattern: /Windows/, name: 'Windows' },
    ].find(({ pattern }) => pattern.test(ua))?.name;

    return [browser, os].filter(Boolean).join(' on ') || '';
}

const name = ref(getDefaultPasskeyName());
const showForm = ref(false);
const nameError = ref<string | null>(null);

const { register, isLoading, error, errorInstance, isSupported } =
    usePasskeyRegister({
        onSuccess: () => {
            name.value = getDefaultPasskeyName();
            showForm.value = false;
            nameError.value = null;
            emit('success');
        },
        onError: (passkeyError) => {
            if (passkeyError instanceof UserCancelledError) {
                return;
            }

            if (
                navigateToConfirmPasswordIfRequired(passkeyError, router, from)
            ) {
                return;
            }
        },
    });

const visibleError = computed(() => {
    if (errorInstance.value instanceof UserCancelledError) {
        return null;
    }

    if (nameError.value) {
        return nameError.value;
    }

    if (errorInstance.value instanceof Error) {
        return passkeyErrorMessage(errorInstance.value);
    }

    return error.value;
});

async function handleSubmit(event: Event): Promise<void> {
    event.preventDefault();
    nameError.value = null;

    if (!name.value.trim()) {
        nameError.value = 'Please enter a name for this passkey.';

        return;
    }

    await preparePasskeyCeremony();
    await register(name.value.trim());
}

function handleCancel(): void {
    showForm.value = false;
    name.value = getDefaultPasskeyName();
    nameError.value = null;
}

function openForm(): void {
    name.value = getDefaultPasskeyName();
    showForm.value = true;
}
</script>

<template>
    <div
        v-if="!isSupported"
        class="text-muted-foreground text-sm"
        data-test="passkey-unsupported"
    >
        Passkeys are not supported in this browser.
    </div>

    <Button
        v-else-if="!showForm"
        variant="outline"
        data-test="passkey-add-button"
        @click="openForm"
    >
        Add passkey
    </Button>

    <form
        v-else
        data-test="passkey-register-form"
        class="border-border bg-muted/50 space-y-4 rounded-lg border p-4"
        @submit="handleSubmit"
    >
        <div class="grid gap-2">
            <Label for="passkey-name">Passkey name</Label>
            <Input
                id="passkey-name"
                type="text"
                v-model="name"
                placeholder="e.g., MacBook Pro, iPhone"
                class="border-foreground/20 mt-1 block w-full"
                autofocus
            />
            <p class="text-muted-foreground text-xs">
                A name helps you identify this passkey later.
            </p>
        </div>

        <InputError v-if="visibleError" :message="visibleError" />

        <div class="flex gap-2">
            <Button
                type="submit"
                data-test="passkey-register-submit"
                :disabled="isLoading || !name.trim()"
            >
                {{ isLoading ? 'Registering...' : 'Register passkey' }}
            </Button>
            <Button type="button" variant="ghost" @click="handleCancel">
                Cancel
            </Button>
        </div>
    </form>
</template>
