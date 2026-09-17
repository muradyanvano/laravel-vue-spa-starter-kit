<script setup lang="ts">
import DocumentTitle from '@/components/DocumentTitle.vue';
import PasskeyVerify from '@/components/PasskeyVerify.vue';
import InputError from '@/components/InputError.vue';
import PasswordInput from '@/components/PasswordInput.vue';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { fieldDescribedBy, fieldErrorId, useForm } from '@/composables/useForm';
import AuthLayout from '@/layouts/AuthLayout.vue';
import { confirmPassword } from '@/lib/auth-api';
import { PASSKEY_CONFIRM_ROUTES } from '@/lib/passkeys';
import { getPostAuthPath, historyStateFrom } from '@/lib/navigation';
import { useRouter } from 'vue-router';

const router = useRouter();

const form = useForm({
    password: '',
});

const intended = getPostAuthPath(historyStateFrom(), '/settings/security');

async function onPasskeySuccess(): Promise<void> {
    await router.replace(intended);
}

async function onSubmit(): Promise<void> {
    try {
        await form.submit(async (data) => {
            await confirmPassword({ password: data.password });
            form.reset('password');
            await router.replace(intended);
        });
    } catch {
        // Errors are mapped onto the form.
    }
}
</script>

<template>
    <AuthLayout
        title="Confirm password"
        description="This is a secure area of the application. Please confirm your password before continuing."
    >
        <DocumentTitle title="Confirm password" />

        <PasskeyVerify
            :routes="PASSKEY_CONFIRM_ROUTES"
            label="Confirm with passkey"
            loading-label="Confirming..."
            separator="Or confirm with password"
            @success="onPasskeySuccess"
        />

        <form novalidate @submit.prevent="onSubmit">
            <div class="space-y-6">
                <div class="grid gap-2">
                    <Label for="password">Password</Label>
                    <PasswordInput
                        id="password"
                        v-model="form.data.password"
                        name="password"
                        class="block w-full"
                        required
                        autocomplete="current-password"
                        autofocus
                        :aria-invalid="Boolean(form.errors.password)"
                        :aria-describedby="
                            fieldDescribedBy('password', form.errors)
                        "
                        :disabled="form.processing"
                    />
                    <InputError
                        :id="fieldErrorId('password')"
                        :message="form.errors.password"
                    />
                </div>

                <div class="flex items-center">
                    <Button
                        type="submit"
                        class="w-full"
                        :disabled="form.processing"
                        data-test="confirm-password-button"
                    >
                        <Spinner v-if="form.processing" />
                        Confirm password
                    </Button>
                </div>
            </div>
        </form>
    </AuthLayout>
</template>
