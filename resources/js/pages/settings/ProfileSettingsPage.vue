<script setup lang="ts">
import { ref } from 'vue';
import { useAuth } from '@/auth/use-auth';
import DeleteUser from '@/components/DeleteUser.vue';
import DocumentTitle from '@/components/DocumentTitle.vue';
import Heading from '@/components/Heading.vue';
import InputError from '@/components/InputError.vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fieldDescribedBy, fieldErrorId, useForm } from '@/composables/useForm';
import SettingsLayout from '@/layouts/SettingsLayout.vue';
import { resendVerificationEmail } from '@/lib/auth-api';
import { updateProfile } from '@/lib/settings-api';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Profile settings',
        href: '/settings/profile',
    },
];

const { user, refreshUser } = useAuth();
const verificationStatus = ref<string | null>(null);

const form = useForm({
    name: user.value?.name ?? '',
    email: user.value?.email ?? '',
});

async function onSubmit(): Promise<void> {
    try {
        await form.submit(async (data) => {
            await updateProfile(data);
            await refreshUser();

            return 'Profile updated.';
        });
    } catch {
        // Errors are mapped onto the form.
    }
}

async function onResendVerification(): Promise<void> {
    try {
        verificationStatus.value = await resendVerificationEmail();
    } catch {
        // Ignore resend failures here; profile form remains usable.
    }
}
</script>

<template>
    <SettingsLayout :breadcrumbs="breadcrumbs">
        <DocumentTitle title="Profile settings" />

        <h1 class="sr-only">Profile settings</h1>

        <div class="space-y-6">
            <Heading
                variant="small"
                title="Profile"
                description="Update your name and email address"
            />

            <form class="space-y-6" novalidate @submit.prevent="onSubmit">
                <div class="grid gap-2">
                    <Label for="name">Name</Label>

                    <Input
                        id="name"
                        name="name"
                        class="block w-full"
                        required
                        autocomplete="name"
                        placeholder="Full name"
                        v-model="form.data.name"
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
                        type="email"
                        name="email"
                        class="block w-full"
                        required
                        autocomplete="username"
                        placeholder="Email address"
                        v-model="form.data.email"
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

                <div v-if="user && user.email_verified_at === null">
                    <p class="text-muted-foreground -mt-4 text-sm">
                        Your email address is unverified.
                        <button
                            type="button"
                            class="text-foreground cursor-pointer underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                            @click="onResendVerification"
                        >
                            Click here to re-send the verification email.
                        </button>
                    </p>

                    <div
                        v-if="verificationStatus === 'verification-link-sent'"
                        class="mt-2 text-sm font-medium text-green-600"
                    >
                        A new verification link has been sent to your email
                        address.
                    </div>
                </div>

                <p
                    v-if="
                        form.formError &&
                        !form.errors.name &&
                        !form.errors.email
                    "
                    class="text-sm text-red-600 dark:text-red-400"
                    role="alert"
                >
                    {{ form.formError }}
                </p>

                <div class="flex items-center gap-4">
                    <Button
                        type="submit"
                        :disabled="form.processing"
                        data-test="update-profile-button"
                    >
                        Save
                    </Button>

                    <p
                        v-if="form.status"
                        class="text-sm text-neutral-600 dark:text-neutral-400"
                        role="status"
                        aria-live="polite"
                    >
                        {{ form.status }}
                    </p>
                </div>
            </form>
        </div>

        <DeleteUser />
    </SettingsLayout>
</template>
