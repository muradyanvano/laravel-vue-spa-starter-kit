import {
    ensureCsrfCookie,
    http,
    isRequestAborted,
    normalizeApiError,
} from '@/lib/http';
import type { Passkey } from '@/types';

const PROFILE_DESTROY_URL = '/settings/profile';
const SECURITY_SETTINGS_URL = '/api/v1/settings/security';
const PROFILE_INFORMATION_URL = '/user/profile-information';
const USER_PASSWORD_URL = '/user/password';
const TWO_FACTOR_URL = '/user/two-factor-authentication';
const CONFIRMED_TWO_FACTOR_URL = '/user/confirmed-two-factor-authentication';
const TWO_FACTOR_QR_CODE_URL = '/user/two-factor-qr-code';
const TWO_FACTOR_SECRET_KEY_URL = '/user/two-factor-secret-key';
const TWO_FACTOR_RECOVERY_CODES_URL = '/user/two-factor-recovery-codes';
const CONFIRMED_PASSWORD_STATUS_URL = '/user/confirmed-password-status';
const PASSKEYS_LIST_URL = '/api/v1/settings/passkeys';
const PASSKEY_DESTROY_URL = '/user/passkeys';

export type SecuritySettings = {
    canManageTwoFactor: boolean;
    canManagePasskeys: boolean;
    twoFactorEnabled: boolean;
    requiresConfirmation: boolean;
    passwordRules: string;
};

export type TwoFactorQrCode = {
    svg: string;
    url: string;
};

export type PasswordConfirmationStatus = {
    confirmed: boolean;
};

type MaybeWrapped<T> = T | { data: T };

export type { Passkey };

/** Laravel resources may wrap payloads in a `data` key; both shapes are accepted. */
function unwrap<T>(payload: MaybeWrapped<T>): T {
    if (
        typeof payload === 'object' &&
        payload !== null &&
        'data' in payload &&
        typeof (payload as { data: unknown }).data === 'object'
    ) {
        return (payload as { data: T }).data;
    }

    return payload as T;
}

export async function updateProfile(payload: {
    name: string;
    email: string;
}): Promise<void> {
    await ensureCsrfCookie();
    await http.put(PROFILE_INFORMATION_URL, payload);
}

export async function updatePassword(payload: {
    current_password: string;
    password: string;
    password_confirmation: string;
}): Promise<void> {
    await ensureCsrfCookie();
    await http.put(USER_PASSWORD_URL, payload);
}

export async function deleteAccount(payload: {
    password: string;
}): Promise<void> {
    await ensureCsrfCookie();
    await http.delete(PROFILE_DESTROY_URL, { data: payload });
}

export async function fetchSecuritySettings(options?: {
    signal?: AbortSignal;
}): Promise<SecuritySettings> {
    try {
        const response = await http.get<MaybeWrapped<SecuritySettings>>(
            SECURITY_SETTINGS_URL,
            { signal: options?.signal },
        );

        return unwrap(response.data);
    } catch (error) {
        if (isRequestAborted(error)) {
            throw error;
        }

        throw normalizeApiError(error);
    }
}

export async function enableTwoFactor(): Promise<void> {
    await ensureCsrfCookie();
    await http.post(TWO_FACTOR_URL);
}

export async function confirmTwoFactor(payload: {
    code: string;
}): Promise<void> {
    await ensureCsrfCookie();
    await http.post(CONFIRMED_TWO_FACTOR_URL, payload);
}

export async function disableTwoFactor(): Promise<void> {
    await ensureCsrfCookie();
    await http.delete(TWO_FACTOR_URL);
}

export async function fetchTwoFactorQrCode(): Promise<TwoFactorQrCode> {
    try {
        const response = await http.get<TwoFactorQrCode>(
            TWO_FACTOR_QR_CODE_URL,
        );

        return response.data;
    } catch (error) {
        throw normalizeApiError(error);
    }
}

export async function fetchTwoFactorSecretKey(): Promise<{
    secretKey: string;
}> {
    try {
        const response = await http.get<{ secretKey: string }>(
            TWO_FACTOR_SECRET_KEY_URL,
        );

        return response.data;
    } catch (error) {
        throw normalizeApiError(error);
    }
}

export async function fetchRecoveryCodes(): Promise<string[]> {
    try {
        const response = await http.get<string[]>(
            TWO_FACTOR_RECOVERY_CODES_URL,
        );

        return response.data;
    } catch (error) {
        throw normalizeApiError(error);
    }
}

export async function regenerateRecoveryCodes(): Promise<void> {
    await ensureCsrfCookie();
    await http.post(TWO_FACTOR_RECOVERY_CODES_URL);
}

export async function fetchPasskeys(options?: {
    signal?: AbortSignal;
}): Promise<Passkey[]> {
    try {
        const response = await http.get<MaybeWrapped<Passkey[]>>(
            PASSKEYS_LIST_URL,
            { signal: options?.signal },
        );

        return unwrap(response.data);
    } catch (error) {
        if (isRequestAborted(error)) {
            throw error;
        }

        throw normalizeApiError(error);
    }
}

export async function deletePasskey(id: number): Promise<void> {
    await ensureCsrfCookie();
    await http.delete(`${PASSKEY_DESTROY_URL}/${id}`);
}

export async function fetchPasswordConfirmationStatus(options?: {
    signal?: AbortSignal;
}): Promise<PasswordConfirmationStatus> {
    try {
        const response = await http.get<PasswordConfirmationStatus>(
            CONFIRMED_PASSWORD_STATUS_URL,
            { signal: options?.signal },
        );

        return { confirmed: response.data.confirmed === true };
    } catch (error) {
        if (isRequestAborted(error)) {
            throw error;
        }

        throw normalizeApiError(error);
    }
}
