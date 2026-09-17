<script setup lang="ts">
import { useAuth } from '@/auth/use-auth';
import DocumentTitle from '@/components/DocumentTitle.vue';
import InputError from '@/components/InputError.vue';
import PasswordInput from '@/components/PasswordInput.vue';
import TextLink from '@/components/TextLink.vue';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { fieldDescribedBy, fieldErrorId, useForm } from '@/composables/useForm';
import AuthLayout from '@/layouts/AuthLayout.vue';
import { login as loginRequest } from '@/lib/auth-api';
import {
    getPostAuthPath,
    historyStateFrom,
    historyStateStatus,
} from '@/lib/navigation';
import { useRouter } from 'vue-router';

const canResetPassword = true;
const canRegister = true;

const { refreshUser } = useAuth();
const router = useRouter();

const form = useForm({
    email: '',
    password: '',
    remember: false as boolean,
});

const flashStatus = historyStateStatus() ?? null;
const intended = getPostAuthPath(historyStateFrom(), '/dashboard');

async function onSubmit(): Promise<void> {
    try {
        await form.submit(async (data) => {
            const result = await loginRequest({
                email: data.email,
                password: data.password,
                remember: data.remember,
            });

            if (result.two_factor) {
                await router.replace({
                    path: '/two-factor-challenge',
                    state: { from: intended },
                });

                return;
            }

            form.reset('password');

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
        title="Log in to your account"
        description="Enter your email and password below to log in"
    >
        <DocumentTitle title="Log in" />

        <div
            v-if="flashStatus || form.status"
            class="mb-4 text-center text-sm font-medium text-green-600"
        >
            {{ flashStatus ?? form.status }}
        </div>

        <p
            v-if="form.formError && !form.errors.email && !form.errors.password"
            class="mb-4 text-center text-sm text-red-600 dark:text-red-500"
            role="alert"
        >
            {{ form.formError }}
        </p>

        <form class="flex flex-col gap-6" novalidate @submit.prevent="onSubmit">
            <div class="grid gap-6">
                <div class="grid gap-2">
                    <Label for="email">Email address</Label>
                    <Input
                        id="email"
                        v-model="form.data.email"
                        type="email"
                        name="email"
                        required
                        autofocus
                        :tabindex="1"
                        autocomplete="email"
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
                    <div class="flex items-center">
                        <Label for="password">Password</Label>
                        <TextLink
                            v-if="canResetPassword"
                            to="/forgot-password"
                            class="ml-auto text-sm"
                            :tabindex="5"
                        >
                            Forgot your password?
                        </TextLink>
                    </div>
                    <PasswordInput
                        id="password"
                        v-model="form.data.password"
                        name="password"
                        required
                        :tabindex="2"
                        autocomplete="current-password"
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

                <div class="flex items-center justify-between">
                    <Label for="remember" class="flex items-center space-x-3">
                        <Checkbox
                            id="remember"
                            :checked="form.data.remember"
                            :tabindex="3"
                            :disabled="form.processing"
                            @update:checked="
                                (value: boolean | 'indeterminate') =>
                                    form.setField('remember', value === true)
                            "
                        />
                        <span>Remember me</span>
                    </Label>
                </div>

                <Button
                    type="submit"
                    class="mt-4 w-full"
                    :tabindex="4"
                    :disabled="form.processing"
                    data-test="login-button"
                >
                    <Spinner v-if="form.processing" />
                    Log in
                </Button>
            </div>

            <div
                v-if="canRegister"
                class="text-muted-foreground text-center text-sm"
            >
                Don't have an account?
                <TextLink to="/register" :tabindex="5">Sign up</TextLink>
            </div>
        </form>
    </AuthLayout>
</template>
