<script setup lang="ts">
import { Eye, EyeOff, LockKeyhole, RefreshCw } from '@lucide/vue';
import { computed, nextTick, ref, useTemplateRef } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AlertError from '@/components/AlertError.vue';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { useTwoFactorAuth } from '@/composables/useTwoFactorAuth';
import { normalizeApiError } from '@/lib/http';
import { locationToPath } from '@/lib/navigation';
import { navigateToConfirmPasswordIfRequired } from '@/lib/password-confirmation';
import { regenerateRecoveryCodes } from '@/lib/settings-api';

type Props = {
    recoveryCodesList?: string[];
    fetchRecoveryCodes?: () => Promise<void>;
    errors?: string[];
};

const props = defineProps<Props>();

const twoFactor = useTwoFactorAuth();
const recoveryCodesList = computed(
    () => props.recoveryCodesList ?? twoFactor.recoveryCodesList.value,
);
const fetchRecoveryCodes =
    props.fetchRecoveryCodes ?? twoFactor.fetchRecoveryCodes;
const errors = computed(() => props.errors ?? twoFactor.errors.value);

const codesAreVisible = ref(false);
const isLoadingCodes = ref(false);
const processing = ref(false);
const regenerateError = ref<string | null>(null);
const codesSectionRef = useTemplateRef('codesSectionRef');
const router = useRouter();
const route = useRoute();
const from = locationToPath(route);

const canRegenerateCodes = computed(
    () => recoveryCodesList.value.length > 0 && codesAreVisible.value,
);

const visibleErrors = computed(() =>
    regenerateError.value
        ? [...errors.value, regenerateError.value]
        : errors.value,
);

async function toggleCodesVisibility(): Promise<void> {
    const nextVisible = !codesAreVisible.value;

    if (nextVisible && !recoveryCodesList.value.length) {
        isLoadingCodes.value = true;

        try {
            await fetchRecoveryCodes();
        } finally {
            isLoadingCodes.value = false;
        }
    }

    codesAreVisible.value = nextVisible;

    if (nextVisible) {
        await nextTick();
        codesSectionRef.value?.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
        });
    }
}

async function handleRegenerate(): Promise<void> {
    processing.value = true;
    regenerateError.value = null;

    try {
        await regenerateRecoveryCodes();
        await fetchRecoveryCodes();
        codesAreVisible.value = true;
    } catch (error) {
        if (navigateToConfirmPasswordIfRequired(error, router, from)) {
            return;
        }

        regenerateError.value = normalizeApiError(error).message;
    } finally {
        processing.value = false;
    }
}
</script>

<template>
    <Card>
        <CardHeader>
            <CardTitle class="flex gap-3">
                <LockKeyhole class="size-4" aria-hidden="true" />
                2FA recovery codes
            </CardTitle>
            <CardDescription>
                Recovery codes let you regain access if you lose your 2FA
                device. Store them in a secure password manager.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <div
                class="flex flex-col gap-3 select-none sm:flex-row sm:items-center sm:justify-between"
            >
                <Button
                    type="button"
                    class="w-fit"
                    :aria-expanded="codesAreVisible"
                    aria-controls="recovery-codes-section"
                    :disabled="isLoadingCodes"
                    @click="toggleCodesVisibility"
                >
                    <component
                        :is="codesAreVisible ? EyeOff : Eye"
                        class="size-4"
                        aria-hidden="true"
                    />
                    {{ codesAreVisible ? 'Hide' : 'View' }} recovery codes
                </Button>

                <Button
                    v-if="canRegenerateCodes"
                    variant="secondary"
                    type="button"
                    :disabled="processing"
                    aria-describedby="regenerate-warning"
                    @click="handleRegenerate"
                >
                    <RefreshCw /> Regenerate codes
                </Button>
            </div>
            <div
                id="recovery-codes-section"
                :class="[
                    'relative overflow-hidden transition-all duration-300',
                    codesAreVisible ? 'h-auto opacity-100' : 'h-0 opacity-0',
                ]"
                :aria-hidden="!codesAreVisible"
            >
                <div class="mt-3 space-y-3">
                    <AlertError
                        v-if="visibleErrors.length"
                        :errors="visibleErrors"
                    />
                    <template v-else>
                        <div
                            ref="codesSectionRef"
                            class="bg-muted grid gap-1 rounded-lg p-4 font-mono text-sm"
                            role="list"
                            aria-label="Recovery codes"
                        >
                            <template v-if="recoveryCodesList.length">
                                <div
                                    v-for="(code, index) in recoveryCodesList"
                                    :key="index"
                                    role="listitem"
                                    class="select-text"
                                >
                                    {{ code }}
                                </div>
                            </template>
                            <div
                                v-else
                                class="space-y-2"
                                aria-label="Loading recovery codes"
                            >
                                <div
                                    v-for="n in 8"
                                    :key="n"
                                    class="bg-muted-foreground/20 h-4 animate-pulse rounded"
                                    aria-hidden="true"
                                />
                            </div>
                        </div>

                        <div class="text-muted-foreground text-xs select-none">
                            <p id="regenerate-warning">
                                Each recovery code can be used once to access
                                your account and will be removed after use. If
                                you need more, click
                                <span class="font-bold">Regenerate codes</span>
                                above.
                            </p>
                        </div>
                    </template>
                </div>
            </div>
        </CardContent>
    </Card>
</template>
