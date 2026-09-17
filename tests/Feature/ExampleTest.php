<?php

test('returns a successful spa shell response', function () {
    $response = $this->get('/');

    $response->assertOk();
    $response->assertViewIs('app');
});
