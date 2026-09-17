import {
    initializeTheme,
    updateTheme,
    useAppearance,
} from '@/composables/useAppearance';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, nextTick } from 'vue';

describe('appearance foundation', () => {
    it('applies dark class for explicit dark preference', () => {
        document.documentElement.classList.remove('dark');
        updateTheme('dark');
        expect(document.documentElement.classList.contains('dark')).toBe(true);

        updateTheme('light');
        expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('persists appearance preference to localStorage and cookie', async () => {
        localStorage.clear();
        document.cookie = 'appearance=; Max-Age=0; path=/';

        const Comp = defineComponent({
            setup() {
                return useAppearance();
            },
            template:
                '<button @click="updateAppearance(\'dark\')">Dark</button>',
        });

        const wrapper = mount(Comp);
        await nextTick();
        await wrapper.find('button').trigger('click');

        expect(localStorage.getItem('appearance')).toBe('dark');
        expect(document.cookie).toContain('appearance=dark');
        expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('initializeTheme reads stored preference', () => {
        localStorage.setItem('appearance', 'dark');
        document.documentElement.classList.remove('dark');
        initializeTheme();
        expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
});
