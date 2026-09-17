import { mount, flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';
import AppSidebar from '@/components/AppSidebar.vue';
import { SidebarProvider } from '@/components/ui/sidebar';

const repositoryHref =
    'https://github.com/muradyanvano/laravel-vue-spa-starter-kit';

async function mountSidebar() {
    const router = createRouter({
        history: createMemoryHistory(),
        routes: [
            { path: '/', component: { template: '<div />' } },
            { path: '/dashboard', component: { template: '<div />' } },
        ],
    });

    await router.push('/dashboard');
    await router.isReady();

    const wrapper = mount(
        defineComponent({
            components: { SidebarProvider, AppSidebar },
            template: '<SidebarProvider><AppSidebar /></SidebarProvider>',
        }),
        {
            global: {
                plugins: [router],
                stubs: {
                    NavUser: true,
                },
            },
        },
    );

    await flushPromises();

    return { wrapper };
}

describe('AppSidebar', () => {
    it('links repository to this kit and dashboard to /dashboard', async () => {
        const { wrapper } = await mountSidebar();

        expect(wrapper.html()).not.toContain('laravel/vue-starter-kit');

        const repository = wrapper
            .findAll('a')
            .find((anchor) => anchor.text().includes('Repository'));

        expect(repository).toBeDefined();
        expect(repository!.attributes('href')).toBe(repositoryHref);

        const dashboard = wrapper
            .findAll('a')
            .find((anchor) => anchor.text().includes('Dashboard'));

        expect(dashboard).toBeDefined();
        expect(dashboard!.attributes('href')).toBe('/dashboard');
    });
});
