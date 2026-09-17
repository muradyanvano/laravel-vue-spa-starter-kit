<script setup lang="ts">
import { useClipboard } from '@vueuse/core';
import { Check, Copy, ScanLine } from '@lucide/vue';
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue';
import AlertError from '@/components/AlertError.vue';
import InputError from '@/components/InputError.vue';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from '@/components/ui/input-otp';
import { Spinner } from '@/components/ui/spinner';
import { useAppearance } from '@/composables/useAppearance';
import { useForm } from '@/composables/useForm';
import { OTP_MAX_LENGTH } from '@/composables/useTwoFactorAuth';
import { confirmTwoFactor } from '@/lib/settings-api';
import type { TwoFactorConfigContent } from '@/types';

type Props = {
    requiresConfirmation: boolean;
    twoFactorEnabled: boolean;
    qrCodeSvg?: string | null;
    manualSetupKey?: string | null;
    clearSetupData?: () => void;
    fetchSetupData?: () => Promise<void>;
    errors?: string[];
};

const props = withDefaults(defineProps<Props>(), {
    qrCodeSvg: null,
    manualSetupKey: null,
    clearSetupData: () => undefined,
    fetchSetupData: async () => undefined,
    errors: () => [],
});

const isOpen = defineModel<boolean>('isOpen', { default: false });

const emit = defineEmits<{
    confirmed: [];
}>();

const { resolvedAppearance } = useAppearance();
const { copy, copied } = useClipboard();

const showVerificationStep = ref(false);
const pinInputContainerRef = useTemplateRef('pinInputContainerRef');
const form = useForm({ code: '' });

const modalConfig = computed<TwoFactorConfigContent>(() => {
    if (props.twoFactorEnabled) {
        return {
            title: 'Two-factor authentication enabled',
            description:
                'Two-factor authentication is now enabled. Scan the QR code or enter the setup key in your authenticator app.',
            buttonText: 'Close',
        };
    }

    if (showVerificationStep.value) {
        return {
            title: 'Verify authentication code',
            description: 'Enter the 6-digit code from your authenticator app',
            buttonText: 'Continue',
        };
    }

    return {
        title: 'Enable two-factor authentication',
        description:
            'To finish enabling two-factor authentication, scan the QR code or enter the setup key in your authenticator app',
        buttonText: 'Continue',
    };
});

function resetModalState(): void {
    if (props.twoFactorEnabled) {
        props.clearSetupData();
    }

    showVerificationStep.value = false;
    form.reset();
    form.clearErrors();
}

function handleClose(): void {
    resetModalState();
    isOpen.value = false;
}

function handleModalNextStep(): void {
    if (props.requiresConfirmation) {
        showVerificationStep.value = true;

        nextTick(() => {
            pinInputContainerRef.value?.querySelector('input')?.focus();
        });

        return;
    }

    props.clearSetupData();
    handleClose();
}

async function onConfirm(): Promise<void> {
    try {
        await form.submit(async (data) => {
            await confirmTwoFactor({ code: data.code });
            emit('confirmed');
            handleClose();
        });
    } catch {
        form.setField('code', '');
    }
}

watch(isOpen, async (open) => {
    if (!open) {
        resetModalState();

        return;
    }

    if (!props.qrCodeSvg) {
        await props.fetchSetupData();
    }
});
</script>

