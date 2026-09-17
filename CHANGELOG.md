# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2026-09-18

### Added

- Passkey sign-in.
- Passkey-based password confirmation.
- Passkey registration and management from Security settings.
- Safe authenticated passkey metadata API (`GET /api/v1/settings/passkeys`).
- WebAuthn integration through Laravel Fortify passkeys and `@laravel/passkeys`.

### Security

- Passkey list and current-user endpoints expose only safe metadata; WebAuthn credentials and challenges are never serialized to the SPA.

[1.1.0]: https://github.com/muradyanvano/laravel-vue-spa-starter-kit/compare/v1.0.0...v1.1.0

## [1.0.0] - 2026-09-17

### Added

- Initial community Laravel Vue SPA starter kit (Vue Router, Fortify, Sanctum, no Inertia)
- Authenticated application shell, settings (profile / security / appearance), and 2FA management
- Pest and Vitest coverage, CI (including Node 22/25 and fresh-consumer export checks)
- Packaging docs: README, LICENSE, NOTICE, SECURITY, CONTRIBUTING

[Unreleased]: https://github.com/muradyanvano/laravel-vue-spa-starter-kit/compare/v1.1.0...HEAD
[1.0.0]: https://github.com/muradyanvano/laravel-vue-spa-starter-kit/releases/tag/v1.0.0
