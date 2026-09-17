import { clsx } from 'clsx';
import type { ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/** Normalize NavItem href values that may be absolute or relative. */
export function toUrl(href: string): string {
    return href;
}
