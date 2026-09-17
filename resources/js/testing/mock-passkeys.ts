import { ref, type Ref } from 'vue';
import { vi } from 'vitest';

type PasskeyVerifyMock = {
    verify: ReturnType<typeof vi.fn>;
    isLoading: Ref<boolean>;
    error: Ref<string | null>;
    errorInstance: Ref<Error | null>;
    isSupported: Ref<boolean>;
};

type PasskeyRegisterMock = {
    register: ReturnType<typeof vi.fn<(name: string) => Promise<void>>>;
    isLoading: Ref<boolean>;
    error: Ref<string | null>;
    errorInstance: Ref<Error | null>;
    isSupported: Ref<boolean>;
};

export const passkeyVerifyMock: PasskeyVerifyMock = {
    verify: vi.fn(),
    isLoading: ref(false),
    error: ref<string | null>(null),
    errorInstance: ref<Error | null>(null),
    isSupported: ref(false),
};

export const passkeyRegisterMock: PasskeyRegisterMock = {
    register: vi.fn<(name: string) => Promise<void>>(),
    isLoading: ref(false),
    error: ref<string | null>(null),
    errorInstance: ref<Error | null>(null),
    isSupported: ref(false),
};

export function resetPasskeyVerifyMock(): void {
    passkeyVerifyMock.verify.mockReset();
    passkeyVerifyMock.isLoading.value = false;
    passkeyVerifyMock.error.value = null;
    passkeyVerifyMock.errorInstance.value = null;
    passkeyVerifyMock.isSupported.value = false;
}

export function resetPasskeyRegisterMock(): void {
    passkeyRegisterMock.register.mockReset();
    passkeyRegisterMock.isLoading.value = false;
    passkeyRegisterMock.error.value = null;
    passkeyRegisterMock.errorInstance.value = null;
    passkeyRegisterMock.isSupported.value = false;
}

vi.mock('@laravel/passkeys/vue', () => ({
    usePasskeyVerify: vi.fn(() => ({
        verify: passkeyVerifyMock.verify,
        isLoading: passkeyVerifyMock.isLoading,
        error: passkeyVerifyMock.error,
        errorInstance: passkeyVerifyMock.errorInstance,
        isSupported: passkeyVerifyMock.isSupported,
    })),
    usePasskeyRegister: vi.fn(() => ({
        register: passkeyRegisterMock.register,
        isLoading: passkeyRegisterMock.isLoading,
        error: passkeyRegisterMock.error,
        errorInstance: passkeyRegisterMock.errorInstance,
        isSupported: passkeyRegisterMock.isSupported,
    })),
}));
