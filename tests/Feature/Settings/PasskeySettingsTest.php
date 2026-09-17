<?php

use App\Models\User;
use Laravel\Fortify\Features;
use Laravel\Passkeys\Passkey;

beforeEach(function () {
    $this->skipUnlessFortifyHas(Features::passkeys());
});

test('passkey list requires authentication', function () {
    $this->getJson('/api/v1/settings/passkeys')->assertUnauthorized();
});

test('unverified users cannot fetch passkey list', function () {
    $user = User::factory()->unverified()->create();

    $this->actingAs($user)
        ->getJson('/api/v1/settings/passkeys')
        ->assertForbidden();
});

test('authenticated users receive only their passkeys', function () {
    $userA = User::factory()->create();
    $userB = User::factory()->create();

    $passkeyA = createPasskeyFor($userA, ['name' => 'User A Passkey']);
    createPasskeyFor($userB, ['name' => 'User B Passkey']);

    $response = $this->actingAs($userA)
        ->getJson('/api/v1/settings/passkeys')
        ->assertOk();

    $ids = collect($response->json('data'))->pluck('id')->all();

    expect($ids)->toBe([$passkeyA->id]);
});

test('passkey resource contains intended safe fields', function () {
    $user = User::factory()->create();
    $passkey = createPasskeyFor($user);

    $this->actingAs($user)
        ->getJson('/api/v1/settings/passkeys')
        ->assertOk()
        ->assertJsonPath('data.0.id', $passkey->id)
        ->assertJsonPath('data.0.name', $passkey->name)
        ->assertJsonPath('data.0.authenticator', 'Windows Hello')
        ->assertJsonStructure([
            'data' => [
                [
                    'id',
                    'name',
                    'authenticator',
                    'created_at_diff',
                    'last_used_at_diff',
                ],
            ],
        ]);
});

test('passkey resource excludes credential and internal fields', function () {
    $user = User::factory()->create();
    createPasskeyFor($user);

    $response = $this->actingAs($user)
        ->getJson('/api/v1/settings/passkeys')
        ->assertOk();

    $payload = $response->json('data.0');

    expect($payload)->not->toHaveKey('credential');
    expect($payload)->not->toHaveKey('credential_id');
    expect($payload)->not->toHaveKey('user_id');
    expect($payload)->not->toHaveKey('user_handle');
    expect($payload)->not->toHaveKey('created_at');
    expect($payload)->not->toHaveKey('updated_at');
});

test('passkeys are ordered newest first', function () {
    $user = User::factory()->create();

    $older = createPasskeyFor($user, ['name' => 'Older Passkey']);
    $older->forceFill([
        'created_at' => now()->subDays(2),
        'updated_at' => now()->subDays(2),
    ])->save();

    $newer = createPasskeyFor($user, ['name' => 'Newer Passkey']);
    $newer->forceFill([
        'created_at' => now()->subDay(),
        'updated_at' => now()->subDay(),
    ])->save();

    $response = $this->actingAs($user)
        ->getJson('/api/v1/settings/passkeys')
        ->assertOk();

    $names = collect($response->json('data'))->pluck('name')->all();

    expect($names)->toBe([$newer->name, $older->name]);
});

test('passkey registration options require password confirmation when enabled', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->getJson('/user/passkeys/options')
        ->assertStatus(423);
});

test('passkey registration options succeed when password is confirmed', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->withSession(['auth.password_confirmed_at' => time()])
        ->getJson('/user/passkeys/options')
        ->assertOk()
        ->assertJsonStructure(['options']);
});

test('passkey store requires password confirmation when enabled', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->postJson('/user/passkeys', [
            'name' => 'Test Passkey',
            'credential' => [],
        ])
        ->assertStatus(423);
});

test('passkey deletion requires password confirmation when enabled', function () {
    $user = User::factory()->create();
    $passkey = createPasskeyFor($user);

    $this->actingAs($user)
        ->deleteJson('/user/passkeys/'.$passkey->id)
        ->assertStatus(423);

    expect(Passkey::query()->find($passkey->id))->not->toBeNull();
});

test('user cannot delete another users passkey', function () {
    $userA = User::factory()->create();
    $userB = User::factory()->create();
    $passkey = createPasskeyFor($userB);

    $this->actingAs($userA)
        ->withSession(['auth.password_confirmed_at' => time()])
        ->deleteJson('/user/passkeys/'.$passkey->id)
        ->assertForbidden();

    expect(Passkey::query()->find($passkey->id))->not->toBeNull();
});

test('passkey confirm options do not require password confirmation', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->getJson('/passkeys/confirm/options')
        ->assertOk()
        ->assertJsonStructure(['options']);
});

test('native passkey login options are available to guests', function () {
    $this->getJson('/passkeys/login/options')
        ->assertOk()
        ->assertJsonStructure(['options']);
});

test('passkey feature registers expected native routes', function () {
    expect(route('passkey.login-options'))->toBe(url('/passkeys/login/options'));
    expect(route('passkey.login'))->toBe(url('/passkeys/login'));
    expect(route('passkey.confirm-options'))->toBe(url('/passkeys/confirm/options'));
    expect(route('passkey.confirm'))->toBe(url('/passkeys/confirm'));
    expect(route('passkey.registration-options'))->toBe(url('/user/passkeys/options'));
    expect(route('passkey.store'))->toBe(url('/user/passkeys'));
    expect(route('passkey.destroy', ['passkey' => 1]))->toBe(url('/user/passkeys/1'));
});
