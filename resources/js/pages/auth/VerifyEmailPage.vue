<script setup lang="ts">
import { useAuth } from '@/auth/use-auth';
import DocumentTitle from '@/components/DocumentTitle.vue';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useForm } from '@/composables/useForm';
import AuthLayout from '@/layouts/AuthLayout.vue';
import { resendVerificationEmail } from '@/lib/auth-api';
import { watchEffect } from 'vue';
import { useRouter } from 'vue-router';

const { isVerified, logout } = useAuth();
const router = useRouter();

const form = useForm({});

watchEffect(() => {
    if (isVerified.value) {
        void router.replace('/dashboard');
    }
});

async function onResend(): Promise<void> {
    try {
        await form.submit(async () => {
            return await resendVerificationEmail();
        });
    } catch {
        // Errors are mapped onto the form.
    }
}

async function onLogout(): Promise<void> {
    await logout();
    await router.replace('/login');
}
</script>

<template>
    <AuthLayout
        title="Email verification"
        description="Please verify your email address by clicking on the link we just emailed to you."
    >
        <DocumentTitle title="Email verification" />

        <div
            v-if="form.status === 'verification-link-sent'"
            class="mb-4 text-center text-sm font-medium text-green-600"
        >
            A new verification link has been sent to the email address you
            provided during registration.
        </div>

        <p
            v-if="form.formError"
            class="mb-4 text-center text-sm text-red-600 dark:text-red-500"
            role="alert"
        >
            {{ form.formError }}
        </p>

        <div class="space-y-6 text-center">
            <Button
                type="button"
                variant="secondary"
                :disabled="form.processing"
                @click="onResend"
            >
                <Spinner v-if="form.processing" />
                Resend verification email
            </Button>

            <button
                type="button"
                class="text-foreground mx-auto block text-sm underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                @click="onLogout"
            >
                Log out
            </button>
        </div>
    </AuthLayout>
</template>
