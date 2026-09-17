<script setup lang="ts">
import DocumentTitle from '@/components/DocumentTitle.vue';
import InputError from '@/components/InputError.vue';
import TextLink from '@/components/TextLink.vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { fieldDescribedBy, fieldErrorId, useForm } from '@/composables/useForm';
import AuthLayout from '@/layouts/AuthLayout.vue';
import { requestPasswordReset } from '@/lib/auth-api';

const form = useForm({
    email: '',
});

async function onSubmit(): Promise<void> {
    try {
        await form.submit(async (data) => {
            return await requestPasswordReset(data.email);
        });
    } catch {
        // Errors are mapped onto the form.
    }
}
</script>

<template>
    <AuthLayout
        title="Forgot password"
        description="Enter your email to receive a password reset link"
    >
        <DocumentTitle title="Forgot password" />

        <div
            v-if="form.status"
            class="mb-4 text-center text-sm font-medium text-green-600"
        >
            {{ form.status }}
        </div>

        <div class="space-y-6">
            <form novalidate @submit.prevent="onSubmit">
                <div class="grid gap-2">
                    <Label for="email">Email address</Label>
                    <Input
                        id="email"
                        v-model="form.data.email"
                        type="email"
                        name="email"
                        autocomplete="off"
                        autofocus
                        placeholder="email@example.com"
                        :aria-invalid="Boolean(form.errors.email)"
                        :aria-describedby="
                            fieldDescribedBy('email', form.errors)
                        "
                        :disabled="form.processing"
                    />
                    <InputError
                        :id="fieldErrorId('email')"
                        :message="form.errors.email"
                    />
                </div>

                <div class="my-6 flex items-center justify-start">
                    <Button
                        type="submit"
                        class="w-full"
                        :disabled="form.processing"
                        data-test="email-password-reset-link-button"
                    >
                        <Spinner v-if="form.processing" />
                        Email password reset link
                    </Button>
                </div>
            </form>

            <div class="text-muted-foreground space-x-1 text-center text-sm">
                <span>Or, return to</span>
                <TextLink to="/login">log in</TextLink>
            </div>
        </div>
    </AuthLayout>
</template>
