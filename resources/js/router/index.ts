import AppShell from '@/router/AppShell.vue';
import GuestRoute from '@/router/GuestRoute.vue';
import ProtectedRoute from '@/router/ProtectedRoute.vue';
import VerifiedRoute from '@/router/VerifiedRoute.vue';
import ConfirmPasswordPage from '@/pages/auth/ConfirmPasswordPage.vue';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage.vue';
import LoginPage from '@/pages/auth/LoginPage.vue';
import RegisterPage from '@/pages/auth/RegisterPage.vue';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage.vue';
import TwoFactorChallengePage from '@/pages/auth/TwoFactorChallengePage.vue';
import VerifyEmailPage from '@/pages/auth/VerifyEmailPage.vue';
import DashboardPage from '@/pages/DashboardPage.vue';
import NotFoundPage from '@/pages/NotFoundPage.vue';
import AppearanceSettingsPage from '@/pages/settings/AppearanceSettingsPage.vue';
import ProfileSettingsPage from '@/pages/settings/ProfileSettingsPage.vue';
import SecuritySettingsPage from '@/pages/settings/SecuritySettingsPage.vue';
import WelcomePage from '@/pages/WelcomePage.vue';
import { createRouter, createWebHistory } from 'vue-router';

/**
 * Core pages use static imports — no route-level lazy loading.
 * Lazy loading caused visible navigation flashes in the sibling React kit.
 */
export const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            component: AppShell,
            children: [
                {
                    path: '',
                    name: 'home',
                    component: WelcomePage,
                },
                {
                    path: '',
                    component: GuestRoute,
                    children: [
                        {
                            path: 'login',
                            name: 'login',
                            component: LoginPage,
                        },
                        {
                            path: 'register',
                            name: 'register',
                            component: RegisterPage,
                        },
                        {
                            path: 'forgot-password',
                            name: 'forgot-password',
                            component: ForgotPasswordPage,
                        },
                        {
                            path: 'reset-password/:token',
                            name: 'reset-password',
                            component: ResetPasswordPage,
                        },
                        {
                            path: 'two-factor-challenge',
                            name: 'two-factor-challenge',
                            component: TwoFactorChallengePage,
                        },
                    ],
                },
                {
                    path: '',
                    component: ProtectedRoute,
                    children: [
                        {
                            path: 'verify-email',
                            name: 'verify-email',
                            component: VerifyEmailPage,
                        },
                        {
                            path: 'confirm-password',
                            name: 'confirm-password',
                            component: ConfirmPasswordPage,
                        },
                    ],
                },
                {
                    path: '',
                    component: VerifiedRoute,
                    children: [
                        {
                            path: 'dashboard',
                            name: 'dashboard',
                            component: DashboardPage,
                        },
                        {
                            path: 'settings',
                            redirect: '/settings/profile',
                        },
                        {
                            path: 'settings/profile',
                            name: 'settings.profile',
                            component: ProfileSettingsPage,
                        },
                        {
                            path: 'settings/security',
                            name: 'settings.security',
                            component: SecuritySettingsPage,
                        },
                        {
                            path: 'settings/appearance',
                            name: 'settings.appearance',
                            component: AppearanceSettingsPage,
                        },
                        {
                            path: 'settings/password',
                            redirect: '/settings/security',
                        },
                        {
                            path: 'settings/two-factor',
                            redirect: '/settings/security',
                        },
                    ],
                },
                {
                    path: ':pathMatch(.*)*',
                    name: 'not-found',
                    component: NotFoundPage,
                },
            ],
        },
    ],
});
