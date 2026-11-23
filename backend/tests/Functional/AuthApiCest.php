<?php

declare(strict_types=1);

namespace app\tests\Functional;

use app\tests\Support\FunctionalTester;

/**
 * AuthApiCest verifies REST authentication endpoints (login, me, logout, 401, 422).
 */
final class AuthApiCest
{
    public function loginSuccessfullyWithDoctorAccount(FunctionalTester $I): void
    {
        $I->haveHttpHeader('Accept', 'application/json');
        $I->sendAjaxPostRequest('/api/v1/auth/login', [
            'username' => 'dokter',
            'password' => 'admin123',
        ]);
        $I->seeResponseCodeIs(200);

        $raw = $I->grabPageSource();
        $json = json_decode($raw, true);

        $I->assertTrue($json['success']);
        $I->assertSame('Autentikasi berhasil.', $json['message']);
        $I->assertNotEmpty($json['data']['token']);
        $I->assertSame('Bearer', $json['data']['tokenType']);
        $I->assertSame('dokter', $json['data']['user']['username']);
        $I->assertSame('doctor', $json['data']['user']['role']);
    }

    public function loginFailsWithEmptyCredentials(FunctionalTester $I): void
    {
        $I->haveHttpHeader('Accept', 'application/json');
        $I->sendAjaxPostRequest('/api/v1/auth/login', []);
        $I->seeResponseCodeIs(422);

        $raw = $I->grabPageSource();
        $json = json_decode($raw, true);

        $I->assertFalse($json['success']);
        $I->assertSame('Validasi input login gagal', $json['message']);
        $I->assertArrayHasKey('username', $json['errors']);
        $I->assertArrayHasKey('password', $json['errors']);
    }

    public function loginFailsWithWrongPassword(FunctionalTester $I): void
    {
        $I->haveHttpHeader('Accept', 'application/json');
        $I->sendAjaxPostRequest('/api/v1/auth/login', [
            'username' => 'dokter',
            'password' => 'wrongpass_123',
        ]);
        $I->seeResponseCodeIs(401);

        $raw = $I->grabPageSource();
        $json = json_decode($raw, true);

        $I->assertFalse($json['success']);
        $I->assertSame('Nama pengguna atau kata sandi tidak valid.', $json['message']);
    }

    public function getMeSuccessfullyWithBearerToken(FunctionalTester $I): void
    {
        $token = 'access_token_doctor_0000000000004';
        $I->haveHttpHeader('Accept', 'application/json');
        $I->haveHttpHeader('Authorization', 'Bearer ' . $token);
        $I->sendAjaxGetRequest('/api/v1/auth/me');
        $I->seeResponseCodeIs(200);

        $raw = $I->grabPageSource();
        $json = json_decode($raw, true);

        $I->assertTrue($json['success']);
        $I->assertSame('Data profil pengguna berhasil dimuat.', $json['message']);
        $I->assertSame('dokter', $json['data']['username']);
        $I->assertSame('doctor', $json['data']['role']);
    }

    public function getMeFailsWithoutToken(FunctionalTester $I): void
    {
        $I->haveHttpHeader('Accept', 'application/json');
        $I->sendAjaxGetRequest('/api/v1/auth/me');
        $I->seeResponseCodeIs(401);

        $raw = $I->grabPageSource();
        $json = json_decode($raw, true);

        $I->assertFalse($json['success']);
    }

    public function logoutSuccessfullyWithBearerToken(FunctionalTester $I): void
    {
        $token = 'access_token_admin_00000000000001';
        $I->haveHttpHeader('Accept', 'application/json');
        $I->haveHttpHeader('Authorization', 'Bearer ' . $token);
        $I->sendAjaxPostRequest('/api/v1/auth/logout', []);
        $I->seeResponseCodeIs(200);

        $raw = $I->grabPageSource();
        $json = json_decode($raw, true);

        $I->assertTrue($json['success']);
        $I->assertSame('Sesi berhasil diakhiri.', $json['message']);
    }
}
