import type { Component } from 'vue';

export type Appearance = 'light' | 'dark' | 'system';
export type ResolvedAppearance = 'light' | 'dark';
export type AppVariant = 'header' | 'sidebar';

export type BreadcrumbItem = {
    title: string;
    href: string;
};

export type NavItem = {
    title: string;
    href: string;
    icon?: Component;
};

export type TwoFactorConfigContent = {
    title: string;
    description: string;
    buttonText: string;
};
