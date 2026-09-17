import App from '@/App.vue';
import { initializeTheme } from '@/composables/useAppearance';
import { router } from '@/router';
import { createApp } from 'vue';

initializeTheme();

const rootElement = document.getElementById('app');

if (!rootElement) {
    throw new Error('Root element #app not found');
}

createApp(App).use(router).mount(rootElement);
