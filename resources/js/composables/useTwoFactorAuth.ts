import {
    fetchRecoveryCodes as fetchRecoveryCodesRequest,
    fetchTwoFactorQrCode,
    fetchTwoFactorSecretKey,
} from '@/lib/settings-api';
import { computed, ref, type ComputedRef, type Ref } from 'vue';

export type UseTwoFactorAuthReturn = {
    qrCodeSvg: Ref<string | null>;
    manualSetupKey: Ref<string | null>;
    recoveryCodesList: Ref<string[]>;
    errors: Ref<string[]>;
    hasSetupData: ComputedRef<boolean>;
    clearSetupData: () => void;
    clearErrors: () => void;
    clearTwoFactorAuthData: () => void;
    fetchQrCode: () => Promise<void>;
    fetchSetupKey: () => Promise<void>;
    fetchSetupData: () => Promise<void>;
    fetchRecoveryCodes: () => Promise<void>;
};

export const OTP_MAX_LENGTH = 6;

const errors = ref<string[]>([]);
const manualSetupKey = ref<string | null>(null);
const qrCodeSvg = ref<string | null>(null);
const recoveryCodesList = ref<string[]>([]);

const hasSetupData = computed<boolean>(
    () => qrCodeSvg.value !== null && manualSetupKey.value !== null,
);

/**
 * Shared module-level 2FA setup state.
 * Cleared on unmount of ManageTwoFactor so secrets do not linger.
 */
export function useTwoFactorAuth(): UseTwoFactorAuthReturn {
    const clearErrors = (): void => {
        errors.value = [];
    };

    const clearSetupData = (): void => {
        manualSetupKey.value = null;
        qrCodeSvg.value = null;
        clearErrors();
    };

    const clearTwoFactorAuthData = (): void => {
        clearSetupData();
        recoveryCodesList.value = [];
    };

    const fetchQrCode = async (): Promise<void> => {
        try {
            const { svg } = await fetchTwoFactorQrCode();

            qrCodeSvg.value = svg;
        } catch {
            errors.value = [...errors.value, 'Failed to fetch QR code'];
            qrCodeSvg.value = null;
        }
    };

    const fetchSetupKey = async (): Promise<void> => {
        try {
            const { secretKey } = await fetchTwoFactorSecretKey();

            manualSetupKey.value = secretKey;
        } catch {
            errors.value = [...errors.value, 'Failed to fetch a setup key'];
            manualSetupKey.value = null;
        }
    };

    const fetchRecoveryCodes = async (): Promise<void> => {
        try {
            clearErrors();
            recoveryCodesList.value = await fetchRecoveryCodesRequest();
        } catch {
            errors.value = [...errors.value, 'Failed to fetch recovery codes'];
            recoveryCodesList.value = [];
        }
    };

    const fetchSetupData = async (): Promise<void> => {
        clearErrors();
        await Promise.all([fetchQrCode(), fetchSetupKey()]);
    };

    return {
        qrCodeSvg,
        manualSetupKey,
        recoveryCodesList,
        errors,
        hasSetupData,
        clearSetupData,
        clearErrors,
        clearTwoFactorAuthData,
        fetchQrCode,
        fetchSetupKey,
        fetchSetupData,
        fetchRecoveryCodes,
    };
}