<template>
    <Dialog :open="isOpen" @update:open="(open) => !open && handleClose()">
        <DialogContent class="sm:max-w-md">
            <DialogHeader class="flex items-center justify-center">
                <div
                    class="border-border bg-card mb-3 w-auto rounded-full border p-0.5 shadow-sm"
                >
                    <div
                        class="border-border bg-muted relative overflow-hidden rounded-full border p-2.5"
                    >
                        <div
                            class="absolute inset-0 grid grid-cols-5 opacity-50"
                        >
                            <div
                                v-for="i in 5"
                                :key="`col-${i}`"
                                class="border-border border-r last:border-r-0"
                            />
                        </div>
                        <div
                            class="absolute inset-0 grid grid-rows-5 opacity-50"
                        >
                            <div
                                v-for="i in 5"
                                :key="`row-${i}`"
                                class="border-border border-b last:border-b-0"
                            />
                        </div>
                        <ScanLine
                            class="text-foreground relative z-20 size-6"
                        />
                    </div>
                </div>
                <DialogTitle>{{ modalConfig.title }}</DialogTitle>
                <DialogDescription class="text-center">
                    {{ modalConfig.description }}
                </DialogDescription>
            </DialogHeader>

            <div
                class="relative flex w-auto flex-col items-center justify-center space-y-5"
            >
                <template v-if="!showVerificationStep">
                    <AlertError v-if="errors?.length" :errors="errors" />
                    <template v-else>
                        <div
                            class="relative mx-auto flex max-w-md items-center overflow-hidden"
                        >
                            <div
                                class="border-border relative mx-auto aspect-square w-64 overflow-hidden rounded-lg border"
                            >
                                <div
                                    v-if="!qrCodeSvg"
                                    class="bg-background absolute inset-0 z-10 flex aspect-square h-auto w-full animate-pulse items-center justify-center"
                                >
                                    <Spinner class="size-6" />
                                </div>
                                <div
                                    v-else
                                    class="relative z-10 overflow-hidden border p-5"
                                >
                                    <div
                                        v-html="qrCodeSvg"
                                        class="flex aspect-square size-full items-center justify-center"
                                        :style="{
                                            filter:
                                                resolvedAppearance === 'dark'
                                                    ? 'invert(1) brightness(1.5)'
                                                    : undefined,
                                        }"
                                    />
                                </div>
                            </div>
                        </div>

                        <div class="flex w-full items-center space-x-5">
                            <Button class="w-full" @click="handleModalNextStep">
                                {{ modalConfig.buttonText }}
                            </Button>
                        </div>

                        <div
                            class="relative flex w-full items-center justify-center"
                        >
                            <div
                                class="bg-border absolute inset-0 top-1/2 h-px w-full"
                            />
                            <span class="bg-card relative px-2 py-1">
                                or, enter the code manually
                            </span>
                        </div>

                        <div
                            class="flex w-full items-center justify-center space-x-2"
                        >
                            <div
                                class="border-border flex w-full items-stretch overflow-hidden rounded-xl border"
                            >
                                <div
                                    v-if="!manualSetupKey"
                                    class="bg-muted flex h-full w-full items-center justify-center p-3"
                                >
                                    <Spinner />
                                </div>
                                <template v-else>
                                    <input
                                        type="text"
                                        readonly
                                        :value="manualSetupKey"
                                        class="bg-background text-foreground h-full w-full p-3"
                                    />
                                    <button
                                        type="button"
                                        class="border-border hover:bg-muted relative block h-auto border-l px-3"
                                        @click="copy(manualSetupKey || '')"
                                    >
                                        <Check
                                            v-if="copied"
                                            class="w-4 text-green-500"
                                        />
                                        <Copy v-else class="w-4" />
                                    </button>
                                </template>
                            </div>
                        </div>
                    </template>
                </template>

                <template v-else>
                    <form class="w-full" novalidate @submit.prevent="onConfirm">
                        <div
                            ref="pinInputContainerRef"
                            class="relative w-full space-y-3"
                        >
                            <div
                                class="flex w-full flex-col items-center justify-center space-y-3 py-2"
                            >
                                <InputOTP
                                    id="otp"
                                    v-model="form.data.code"
                                    :maxlength="OTP_MAX_LENGTH"
                                    :disabled="form.processing"
                                    autofocus
                                >
                                    <InputOTPGroup>
                                        <InputOTPSlot
                                            v-for="index in OTP_MAX_LENGTH"
                                            :key="index"
                                            :index="index - 1"
                                        />
                                    </InputOTPGroup>
                                </InputOTP>
                                <InputError
                                    :message="
                                        form.errors.code ??
                                        form.formError ??
                                        undefined
                                    "
                                />
                            </div>

                            <div class="flex w-full items-center space-x-5">
                                <Button
                                    type="button"
                                    variant="outline"
                                    class="w-auto flex-1"
                                    :disabled="form.processing"
                                    @click="showVerificationStep = false"
                                >
                                    Back
                                </Button>
                                <Button
                                    type="submit"
                                    class="w-auto flex-1"
                                    :disabled="
                                        form.processing ||
                                        form.data.code.length < OTP_MAX_LENGTH
                                    "
                                >
                                    Confirm
                                </Button>
                            </div>
                        </div>
                    </form>
                </template>
            </div>
        </DialogContent>
    </Dialog>
</template>
