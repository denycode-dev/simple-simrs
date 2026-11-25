<?php

declare(strict_types=1);

namespace app\tests\Unit;

use Codeception\Test\Unit;
use app\behaviors\AuditTrailBehavior;
use app\models\AuditLog;
use app\models\Patient;

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

    public function testSanitizeDataSupportsCustomRedactedKeysAndNestedArrays(): void
    {
        $payload = [
            'username' => 'kasir',
            'password' => 'plain_pass',
            'Custom_Pin' => '987654',
            'nested' => [
                'token' => 'nested_token_val',
                'nik' => '3201010101900001',
                'safe_field' => 'visible',
            ],
        ];

        $sanitized = AuditLog::sanitizeData($payload, ['custom_pin', 'NIK']);

        $this->assertSame('kasir', $sanitized['username']);
        $this->assertSame('[REDACTED]', $sanitized['password']);
        $this->assertSame('[REDACTED]', $sanitized['Custom_Pin']);
        $this->assertSame('[REDACTED]', $sanitized['nested']['token']);
        $this->assertSame('[REDACTED]', $sanitized['nested']['nik']);
        $this->assertSame('visible', $sanitized['nested']['safe_field']);
    }

    public function testLogSupportsOverrideUserIdAndCustomRedactedKeys(): void
    {
        $log = AuditLog::log(
            'AUTH',
            'LOGIN',
            '1',
            ['username' => 'admin', 'pin_code' => '1234'],
            null,
            ['username' => 'admin', 'pin_code' => '1234', 'password' => 'admin123'],
            1,
            ['pin_code']
        );

        $this->assertNotNull($log->id);
        $this->assertSame(1, (int)$log->user_id);

        $details = json_decode((string)$log->details, true);
        $newValues = json_decode((string)$log->new_values, true);

        $this->assertSame('admin', $details['username']);
        $this->assertSame('[REDACTED]', $details['pin_code']);
        $this->assertSame('[REDACTED]', $newValues['pin_code']);
        $this->assertSame('[REDACTED]', $newValues['password']);
    }

    public function testLogTruncatesModuleActionAndRecordIdToMax50Chars(): void
    {
        $longModule = str_repeat('M', 70);
        $longAction = str_repeat('A', 65);
        $longRecordId = str_repeat('9', 80);

        $log = AuditLog::log($longModule, $longAction, $longRecordId);

        $this->assertNotNull($log->id);
        $this->assertSame(50, mb_strlen($log->module));
        $this->assertSame(50, mb_strlen($log->action));
        $this->assertSame(50, mb_strlen((string)$log->record_id));
    }

    public function testToApiArrayDecodesJsonFieldsAndIncludesUserRelation(): void
    {
        $log = AuditLog::log(
            'BILLING',
            'PAYMENT',
            '42',
            ['invoice_number' => 'INV-20261124-0001'],
            ['payment_status' => 'UNPAID'],
            ['payment_status' => 'PAID', 'amount' => 25000],
            1
        );

        /** @var AuditLog|null $loaded */
        $loaded = AuditLog::find()->where(['id' => $log->id])->with('user')->one();
        $this->assertNotNull($loaded);

        $formatted = $loaded->toApiArray();

        $this->assertSame((int)$log->id, $formatted['id']);
        $this->assertSame(1, $formatted['user_id']);
        $this->assertSame('BILLING', $formatted['module']);
        $this->assertSame('PAYMENT', $formatted['action']);
        $this->assertSame('42', $formatted['record_id']);
        $this->assertIsArray($formatted['old_values']);
        $this->assertSame('UNPAID', $formatted['old_values']['payment_status']);
        $this->assertIsArray($formatted['new_values']);
        $this->assertSame('PAID', $formatted['new_values']['payment_status']);
        $this->assertIsArray($formatted['details']);
        $this->assertSame('INV-20261124-0001', $formatted['details']['invoice_number']);

        $this->assertIsArray($formatted['user']);
        $this->assertSame(1, $formatted['user']['id']);
        $this->assertSame('admin', $formatted['user']['username']);
        $this->assertSame('Administrator Sistem', $formatted['user']['name']);
        $this->assertSame('admin', $formatted['user']['role']);
        $this->assertArrayNotHasKey('password_hash', $formatted['user']);
        $this->assertArrayNotHasKey('access_token', $formatted['user']);
        $this->assertArrayNotHasKey('auth_key', $formatted['user']);
    }

    public function testAuditTrailBehaviorForwardsSensitiveAttributes(): void
    {
        $patient = new Patient([
            'nik' => '32018888' . sprintf('%08d', random_int(10000000, 99999999)),
            'name' => 'Pasien Unit Sanitize',
            'birth_date' => '1995-05-05',
            'gender' => 'L',
            'address' => 'Jl. Unit Test No. 1',
            'phone' => '081234567899',
        ]);

        $patient->detachBehavior('auditTrail');
        $patient->attachBehavior('auditTrail', [
            'class' => AuditTrailBehavior::class,
            'module' => 'PATIENT',
            'sensitiveAttributes' => ['phone'],
        ]);

        $this->assertTrue($patient->save(), 'Patient should save cleanly.');

        /** @var AuditLog|null $log */
        $log = AuditLog::find()
            ->where([
                'module' => 'PATIENT',
                'action' => 'CREATE',
                'record_id' => (string)$patient->id,
            ])
            ->orderBy(['id' => SORT_DESC])
            ->one();

        $this->assertNotNull($log);
        $newValues = json_decode((string)$log->new_values, true);
        $this->assertSame('[REDACTED]', $newValues['phone']);
        $this->assertSame('Pasien Unit Sanitize', $newValues['name']);

        $patient->delete();
    }
}
