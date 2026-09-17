import { useForm } from '@/composables/useForm';
import { describe, expect, it, vi } from 'vitest';

describe('useForm', () => {
    it('maps validation errors and clears processing', async () => {
        const form = useForm({ email: '' });

        await expect(
            form.submit(async () => {
                throw {
                    kind: 'validation',
                    status: 422,
                    message: 'Invalid',
                    errors: { email: ['Required.'] },
                };
            }),
        ).rejects.toMatchObject({ kind: 'validation' });

        expect(form.processing).toBe(false);
        expect(form.errors.email).toBe('Required.');
        expect(form.formError).toBe('Invalid');
    });

    it('stores status strings returned by actions', async () => {
        const form = useForm({ email: 'a@b.com' });

        await form.submit(async () => 'Link sent');

        expect(form.status).toBe('Link sent');
        expect(form.processing).toBe(false);
    });

    it('does not start a second submit while processing', async () => {
        const form = useForm({ email: '' });
        let resolveAction: () => void = () => undefined;

        const first = form.submit(
            () =>
                new Promise((resolve) => {
                    resolveAction = () => resolve();
                }),
        );

        expect(form.processing).toBe(true);

        const second = form.submit(async () => {
            vi.fn();
        });

        resolveAction();
        await first;
        await second;

        expect(form.processing).toBe(false);
    });
});
