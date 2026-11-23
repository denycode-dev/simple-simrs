<?php

declare(strict_types=1);

namespace app\tests\Unit\Models;

use Codeception\Test\Unit;
use app\models\User;

/**
 * UserAuthTest verifies PostgreSQL ActiveRecord User model authentication features.
 */
final class UserAuthTest extends Unit
{
    public function testFindByUsernameFindsRealPostgresUser(): void
    {
        $dokter = User::findByUsername('dokter');
        $this->assertNotNull($dokter, 'User `dokter` must be retrievable from database.');
        $this->assertSame('dokter', $dokter->username);
        $this->assertSame('doctor', $dokter->role);
        $this->assertSame('dr. Budi Santoso, Sp.PD', $dokter->full_name);
        $this->assertTrue((bool)$dokter->is_active);
    }

    public function testValidatePasswordBcrypt(): void
    {
        $dokter = User::findByUsername('dokter');
        $this->assertNotNull($dokter);
        $this->assertTrue($dokter->validatePassword('admin123'), 'Bcrypt password admin123 must validate.');
        $this->assertFalse($dokter->validatePassword('wrongpassword'), 'Incorrect password must be rejected.');
    }

    public function testFindIdentityByAccessToken(): void
    {
        $dokter = User::findByUsername('dokter');
        $this->assertNotNull($dokter);
        $token = $dokter->access_token;
        $this->assertNotEmpty($token, 'Access token must not be empty.');

        $found = User::findIdentityByAccessToken($token);
        $this->assertNotNull($found, 'User must be found by access token.');
        $this->assertEquals($dokter->id, $found->getId());
        $this->assertSame('dokter', $found->username);
    }

    public function testGenerateAccessToken(): void
    {
        $dokter = User::findByUsername('dokter');
        $this->assertNotNull($dokter);
        $oldToken = $dokter->access_token;
        $newToken = $dokter->generateAccessToken();
        $this->assertNotEmpty($newToken);
        $this->assertNotSame($oldToken, $newToken);
    }
}
