<script setup lang="ts">
import { ShieldCheck } from '@lucide/vue';
import { onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AlertError from '@/components/AlertError.vue';
import Heading from '@/components/Heading.vue';
import TwoFactorRecoveryCodes from '@/components/TwoFactorRecoveryCodes.vue';
import TwoFactorSetupModal from '@/components/TwoFactorSetupModal.vue';
import { Button } from '@/components/ui/button';
import { useTwoFactorAuth } from '@/composables/useTwoFactorAuth';
import { normalizeApiError } from '@/lib/http';
import { locationToPath } from '@/lib/navigation';
import { navigateToConfirmPasswordIfRequired } from '@/lib/password-confirmation';
import { disableTwoFactor, enableTwoFactor } from '@/lib/settings-api';

export type Props = {
    canManageTwoFactor?: boolean;
    requiresConfirmation?: boolean;
    twoFactorEnabled?: boolean;
};

const props = withDefaults(defineProps<Props>(), {
    canManageTwoFactor: false,
    requiresConfirmation: false,
    twoFactorEnabled: false,
});

const emit = defineEmits<{
    updated: [];
}>();

const {
    qrCodeSvg,
    hasSetupData,
    manualSetupKey,
    clearSetupData,
    clearTwoFactorAuthData,
    fetchSetupData,
    recoveryCodesList,
    fetchRecoveryCodes,
    errors,
} = useTwoFactorAuth();

const router = useRouter();
const route = useRoute();
const from = locationToPath(route);
const showSetupModal = ref(false);
const processing = ref(false);
const actionError = ref<string | null>(null);
const prevTwoFactorEnabled = ref(props.twoFactorEnabled);

watch(
    () => props.twoFactorEnabled,
    (enabled) => {
        if (prevTwoFactorEnabled.value && !enabled) {
            clearTwoFactorAuthData();
        }

        prevTwoFactorEnabled.value = enabled;
    },
);

onUnmounted(() => {
    clearTwoFactorAuthData();
});

async function onUpdated(): Promise<void> {
    emit('updated');
}

async function runAction(action: () => Promise<void>): Promise<boolean> {
    processing.value = true;
    actionError.value = null;

    try {
        await action();
        await onUpdated();

        return true;
    } catch (error) {
        if (navigateToConfirmPasswordIfRequired(error, router, from)) {
            return false;
        }

        actionError.value = normalizeApiError(error).message;

        return false;
    } finally {
        processing.value = false;
    }
}

async function handleEnable(): Promise<void> {
    if (await runAction(enableTwoFactor)) {
        showSetupModal.value = true;
    }
}

async function handleDisable(): Promise<void> {
    await runAction(disableTwoFactor);
}
</script>

<template>
    <div v-if="canManageTwoFactor" class="space-y-6">
        <Heading
            variant="small"
            title="Two-factor authentication"
            description="Manage your two-factor authentication settings"
        />

        <AlertError v-if="actionError" :errors="[actionError]" />

        <div
            v-if="twoFactorEnabled"
            class="flex flex-col items-start justify-start space-y-4"
        >
            <p class="text-muted-foreground text-sm">
                You will be prompted for a secure, random pin during login,
                which you can retrieve from the TOTP-supported application on
                your phone.
            </p>

            <div class="relative inline">
                <Button
                    variant="destructive"
                    type="button"
                    :disabled="processing"
                    @click="handleDisable"
                >
                    Disable 2FA
                </Button>
            </div>

            <TwoFactorRecoveryCodes
                :recovery-codes-list="recoveryCodesList"
                :fetch-recovery-codes="fetchRecoveryCodes"
                :errors="errors"
            />
        </div>

        <div v-else class="flex flex-col items-start justify-start space-y-4">
            <p class="text-muted-foreground text-sm">
                When you enable two-factor authentication, you will be prompted
                for a secure pin during login. This pin can be retrieved from a
                TOTP-supported application on your phone.
            </p>

            <div>
                <Button
                    v-if="hasSetupData"
                    type="button"
                    @click="showSetupModal = true"
                >
                    <ShieldCheck />
                    Continue setup
                </Button>
                <Button
                    v-else
                    type="button"
                    :disabled="processing"
                    @click="handleEnable"
                >
                    Enable 2FA
                </Button>
            </div>
        </div>

        <TwoFactorSetupModal
            v-model:is-open="showSetupModal"
            :requires-confirmation="requiresConfirmation"
            :two-factor-enabled="twoFactorEnabled"
            :qr-code-svg="qrCodeSvg"
            :manual-setup-key="manualSetupKey"
            :clear-setup-data="clearSetupData"
            :fetch-setup-data="fetchSetupData"
            :errors="errors"
            @confirmed="onUpdated"
        />
    </div>
</template>
