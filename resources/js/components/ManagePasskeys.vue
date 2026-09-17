<script setup lang="ts">
import { KeyRound } from '@lucide/vue';
import { onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AlertError from '@/components/AlertError.vue';
import Heading from '@/components/Heading.vue';
import PasskeyItem from '@/components/PasskeyItem.vue';
import PasskeyRegister from '@/components/PasskeyRegister.vue';
import { Skeleton } from '@/components/ui/skeleton';
import { isRequestAborted, normalizeApiError } from '@/lib/http';
import { locationToPath } from '@/lib/navigation';
import { navigateToConfirmPasswordIfRequired } from '@/lib/password-confirmation';
import { deletePasskey, fetchPasskeys } from '@/lib/settings-api';
import type { Passkey } from '@/types';

export type Props = {
    canManagePasskeys?: boolean;
};

const props = withDefaults(defineProps<Props>(), {
    canManagePasskeys: false,
});

const router = useRouter();
const route = useRoute();
const from = locationToPath(route);

const passkeys = ref<Passkey[]>([]);
const phase = ref<'idle' | 'loading' | 'ready' | 'error'>('idle');
const listError = ref<string | null>(null);
const deleteError = ref<string | null>(null);

let active = true;
const controller = new AbortController();

async function loadPasskeys(): Promise<void> {
    phase.value = 'loading';
    listError.value = null;

    try {
        const nextPasskeys = await fetchPasskeys({
            signal: controller.signal,
        });

        if (!active) {
            return;
        }

        passkeys.value = nextPasskeys;
        phase.value = 'ready';
    } catch (error) {
        if (!active || isRequestAborted(error)) {
            return;
        }

        listError.value = normalizeApiError(error).message;
        phase.value = 'error';
    }
}

onMounted(() => {
    if (!props.canManagePasskeys) {
        return;
    }

    void loadPasskeys();
});

onUnmounted(() => {
    active = false;
    controller.abort();
});

async function handleRegisterSuccess(): Promise<void> {
    await loadPasskeys();
}

async function handleDelete(id: number, onError: () => void): Promise<void> {
    deleteError.value = null;

    try {
        await deletePasskey(id);
        await loadPasskeys();
    } catch (error) {
        if (navigateToConfirmPasswordIfRequired(error, router, from)) {
            onError();

            return;
        }

        deleteError.value = normalizeApiError(error).message;
        onError();
    }
}
</script>

<template>
    <div v-if="canManagePasskeys" class="space-y-6" data-test="manage-passkeys">
        <Heading
            variant="small"
            title="Passkeys"
            description="Manage your passkeys for passwordless sign-in"
        />

        <AlertError v-if="deleteError" :errors="[deleteError]" />

        <div
            v-if="phase === 'loading'"
            class="border-border overflow-hidden rounded-lg border p-4"
            aria-busy="true"
            aria-label="Loading passkeys"
            data-testid="passkeys-list-skeleton"
        >
            <Skeleton class="h-16 w-full" />
        </div>

        <AlertError
            v-else-if="phase === 'error' && listError"
            :errors="[listError]"
            data-test="passkeys-list-error"
        />

        <template v-else-if="phase === 'ready'">
            <div class="border-border overflow-hidden rounded-lg border">
                <template v-if="passkeys.length">
                    <PasskeyItem
                        v-for="passkey in passkeys"
                        :key="passkey.id"
                        :passkey="passkey"
                        data-test="passkey-item"
                        @remove="handleDelete"
                    />
                </template>

                <div
                    v-else
                    class="p-8 text-center"
                    data-test="passkeys-empty-state"
                >
                    <div
                        class="bg-muted mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                    >
                        <KeyRound
                            class="text-muted-foreground h-7 w-7"
                            aria-hidden="true"
                        />
                    </div>
                    <p class="font-medium">No passkeys yet</p>
                    <p class="text-muted-foreground mt-1 text-sm">
                        Add a passkey to sign in without a password
                    </p>
                </div>
            </div>

            <PasskeyRegister @success="handleRegisterSuccess" />
        </template>
    </div>
</template>
