<script setup lang="ts">
import { onMounted, onUnmounted, ref, useTemplateRef } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AlertError from '@/components/AlertError.vue';
import DocumentTitle from '@/components/DocumentTitle.vue';
import Heading from '@/components/Heading.vue';
import InputError from '@/components/InputError.vue';
import ManagePasskeys from '@/components/ManagePasskeys.vue';
import ManageTwoFactor from '@/components/ManageTwoFactor.vue';
import PasswordInput from '@/components/PasswordInput.vue';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { fieldDescribedBy, fieldErrorId, useForm } from '@/composables/useForm';
import SettingsLayout from '@/layouts/SettingsLayout.vue';
import { isRequestAborted, normalizeApiError } from '@/lib/http';
import { locationToPath } from '@/lib/navigation';
import {
    fetchPasswordConfirmationStatus,
    fetchSecuritySettings,
    updatePassword,
    type SecuritySettings,
} from '@/lib/settings-api';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Security settings',
        href: '/settings/security',
    },
];

const router = useRouter();
const route = useRoute();
const passwordInput = useTemplateRef('passwordInput');
const currentPasswordInput = useTemplateRef('currentPasswordInput');

const settings = ref<SecuritySettings | null>(null);
const phase = ref<'loading' | 'ready' | 'error'>('loading');
const loadError = ref<string | null>(null);

const form = useForm({
    current_password: '',
    password: '',
    password_confirmation: '',
});

async function loadSettings(): Promise<void> {
    settings.value = await fetchSecuritySettings();
}

let active = true;
const controller = new AbortController();

onMounted(() => {
    void (async () => {
        try {
            const { confirmed } = await fetchPasswordConfirmationStatus({
                signal: controller.signal,
            });

            if (!active) {
                return;
            }

            if (!confirmed) {
                await router.replace({
                    path: '/confirm-password',
                    state: { from: locationToPath(route) },
                });

                return;
            }

            const nextSettings = await fetchSecuritySettings({
                signal: controller.signal,
            });

            if (!active) {
                return;
            }

            settings.value = nextSettings;
            phase.value = 'ready';
        } catch (error) {
            if (!active || isRequestAborted(error)) {
                return;
            }

            loadError.value = normalizeApiError(error).message;
            phase.value = 'error';
        }
    })();
});

onUnmounted(() => {
    active = false;
    controller.abort();
});

async function onSubmitPassword(): Promise<void> {
    try {
        await form.submit(async (data) => {
            await updatePassword(data);
            form.reset();

            return 'Password updated.';
        });
    } catch (error: unknown) {
        const { errors } = normalizeApiError(error);

        if (errors.password) {
            form.reset('password', 'password_confirmation');
            passwordInput.value?.focus();
        }

        if (errors.current_password) {
            form.reset('current_password');
            currentPasswordInput.value?.focus();
        }
    }
}
</script>

<template>
    <SettingsLayout :breadcrumbs="breadcrumbs">
        <DocumentTitle title="Security settings" />

        <h1 class="sr-only">Security settings</h1>

        <div
            v-if="phase === 'loading'"
            class="space-y-8"
            aria-busy="true"
            aria-label="Loading security settings"
            data-testid="security-skeleton"
        >
            <div class="space-y-6">
                <div class="space-y-2">
                    <Skeleton class="h-5 w-40" />
                    <Skeleton class="h-4 w-72 max-w-full" />
                </div>
                <div class="space-y-4">
                    <div class="space-y-2">
                        <Skeleton class="h-4 w-32" />
                        <Skeleton class="h-9 w-full" />
                    </div>
                    <div class="space-y-2">
                        <Skeleton class="h-4 w-28" />
                        <Skeleton class="h-9 w-full" />
                    </div>
                    <div class="space-y-2">
                        <Skeleton class="h-4 w-36" />
                        <Skeleton class="h-9 w-full" />
                    </div>
                    <Skeleton class="h-9 w-20" />
                </div>
            </div>
            <div class="space-y-4">
                <div class="space-y-2">
                    <Skeleton class="h-5 w-52" />
                    <Skeleton class="h-4 w-full max-w-md" />
                </div>
                <Skeleton class="h-9 w-28" />
            </div>
        </div>

        <AlertError
            v-if="phase === 'error' && loadError"
            :errors="[loadError]"
        />

        <template v-if="phase === 'ready' && settings">
            <div class="space-y-6">
                <Heading
                    variant="small"
                    title="Update password"
                    description="Ensure your account is using a long, random password to stay secure"
                />

                <form
                    class="space-y-6"
                    novalidate
                    @submit.prevent="onSubmitPassword"
                >
                    <div class="grid gap-2">
                        <Label for="current_password">Current password</Label>

                        <PasswordInput
                            id="current_password"
                            ref="currentPasswordInput"
                            name="current_password"
                            class="block w-full"
                            autocomplete="current-password"
                            placeholder="Current password"
                            v-model="form.data.current_password"
                            :aria-invalid="
                                Boolean(form.errors.current_password)
                            "
                            :aria-describedby="
                                fieldDescribedBy(
                                    'current_password',
                                    form.errors,
                                )
                            "
                            :disabled="form.processing"
                        />

                        <InputError
                            :id="fieldErrorId('current_password')"
                            :message="form.errors.current_password"
                        />
                    </div>

                    <div class="grid gap-2">
                        <Label for="password">New password</Label>

                        <PasswordInput
                            id="password"
                            ref="passwordInput"
                            name="password"
                            class="block w-full"
                            autocomplete="new-password"
                            placeholder="New password"
                            :passwordrules="settings.passwordRules"
                            v-model="form.data.password"
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
                        <Label for="password_confirmation">
                            Confirm password
                        </Label>

                        <PasswordInput
                            id="password_confirmation"
                            name="password_confirmation"
                            class="block w-full"
                            autocomplete="new-password"
                            placeholder="Confirm password"
                            :passwordrules="settings.passwordRules"
                            v-model="form.data.password_confirmation"
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

                    <p
                        v-if="
                            form.formError &&
                            !form.errors.current_password &&
                            !form.errors.password &&
                            !form.errors.password_confirmation
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
                            data-test="update-password-button"
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

            <ManageTwoFactor
                :can-manage-two-factor="settings.canManageTwoFactor"
                :requires-confirmation="settings.requiresConfirmation"
                :two-factor-enabled="settings.twoFactorEnabled"
                @updated="loadSettings"
            />

            <ManagePasskeys :can-manage-passkeys="settings.canManagePasskeys" />
        </template>
    </SettingsLayout>
</template>
