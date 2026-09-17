<script setup lang="ts">
import { useAuth } from '@/auth/use-auth';
import DocumentTitle from '@/components/DocumentTitle.vue';
import InputError from '@/components/InputError.vue';
import PasswordInput from '@/components/PasswordInput.vue';
import TextLink from '@/components/TextLink.vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { fieldDescribedBy, fieldErrorId, useForm } from '@/composables/useForm';
import AuthLayout from '@/layouts/AuthLayout.vue';
import { register as registerRequest } from '@/lib/auth-api';
import { useRouter } from 'vue-router';

const { refreshUser } = useAuth();
const router = useRouter();

const form = useForm({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
});

async function onSubmit(): Promise<void> {
    try {
        await form.submit(async (data) => {
            await registerRequest(data);
            form.reset('password', 'password_confirmation');

            const user = await refreshUser();

            if (user && user.email_verified_at === null) {
                await router.replace('/verify-email');

                return;
            }

            await router.replace('/dashboard');
        });
    } catch {
        // Errors are mapped onto the form.
    }
}
</script>

<template>
    <AuthLayout
        title="Create an account"
        description="Enter your details below to create your account"
    >
        <DocumentTitle title="Register" />

        <p
            v-if="form.formError && Object.keys(form.errors).length === 0"
            class="mb-4 text-center text-sm text-red-600 dark:text-red-500"
            role="alert"
        >
            {{ form.formError }}
        </p>

        <form class="flex flex-col gap-6" novalidate @submit.prevent="onSubmit">
            <div class="grid gap-6">
                <div class="grid gap-2">
                    <Label for="name">Name</Label>
                    <Input
                        id="name"
                        v-model="form.data.name"
                        type="text"
                        required
                        autofocus
                        :tabindex="1"
                        autocomplete="name"
                        name="name"
                        placeholder="Full name"
                        :aria-invalid="Boolean(form.errors.name)"
                        :aria-describedby="
                            fieldDescribedBy('name', form.errors)
                        "
                        :disabled="form.processing"
                    />
                    <InputError
                        :id="fieldErrorId('name')"
                        :message="form.errors.name"
                    />
                </div>

                <div class="grid gap-2">
                    <Label for="email">Email address</Label>
                    <Input
                        id="email"
                        v-model="form.data.email"
                        type="email"
                        required
                        :tabindex="2"
                        autocomplete="email"
                        name="email"
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

                <div class="grid gap-2">
                    <Label for="password">Password</Label>
                    <PasswordInput
                        id="password"
                        v-model="form.data.password"
                        required
                        :tabindex="3"
                        autocomplete="new-password"
                        name="password"
                        placeholder="Password"
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

                <div class="grid gap-2">
                    <Label for="password_confirmation">Confirm password</Label>
                    <PasswordInput
                        id="password_confirmation"
                        v-model="form.data.password_confirmation"
                        required
                        :tabindex="4"
                        autocomplete="new-password"
                        name="password_confirmation"
                        placeholder="Confirm password"
                        :aria-invalid="
                            Boolean(form.errors.password_confirmation)
                        "
                        :aria-describedby="
                            fieldDescribedBy(
                                'password_confirmation',
                                form.errors,
                            )
                        "
                        :disabled="form.processing"
                    />
                    <InputError
                        :id="fieldErrorId('password_confirmation')"
                        :message="form.errors.password_confirmation"
                    />
                </div>

                <Button
                    type="submit"
                    class="mt-2 w-full"
                    :tabindex="5"
                    :disabled="form.processing"
                    data-test="register-user-button"
                >
                    <Spinner v-if="form.processing" />
                    Create account
                </Button>
            </div>

            <div class="text-muted-foreground text-center text-sm">
                Already have an account?
                <TextLink to="/login" :tabindex="6">Log in</TextLink>
            </div>
        </form>
    </AuthLayout>
</template>
