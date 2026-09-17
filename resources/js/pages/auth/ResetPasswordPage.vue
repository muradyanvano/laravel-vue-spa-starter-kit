<script setup lang="ts">
import DocumentTitle from '@/components/DocumentTitle.vue';
import InputError from '@/components/InputError.vue';
import PasswordInput from '@/components/PasswordInput.vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { fieldDescribedBy, fieldErrorId, useForm } from '@/composables/useForm';
import AuthLayout from '@/layouts/AuthLayout.vue';
import { resetPassword } from '@/lib/auth-api';
import { computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const token = computed(() => String(route.params.token ?? ''));
const emailFromQuery = computed(() => {
    const value = route.query.email;

    return typeof value === 'string' ? value : '';
});

const form = useForm({
    email: emailFromQuery.value,
    password: '',
    password_confirmation: '',
});

watch(
    emailFromQuery,
    (value) => {
        if (value.length > 0) {
            form.data.email = value;
        }
    },
    { immediate: true },
);

async function onSubmit(): Promise<void> {
    try {
        await form.submit(async (data) => {
            const status = await resetPassword({
                token: token.value,
                email: data.email,
                password: data.password,
                password_confirmation: data.password_confirmation,
            });

            form.reset('password', 'password_confirmation');

            await router.replace({
                path: '/login',
                state: { status },
            });
        });
    } catch {
        // Errors are mapped onto the form.
    }
}
</script>

<template>
    <AuthLayout
        title="Reset password"
        description="Please enter your new password below"
    >
        <DocumentTitle title="Reset password" />

        <form novalidate @submit.prevent="onSubmit">
            <div class="grid gap-6">
                <div class="grid gap-2">
                    <Label for="email">Email</Label>
                    <Input
                        id="email"
                        v-model="form.data.email"
                        type="email"
                        name="email"
                        autocomplete="email"
                        readonly
                        class="block w-full"
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
                        name="password"
                        autocomplete="new-password"
                        class="block w-full"
                        autofocus
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
                        name="password_confirmation"
                        autocomplete="new-password"
                        class="block w-full"
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
                    class="mt-4 w-full"
                    :disabled="form.processing"
                    data-test="reset-password-button"
                >
                    <Spinner v-if="form.processing" />
                    Reset password
                </Button>
            </div>
        </form>
    </AuthLayout>
</template>
