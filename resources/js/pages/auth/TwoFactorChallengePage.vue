<script setup lang="ts">
import { useAuth } from '@/auth/use-auth';
import DocumentTitle from '@/components/DocumentTitle.vue';
import InputError from '@/components/InputError.vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from '@/components/ui/input-otp';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { fieldDescribedBy, fieldErrorId, useForm } from '@/composables/useForm';
import AuthLayout from '@/layouts/AuthLayout.vue';
import { submitTwoFactorChallenge } from '@/lib/auth-api';
import { getPostAuthPath, historyStateFrom } from '@/lib/navigation';
import type { TwoFactorConfigContent } from '@/types/ui';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

const { refreshUser } = useAuth();
const router = useRouter();

const showRecoveryInput = ref(false);
const code = ref('');

const form = useForm({
    recovery_code: '',
});

const intended = getPostAuthPath(historyStateFrom(), '/dashboard');

const authConfigContent = computed<TwoFactorConfigContent>(() => {
    if (showRecoveryInput.value) {
        return {
            title: 'Recovery code',
            description:
                'Please confirm access to your account by entering one of your emergency recovery codes.',
            buttonText: 'login using an authentication code',
        };
    }

    return {
        title: 'Authentication code',
        description:
            'Enter the authentication code provided by your authenticator application.',
        buttonText: 'login using a recovery code',
    };
});

function toggleRecoveryMode(): void {
    showRecoveryInput.value = !showRecoveryInput.value;
    form.clearErrors();
    code.value = '';
    form.reset('recovery_code');
}

async function onSubmitCode(): Promise<void> {
    try {
        await form.submit(async () => {
            await submitTwoFactorChallenge({ code: code.value });
            code.value = '';

            const user = await refreshUser();

            if (user && user.email_verified_at === null) {
                await router.replace('/verify-email');

                return;
            }

            await router.replace(intended);
        });
    } catch {
        code.value = '';
    }
}

async function onSubmitRecovery(): Promise<void> {
    try {
        await form.submit(async (data) => {
            await submitTwoFactorChallenge({
                recovery_code: data.recovery_code,
            });
            form.reset('recovery_code');

            const user = await refreshUser();

            if (user && user.email_verified_at === null) {
                await router.replace('/verify-email');

                return;
            }

            await router.replace(intended);
        });
    } catch {
        // Errors are mapped onto the form.
    }
}
</script>

<template>
    <AuthLayout
        :title="authConfigContent.title"
        :description="authConfigContent.description"
    >
        <DocumentTitle title="Two-factor authentication" />

        <div class="space-y-6">
            <template v-if="!showRecoveryInput">
                <form
                    class="space-y-4"
                    novalidate
                    @submit.prevent="onSubmitCode"
                >
                    <div
                        class="flex flex-col items-center justify-center space-y-3 text-center"
                    >
                        <div class="flex w-full items-center justify-center">
                            <InputOTP
                                id="otp"
                                v-model="code"
                                :maxlength="6"
                                :disabled="form.processing"
                                autofocus
                                :aria-invalid="Boolean(form.errors.code)"
                                :aria-describedby="
                                    fieldDescribedBy('code', form.errors)
                                "
                            >
                                <InputOTPGroup>
                                    <InputOTPSlot
                                        v-for="index in 6"
                                        :key="index"
                                        :index="index - 1"
                                    />
                                </InputOTPGroup>
                            </InputOTP>
                        </div>
                        <InputError
                            :id="fieldErrorId('code')"
                            :message="form.errors.code"
                        />
                    </div>
                    <Button
                        type="submit"
                        class="w-full"
                        :disabled="form.processing || code.length < 6"
                    >
                        <Spinner v-if="form.processing" />
                        Continue
                    </Button>
                    <div class="text-muted-foreground text-center text-sm">
                        <span>or you can </span>
                        <button
                            type="button"
                            class="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                            @click="toggleRecoveryMode"
                        >
                            {{ authConfigContent.buttonText }}
                        </button>
                    </div>
                </form>
            </template>

            <template v-else>
                <form
                    class="space-y-4"
                    novalidate
                    @submit.prevent="onSubmitRecovery"
                >
                    <div class="grid gap-2">
                        <Label for="recovery_code">Recovery code</Label>
                        <Input
                            id="recovery_code"
                            v-model="form.data.recovery_code"
                            name="recovery_code"
                            type="text"
                            placeholder="Enter recovery code"
                            autofocus
                            required
                            :aria-invalid="Boolean(form.errors.recovery_code)"
                            :aria-describedby="
                                fieldDescribedBy('recovery_code', form.errors)
                            "
                            :disabled="form.processing"
                        />
                        <InputError
                            :id="fieldErrorId('recovery_code')"
                            :message="form.errors.recovery_code"
                        />
                    </div>
                    <Button
                        type="submit"
                        class="w-full"
                        :disabled="form.processing"
                    >
                        <Spinner v-if="form.processing" />
                        Continue
                    </Button>

                    <div class="text-muted-foreground text-center text-sm">
                        <span>or you can </span>
                        <button
                            type="button"
                            class="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                            @click="toggleRecoveryMode"
                        >
                            {{ authConfigContent.buttonText }}
                        </button>
                    </div>
                </form>
            </template>
        </div>
    </AuthLayout>
</template>
