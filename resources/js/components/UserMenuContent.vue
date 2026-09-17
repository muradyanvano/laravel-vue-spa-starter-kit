<script setup lang="ts">
import { LogOut, Settings } from '@lucide/vue';
import { ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { useAuth } from '@/auth/use-auth';
import {
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import UserInfo from '@/components/UserInfo.vue';
import type { User } from '@/types';

type Props = {
    user: User;
};

defineProps<Props>();

const { logout } = useAuth();
const router = useRouter();
const loggingOut = ref(false);

async function handleLogout(): Promise<void> {
    loggingOut.value = true;

    try {
        await logout();
    } finally {
        loggingOut.value = false;
        await router.replace('/');
    }
}
</script>

<template>
    <DropdownMenuLabel class="p-0 font-normal">
        <div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <UserInfo :user="user" :show-email="true" />
        </div>
    </DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuGroup>
        <DropdownMenuItem :as-child="true">
            <RouterLink
                class="block w-full cursor-pointer"
                to="/settings/profile"
            >
                <Settings class="mr-2 h-4 w-4" />
                Settings
            </RouterLink>
        </DropdownMenuItem>
    </DropdownMenuGroup>
    <DropdownMenuSeparator />
    <DropdownMenuItem :as-child="true">
        <button
            type="button"
            class="block w-full cursor-pointer"
            :disabled="loggingOut"
            data-test="logout-button"
            @click="handleLogout"
        >
            <LogOut class="mr-2 h-4 w-4" />
            Log out
        </button>
    </DropdownMenuItem>
</template>
