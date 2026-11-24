<?php

declare(strict_types=1);

namespace app\tests\Unit;

use Codeception\Test\Unit;
use app\behaviors\AuditTrailBehavior;
use app\models\AuditLog;
use app\models\User;
use Yii;

final class AuditTrailSanitizationTest extends Unit
{
    public function testSanitizeSensitiveAttributesInAuditLog(): void
    {
        $sensitiveData = [
            'username' => 'testuser',
            'email' => 'test@hospital.com',
            'password_hash' => '$2y$13$superSecretHashValue12345',
            'auth_key' => 'auth_key_secret_random_token',
            'access_token' => 'access_token_bearer_secret_123',
            'role' => 'doctor',
        ];

        $log = AuditLog::log(
            'USERS',
            'CREATE',
            '100',
            ['reason' => 'User registration'],
            null,
            $sensitiveData
        );

        $this->assertNotNull($log->id);
        $savedNewValues = json_decode($log->new_values, true);

        $this->assertSame('testuser', $savedNewValues['username']);
        $this->assertSame('test@hospital.com', $savedNewValues['email']);
        $this->assertSame('[REDACTED]', $savedNewValues['password_hash']);
        $this->assertSame('[REDACTED]', $savedNewValues['auth_key']);
        $this->assertSame('[REDACTED]', $savedNewValues['access_token']);
    }

    public function testAuditLogIsImmutable(): void
    {
        $log = AuditLog::log(
            'PATIENTS',
            'UNMASK_DATA',
            '1',
            ['reason' => 'Verifikasi BPJS Kesehatan'],
            null,
            ['nik' => '3201010101010001']
        );

        $this->assertNotNull($log->id);

        // Attempt to update
        $log->action = 'TAMPERED';
        $saved = $log->save();
        $this->assertFalse($saved, 'Audit log cannot be updated.');

        // Attempt to delete
        $deleted = $log->delete();
        $this->assertFalse($deleted, 'Audit log cannot be deleted.');
    }
}
