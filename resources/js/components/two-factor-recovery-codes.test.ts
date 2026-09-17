import { mount, flushPromises } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import TwoFactorRecoveryCodes from '@/components/TwoFactorRecoveryCodes.vue';

describe('TwoFactorRecoveryCodes', () => {
    const fetchRecoveryCodes = vi.fn();

    beforeEach(() => {
        fetchRecoveryCodes.mockReset();
        fetchRecoveryCodes.mockResolvedValue(undefined);
    });

    async function mountCodes() {
        const router = createRouter({
            history: createMemoryHistory(),
            routes: [{ path: '/', component: { template: '<div />' } }],
        });

        await router.push('/');
        await router.isReady();

        const wrapper = mount(TwoFactorRecoveryCodes, {
            props: {
                recoveryCodesList: [],
                fetchRecoveryCodes,
                errors: [],
            },
            global: {
                plugins: [router],
            },
        });

        await flushPromises();

        return { wrapper };
    }

    it('does not call fetchRecoveryCodes on mount', async () => {
        await mountCodes();

        expect(fetchRecoveryCodes).not.toHaveBeenCalled();
    });

    it('calls fetchRecoveryCodes once when View recovery codes is clicked', async () => {
        fetchRecoveryCodes.mockImplementation(async () => {
            // Prop-driven list stays empty unless parent updates; the fetch
            // itself is what we assert.
        });

        const { wrapper } = await mountCodes();

        const viewButton = wrapper
            .findAll('button')
            .find((button) => button.text().includes('View recovery codes'));

        expect(viewButton).toBeDefined();
        await viewButton!.trigger('click');
        await flushPromises();

        expect(fetchRecoveryCodes).toHaveBeenCalledTimes(1);
    });
});
