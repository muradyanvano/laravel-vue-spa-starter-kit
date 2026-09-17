<?php

use App\Models\User;
use Illuminate\Support\Facades\Storage;

test('serves the spa shell for the home route', function () {
    $response = $this->get('/');

    $response->assertOk();
    $response->assertViewIs('app');
    $response->assertSee('id="app"', false);
});

test('serves the spa shell for frontend routes on direct refresh', function (string $path) {
    $response = $this->get($path);

    $response->assertOk();
    $response->assertViewIs('app');
})->with([
    '/dashboard',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password/example-token',
    '/settings/profile',
    '/settings/security',
    '/settings/appearance',
    '/settings/password',
    '/settings/two-factor',
    '/unknown-spa-path',
]);

test('serves confirm-password spa shell for authenticated users', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/confirm-password')
        ->assertOk()
        ->assertViewIs('app');
});

test('serves two-factor-challenge spa shell for guests with pending login', function () {
    $user = User::factory()->withTwoFactor()->create();

    $this->postJson('/login', [
        'email' => $user->email,
        'password' => 'password',
    ])->assertOk();

    $this->get('/two-factor-challenge')
        ->assertOk()
        ->assertViewIs('app');
});

test('redirects two-factor-challenge to login without pending challenge', function () {
    $this->get('/two-factor-challenge')
        ->assertRedirect(route('login'));
});

test('does not swallow native passkey login options with the spa fallback', function () {
    $this->getJson('/passkeys/login/options')
        ->assertOk()
        ->assertJsonStructure(['options'])
        ->assertDontSee('id="app"', false);
});

test('does not swallow native passkey registration options with the spa fallback', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->withSession(['auth.password_confirmed_at' => time()])
        ->getJson('/user/passkeys/options')
        ->assertOk()
        ->assertJsonStructure(['options'])
        ->assertDontSee('id="app"', false);
});

test('does not swallow api routes with the spa fallback', function () {
    $response = $this->getJson('/api/v1/user');

    $response->assertUnauthorized();
    $response->assertJsonMissingPath('id');
});

test('does not swallow sanctum csrf cookie route', function () {
    $response = $this->get('/sanctum/csrf-cookie');

    $response->assertNoContent();
});

test('does not swallow fortify email verification routes', function () {
    $response = $this->get('/email/verify/1/invalid');

    $response->assertRedirect(route('login'));
});

test('health endpoint remains available', function () {
    $this->get('/up')->assertOk();
});

test('serves the spa shell for paths that share a prefix with reserved routes', function () {
    $this->get('/upload')->assertOk()->assertViewIs('app');
    $this->get('/api-docs')->assertOk()->assertViewIs('app');
    $this->get('/apiary')->assertOk()->assertViewIs('app');
    $this->get('/emailer')->assertOk()->assertViewIs('app');
    $this->get('/storagefoo')->assertOk()->assertViewIs('app');
    $this->get('/sanctumfoo')->assertOk()->assertViewIs('app');
    $this->get('/upcoming')->assertOk()->assertViewIs('app');
});

test('unknown api routes return json not the spa shell', function () {
    $response = $this->getJson('/api/v1/does-not-exist');

    $response->assertNotFound();
    $response->assertHeader('content-type', 'application/json');
    $response->assertDontSee('id="app"', false);
});

test('does not swallow storage routes with the spa fallback', function () {
    $disk = Storage::disk('local');
    $disk->put('phase1-storage-probe.txt', 'storage-ok');

    // Unsigned private disk URLs must not fall through to the SPA shell.
    $this->get('/storage/phase1-storage-probe.txt')
        ->assertForbidden()
        ->assertDontSee('id="app"', false);

    $signedUrl = $disk->temporaryUrl(
        'phase1-storage-probe.txt',
        now()->addMinutes(5),
    );

    $this->get($signedUrl)
        ->assertOk()
        ->assertStreamedContent('storage-ok');

    $this->get('/storage/missing-phase1-file.txt')
        ->assertForbidden()
        ->assertDontSee('id="app"', false);

    $disk->delete('phase1-storage-probe.txt');
});
