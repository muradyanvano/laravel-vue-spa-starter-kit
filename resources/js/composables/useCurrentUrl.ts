import { useRoute } from 'vue-router';
import { computed, type ComputedRef } from 'vue';

export type UseCurrentUrlReturn = {
    currentUrl: ComputedRef<string>;
    isCurrentUrl: (urlToCheck: string, startsWith?: boolean) => boolean;
    isCurrentOrParentUrl: (urlToCheck: string) => boolean;
    whenCurrentUrl: <TIfTrue, TIfFalse = null>(
        urlToCheck: string,
        ifTrue: TIfTrue,
        ifFalse?: TIfFalse,
    ) => TIfTrue | TIfFalse;
};

function pathnameOf(url: string): string | null {
    if (!url.startsWith('http')) {
        return url;
    }

    try {
        return new URL(url).pathname;
    } catch {
        return null;
    }
}

export function useCurrentUrl(): UseCurrentUrlReturn {
    const route = useRoute();
    const currentUrl = computed(() => route.path);

    function isCurrentUrl(urlToCheck: string, startsWith = false): boolean {
        const path = pathnameOf(urlToCheck);

        if (path === null) {
            return false;
        }

        return startsWith
            ? currentUrl.value.startsWith(path)
            : path === currentUrl.value;
    }

    function isCurrentOrParentUrl(urlToCheck: string): boolean {
        return isCurrentUrl(urlToCheck, true);
    }

    function whenCurrentUrl<TIfTrue, TIfFalse = null>(
        urlToCheck: string,
        ifTrue: TIfTrue,
        ifFalse: TIfFalse = null as TIfFalse,
    ): TIfTrue | TIfFalse {
        return isCurrentUrl(urlToCheck) ? ifTrue : ifFalse;
    }

    return {
        currentUrl,
        isCurrentUrl,
        isCurrentOrParentUrl,
        whenCurrentUrl,
    };
}
