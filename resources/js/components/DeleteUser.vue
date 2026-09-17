<script setup lang="ts">
import { ref, useTemplateRef } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@/auth/use-auth';
import Heading from '@/components/Heading.vue';
import InputError from '@/components/InputError.vue';
import PasswordInput from '@/components/PasswordInput.vue';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { fieldDescribedBy, fieldErrorId, useForm } from '@/composables/useForm';
import { deleteAccount } from '@/lib/settings-api';

const passwordInput = useTemplateRef('passwordInput');
const router = useRouter();
const { setUser } = useAuth();
const isOpen = ref(false);
const form = useForm({ password: '' });

function closeDialog(): void {
    isOpen.value = false;
    form.reset();
    form.clearErrors();
}

function onOpenChange(open: boolean): void {
    if (open) {
        isOpen.value = true;
    } else {
        closeDialog();
    }
}

async function onSubmit(): Promise<void> {
    try {
        await form.submit(async (data) => {
            await deleteAccount({ password: data.password });
            setUser(null);
            await router.replace('/');
        });
    } catch {
        passwordInput.value?.focus();
    }
}
</script>

<template>
    <div class="space-y-6">
        <Heading
            variant="small"
            title="Delete account"
            description="Delete your account and all of its resources"
        />
        <div
            class="space-y-4 rounded-lg border border-red-100 bg-red-50 p-4 dark:border-red-200/10 dark:bg-red-700/10"
        >
            <div class="relative space-y-0.5 text-red-600 dark:text-red-100">
                <p class="font-medium">Warning</p>
                <p class="text-sm">
                    Please proceed with caution, this cannot be undone.
                </p>
            </div>

            <Dialog :open="isOpen" @update:open="onOpenChange">
                <DialogTrigger as-child>
                    <Button
                        variant="destructive"
                        data-test="delete-user-button"
                    >
                        Delete account
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogTitle>
                        Are you sure you want to delete your account?
                    </DialogTitle>
                    <DialogDescription>
                        Once your account is deleted, all of its resources and
                        data will also be permanently deleted. Please enter your
                        password to confirm you would like to permanently delete
                        your account.
                    </DialogDescription>

                    <form
                        class="space-y-6"
                        novalidate
                        @submit.prevent="onSubmit"
                    >
                        <div class="grid gap-2">
                            <Label for="password" class="sr-only">
                                Password
                            </Label>

                            <PasswordInput
                                id="password"
                                name="password"
                                ref="passwordInput"
                                placeholder="Password"
                                autocomplete="current-password"
                                v-model="form.data.password"
                                :aria-invalid="Boolean(form.errors.password)"
                                :aria-describedby="
                                    fieldDescribedBy('password', form.errors)
                                "
                                :disabled="form.processing"
                            />

                            <InputError
                                :id="fieldErrorId('password')"
                                :message="
                                    form.errors.password ??
                                    form.formError ??
                                    undefined
                                "
                            />
                        </div>

                        <DialogFooter class="gap-2">
                            <DialogClose as-child>
                                <Button variant="secondary" type="button">
                                    Cancel
                                </Button>
                            </DialogClose>

                            <Button
                                variant="destructive"
                                type="submit"
                                :disabled="form.processing"
                                data-test="confirm-delete-user-button"
                            >
                                Delete account
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    </div>
</template>
