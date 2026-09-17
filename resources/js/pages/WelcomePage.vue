<script setup lang="ts">
import { useAuth } from '@/auth/use-auth';
import DocumentTitle from '@/components/DocumentTitle.vue';
import { RouterLink } from 'vue-router';

const { user } = useAuth();
</script>

<template>
    <DocumentTitle title="Welcome" />
    <div
        class="flex min-h-screen flex-col items-center bg-[#FDFDFC] p-6 text-[#1b1b18] lg:justify-center lg:p-8 dark:bg-[#0a0a0a]"
    >
        <header class="mb-6 w-full max-w-[335px] text-sm lg:max-w-4xl">
            <nav
                aria-label="Authentication"
                class="flex items-center justify-end gap-4"
            >
                <template v-if="user">
                    <RouterLink
                        to="/dashboard"
                        class="inline-block rounded-sm border border-[#19140035] px-5 py-1.5 text-sm leading-normal text-[#1b1b18] hover:border-[#1915014a] dark:border-[#3E3E3A] dark:text-[#EDEDEC] dark:hover:border-[#62605b]"
                    >
                        Dashboard
                    </RouterLink>
                </template>
                <template v-else>
                    <RouterLink
                        to="/login"
                        class="inline-block rounded-sm border border-transparent px-5 py-1.5 text-sm leading-normal text-[#1b1b18] hover:border-[#19140035] dark:text-[#EDEDEC] dark:hover:border-[#3E3E3A]"
                    >
                        Log in
                    </RouterLink>
                    <RouterLink
                        to="/register"
                        class="inline-block rounded-sm border border-[#19140035] px-5 py-1.5 text-sm leading-normal text-[#1b1b18] hover:border-[#1915014a] dark:border-[#3E3E3A] dark:text-[#EDEDEC] dark:hover:border-[#62605b]"
                    >
                        Register
                    </RouterLink>
                </template>
            </nav>
        </header>

        <main
            class="w-full max-w-[335px] rounded-lg bg-white p-6 shadow-[inset_0px_0px_0px_1px_rgba(26,26,0,0.16)] lg:max-w-4xl lg:p-20 dark:bg-[#161615] dark:text-[#EDEDEC] dark:shadow-[inset_0px_0px_0px_1px_#fffaed2d]"
        >
            <h1 class="mb-1 font-medium">Laravel Vue SPA Starter Kit</h1>
            <p class="mb-4 text-[#706f6c] dark:text-[#A1A09A]">
                Phase 1 architecture proof: Vue Router + Sanctum cookies +
                Fortify. Full UI parity arrives in later phases.
            </p>
            <ul class="flex gap-3 text-sm leading-normal">
                <li>
                    <a
                        href="https://laravel.com/docs"
                        target="_blank"
                        rel="noreferrer"
                        class="inline-block rounded-sm border border-black bg-[#1b1b18] px-5 py-1.5 text-sm leading-normal text-white hover:bg-black dark:border-[#eeeeec] dark:bg-[#eeeeec] dark:text-[#1C1C1A]"
                    >
                        Documentation
                    </a>
                </li>
            </ul>
        </main>
    </div>
</template>
