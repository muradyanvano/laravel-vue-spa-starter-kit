import {
    ensureCsrfCookie,
    isNormalizedApiError,
    normalizeApiError,
} from '@/lib/http';
import type { LaravelValidationErrors } from '@/types/http';
import { reactive } from 'vue';

type FormErrors = Record<string, string>;

function firstErrorMessages(errors: LaravelValidationErrors): FormErrors {
    return Object.fromEntries(
        Object.entries(errors).map(([field, messages]) => [
            field,
            messages[0] ?? '',
        ]),
    );
}

export type FormState<T extends Record<string, unknown>> = {
    data: T;
    errors: FormErrors;
    processing: boolean;
    status: string | null;
    formError: string | null;
    hasErrors: boolean;
    setField: <K extends keyof T>(key: K, value: T[K]) => void;
    clearErrors: () => void;
    reset: (...fields: Array<keyof T>) => void;
    setStatus: (value: string | null) => void;
    setFormError: (value: string | null) => void;
    submit: (
        action: (formData: T) => Promise<void | string | null>,
    ) => Promise<void>;
};

export function useForm<T extends Record<string, unknown>>(
    initial: T,
): FormState<T> {
    const form = reactive({
        data: { ...initial } as T,
        errors: {} as FormErrors,
        processing: false,
        status: null as string | null,
        formError: null as string | null,
        get hasErrors() {
            return (
                Object.keys(form.errors).length > 0 || form.formError !== null
            );
        },
        setField<K extends keyof T>(key: K, value: T[K]): void {
            form.data[key] = value;
        },
        clearErrors(): void {
            form.errors = {};
            form.formError = null;
        },
        reset(...fields: Array<keyof T>): void {
            if (fields.length === 0) {
                Object.assign(form.data, initial);

                return;
            }

            for (const field of fields) {
                form.data[field] = initial[field];
            }
        },
        setStatus(value: string | null): void {
            form.status = value;
        },
        setFormError(value: string | null): void {
            form.formError = value;
        },
        async submit(
            action: (formData: T) => Promise<void | string | null>,
        ): Promise<void> {
            if (form.processing) {
                return;
            }

            form.processing = true;
            form.clearErrors();
            form.status = null;

            try {
                const result = await action({ ...(form.data as T) });

                if (typeof result === 'string') {
                    form.status = result;
                }
            } catch (error) {
                const normalized = isNormalizedApiError(error)
                    ? error
                    : normalizeApiError(error);

                if (normalized.kind === 'csrf') {
                    try {
                        await ensureCsrfCookie();
                    } catch {
                        // Ignore secondary CSRF bootstrap failures.
                    }
                }

                if (normalized.kind === 'validation') {
                    form.errors = firstErrorMessages(normalized.errors);
                    form.formError = normalized.message;
                } else {
                    form.formError = normalized.message;
                }

                throw normalized;
            } finally {
                form.processing = false;
            }
        },
    }) as FormState<T>;

    return form;
}

export function fieldErrorId(field: string): string {
    return `${field}-error`;
}

export function fieldDescribedBy(
    field: string,
    errors: FormErrors,
): string | undefined {
    return errors[field] ? fieldErrorId(field) : undefined;
}
