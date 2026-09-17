<script setup lang="ts">
import InputError from '@/components/InputError.vue';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import {
    passkeyErrorMessage,
    preparePasskeyCeremony,
    type PasskeyRouteOverrides,
} from '@/lib/passkeys';
import { UserCancelledError } from '@laravel/passkeys';
import { usePasskeyVerify } from '@laravel/passkeys/vue';
import { KeyRound } from '@lucide/vue';
import { computed } from 'vue';

type Props = {
    routes?: PasskeyRouteOverrides;
    label?: string;
    loadingLabel?: string;
    separator?: string;
};

const props = defineProps<Props>();

const emit = defineEmits<{
    success: [];
}>();

const {
    verify: packageVerify,
    isLoading,
    error,
    errorInstance,
    isSupported,
} = usePasskeyVerify({
    autofill: false,
    ...(props.routes ? { routes: props.routes } : {}),
    onSuccess: () => {
        emit('success');
    },
    onError: (passkeyError) => {
        if (passkeyError instanceof UserCancelledError) {
            return;
        }
    },
});

const visibleError = computed(() => {
    if (errorInstance.value instanceof UserCancelledError) {
        return null;
    }

    if (errorInstance.value instanceof Error) {
        return passkeyErrorMessage(errorInstance.value);
    }

    return error.value;
});

async function verifyPasskey(): Promise<void> {
    await preparePasskeyCeremony();
    await packageVerify();
}
</script>

<template>
    <div v-if="isSupported">
        <div class="grid gap-2">
            <Button
                type="button"
                variant="outline"
                class="w-full"
                data-test="passkey-verify-button"
                :disabled="isLoading"
                @click="verifyPasskey"
            >
                <Spinner v-if="isLoading" />
                <KeyRound v-else class="h-4 w-4" aria-hidden="true" />
                {{
                    isLoading
                        ? (props.loadingLabel ?? 'Authenticating...')
                        : (props.label ?? 'Sign in with a passkey')
                }}
            </Button>

            <div v-if="visibleError" class="text-center">
                <InputError :message="visibleError" />
            </div>
        </div>

        <div class="relative my-6">
            <div class="absolute inset-0 flex items-center">
                <Separator class="w-full" />
            </div>
            <div class="relative flex justify-center text-xs uppercase">
                <span class="bg-background text-muted-foreground px-2">
                    {{ props.separator ?? 'Or continue with email' }}
                </span>
            </div>
        </div>
    </div>
</template>
