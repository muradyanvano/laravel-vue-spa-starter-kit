import AuthProvider from '@/auth/AuthProvider.vue';
import { useAuth } from '@/auth/use-auth';
import AppLoader from '@/components/AppLoader.vue';
import { mount, flushPromises } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { createMemoryHistory, createRouter, RouterView } from 'vue-router';

vi.mock('@/lib/auth-api', () => ({
    fetchCurrentUser: vi.fn(),
    logout: vi.fn(),
}));

import { fetchCurrentUser } from '@/lib/auth-api';

const mockedFetchCurrentUser = vi.mocked(fetchCurrentUser);

const AppShellStub = defineComponent({
    setup() {
        const { isLoading } = useAuth();

        return () =>
            isLoading.value
                ? h(AppLoader)
                : h('div', { 'data-testid': 'home-ready' }, 'Home ready');
    },
});

describe('auth bootstrap loader', () => {
    beforeEach(() => {
        mockedFetchCurrentUser.mockReset();
    });

    it('shows the centered app loader until auth resolves', async () => {
        let resolveUser: (value: null) => void = () => undefined;
        mockedFetchCurrentUser.mockImplementation(
            () =>
                new Promise((resolve) => {
                    resolveUser = resolve;
                }),
        );

        const router = createRouter({
            history: createMemoryHistory(),
            routes: [
                {
                    path: '/',
                    component: AppShellStub,
                },
            ],
        });

        await router.push('/');

        const wrapper = mount(
            defineComponent({
                components: { AuthProvider, RouterView },
                template: '<AuthProvider><RouterView /></AuthProvider>',
            }),
            {
                global: {
                    plugins: [router],
                },
            },
        );

        expect(wrapper.find('[data-testid="app-loader"]').exists()).toBe(true);
        expect(wrapper.text()).not.toContain('Loading…');
        expect(wrapper.find('[data-testid="home-ready"]').exists()).toBe(false);

        resolveUser(null);
        await flushPromises();

        expect(wrapper.find('[data-testid="home-ready"]').exists()).toBe(true);
        expect(wrapper.find('[data-testid="app-loader"]').exists()).toBe(false);
    });
});
