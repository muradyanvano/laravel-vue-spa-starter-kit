# SPA architecture (no Inertia)

- This application is a traditional first-party Vue SPA. Do not introduce Inertia packages, middleware, `Inertia::render()`, `@inertiajs/vue3`, `@inertiajs/vite`, or Inertia Vue APIs (`createInertiaApp`, `usePage`, `router.visit`, Inertia `<Link>` / `<Form>`).
- Vue Router owns browser routing under `resources/js/router`. Laravel serves `resources/views/app.blade.php` via `SpaController` for frontend refreshes.
- Keep `/api/*`, `/sanctum/*`, `/up`, `/email/*`, `/storage/*`, and Fortify endpoints outside the SPA catch-all.
- Use Sanctum cookie/session SPA authentication with Axios (`resources/js/lib/http.ts`). Never store auth tokens in `localStorage`, `sessionStorage`, IndexedDB, or Vue state.
- Use Fortify for authentication capabilities (login, register, password reset, email verification, 2FA, password confirmation, profile/password updates) with `views => false`. App-owned JSON APIs belong under `/api/v1/...`.
- Auth bootstrap uses a single centered `AppLoader` in the router root (`AppShell`). Do not reintroduce route-level lazy loading / Suspense loaders or plain visible “Loading…” placeholders for normal navigation. Page data uses contextual skeletons; mutations use local button spinners.
- `AuthProvider` / `provideAuth()` owns `/api/v1/user` bootstrap and lives above route transitions. Pages consume `useAuth()`; call `refreshUser()` only after auth/profile mutations. Do not add Pinia, VueUse stores, request-cache libraries, or global URL deduplication maps unless there is a demonstrated need beyond one auth owner.
- Password confirmation (HTTP 423) is handled contextually by sensitive callers, not as a global Axios navigation side effect. Do not automatically replay mutations after 419/423.
- Two-factor secrets, QR payloads, and recovery codes are Fortify-owned and must never be logged, stored in browser storage, or included on the current-user endpoint.
- Passkeys are a Fortify transitive dependency (`laravel/passkeys`). They are not part of this kit's default UI; leave them disabled/deferred unless explicitly requested.
- Wayfinder output under `resources/js/actions`, `resources/js/routes`, and `resources/js/wayfinder` is generated (gitignored). Regenerate via the Vite plugin or `npm run wayfinder:generate` before TypeScript/build checks on a fresh checkout.
- Prefer Vue 3 Composition API with `<script setup lang="ts">`, strict TypeScript, and small focused modules.
- Auth form fields use a single `grid gap-2` field unit (Label, control, InputError). Do not compound parent gap with control/error top margins.
- Keep UI aligned with Laravel's official Vue starter kit over time; architecture differs (Vue Router SPA vs Inertia), visual UX should not.
