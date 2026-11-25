<?php

declare(strict_types=1);

namespace app\tests\Functional;

use Yii;
use app\models\User;
use app\tests\Support\FunctionalTester;

/**
 * AuditLogCest verifies that REST transactions populate immutable audit logs
 * and that GET /api/v1/audit-logs returns formatted entries with user relations and decoded JSON.
 */
final class AuditLogCest
{
    private string $regToken = 'access_token_reg_000000000000002';
    private string $nurseToken = 'access_token_nurse_00000000000003';
    private string $doctorToken = 'access_token_doctor_0000000000004';
    private string $pharmaToken = 'access_token_pharma_0000000000005';
    private string $cashierToken = 'access_token_cashier_000000000007';

    private function obtainAdminToken(FunctionalTester $I): string
    {
        $I->haveHttpHeader('Accept', 'application/json');
        $I->deleteHeader('Authorization');
        $I->sendAjaxPostRequest('/api/v1/auth/login', [
            'username' => 'admin',
            'password' => 'admin123',
        ]);
        $I->seeResponseCodeIs(200);
        $res = json_decode($I->grabPageSource(), true);
        return (string)$res['data']['token'];
    }

    public function testAuditLogsAccessControl(FunctionalTester $I): void
    {
        // 1. Unauthenticated -> 401
        $I->haveHttpHeader('Accept', 'application/json');
        $I->deleteHeader('Authorization');
        $I->sendAjaxGetRequest('/api/v1/audit-logs');
        $I->seeResponseCodeIs(401);

        // 2. Non-admin -> 403
        $I->haveHttpHeader('Authorization', 'Bearer ' . $this->doctorToken);
        $I->sendAjaxGetRequest('/api/v1/audit-logs');
        $I->seeResponseCodeIs(403);

        // 3. Admin -> 200
        $adminToken = $this->obtainAdminToken($I);
        $I->haveHttpHeader('Authorization', 'Bearer ' . $adminToken);
        $I->sendAjaxGetRequest('/api/v1/audit-logs');
        $I->seeResponseCodeIs(200);
        $json = json_decode($I->grabPageSource(), true);
        $I->assertTrue($json['success']);
        $I->assertIsArray($json['data']);

        // 4. Not found view -> 404
        $I->sendAjaxGetRequest('/api/v1/audit-logs/99999999');
        $I->seeResponseCodeIs(404);
    }

    public function testAuthLoginAndLogoutPopulateAuditLogsWithUserRelation(FunctionalTester $I): void
    {
        $originalLabToken = User::findOne(['username' => 'lab'])?->access_token;

        $I->haveHttpHeader('Accept', 'application/json');
        $I->deleteHeader('Authorization');

        // 1. Login as lab user (no Bearer token, tests overrideUserId)
        $I->sendAjaxPostRequest('/api/v1/auth/login', [
            'username' => 'lab',
            'password' => 'admin123',
        ]);
        $I->seeResponseCodeIs(200);
        $loginRes = json_decode($I->grabPageSource(), true);
        $I->assertTrue($loginRes['success']);
        $labToken = $loginRes['data']['token'];
        $labUserId = (int)$loginRes['data']['user']['id'];

        // 2. Logout with Bearer token
        $I->haveHttpHeader('Authorization', 'Bearer ' . $labToken);
        $I->sendAjaxPostRequest('/api/v1/auth/logout', []);
        $I->seeResponseCodeIs(200);

        // Restore lab token so subsequent tests remain isolated
        if ($originalLabToken !== null) {
            Yii::$app->db->createCommand()
                ->update('{{%users}}', ['access_token' => $originalLabToken], ['id' => $labUserId])
                ->execute();
        }

        // 3. Admin inspects AUTH/LOGIN audit log
        $adminToken = $this->obtainAdminToken($I);
        $I->haveHttpHeader('Authorization', 'Bearer ' . $adminToken);
        $I->sendAjaxGetRequest("/api/v1/audit-logs?module=AUTH&action=LOGIN&user_id={$labUserId}");
        $I->seeResponseCodeIs(200);
        $loginLogs = json_decode($I->grabPageSource(), true);
        $I->assertTrue($loginLogs['success']);
        $I->assertNotEmpty($loginLogs['data'], 'AUTH/LOGIN audit log must be recorded.');

        $loginLog = $loginLogs['data'][0];
        $I->assertSame('AUTH', $loginLog['module']);
        $I->assertSame('LOGIN', $loginLog['action']);
        $I->assertSame($labUserId, $loginLog['user_id']);
        $I->assertIsArray($loginLog['user']);
        $I->assertSame('lab', $loginLog['user']['username']);
        $I->assertSame('Analis Laboratorium', $loginLog['user']['name']);
        $I->assertSame('lab', $loginLog['user']['role']);
        $I->assertIsArray($loginLog['new_values']);
        $I->assertIsArray($loginLog['details']);
        $I->assertArrayNotHasKey('password', $loginLog['new_values']);
        $I->assertArrayNotHasKey('access_token', $loginLog['new_values']);

        // 4. Admin inspects single audit log detail view
        $logId = (int)$loginLog['id'];
        $I->sendAjaxGetRequest("/api/v1/audit-logs/{$logId}");
        $I->seeResponseCodeIs(200);
        $viewRes = json_decode($I->grabPageSource(), true);
        $I->assertTrue($viewRes['success']);
        $I->assertSame($logId, $viewRes['data']['id']);
        $I->assertIsArray($viewRes['data']['user']);
        $I->assertSame('lab', $viewRes['data']['user']['username']);
        $I->assertIsArray($viewRes['data']['new_values']);

        // 5. Admin inspects AUTH/LOGOUT audit log
        $I->sendAjaxGetRequest("/api/v1/audit-logs?module=AUTH&action=LOGOUT&user_id={$labUserId}");
        $I->seeResponseCodeIs(200);
        $logoutLogs = json_decode($I->grabPageSource(), true);
        $I->assertTrue($logoutLogs['success']);
        $I->assertNotEmpty($logoutLogs['data'], 'AUTH/LOGOUT audit log must be recorded.');
        $I->assertSame('LOGOUT', $logoutLogs['data'][0]['action']);
        $I->assertSame('lab', $logoutLogs['data'][0]['user']['username']);
    }

    public function testEndToEndTransactionsPopulateAuditLogsAcrossModules(FunctionalTester $I): void
    {
        $I->haveHttpHeader('Accept', 'application/json');

        // 1. Create Patient (PATIENT/CREATE)
        $I->haveHttpHeader('Authorization', 'Bearer ' . $this->regToken);
        $uniqueNik = '32017777' . sprintf('%08d', random_int(10000000, 99999999));
        $I->sendAjaxPostRequest('/api/v1/patients', [
            'nik' => $uniqueNik,
            'name' => 'Pasien Audit Trail E2E',
            'birth_date' => '1992-03-15',
            'gender' => 'P',
            'address' => 'Jl. Audit No. 10, Jakarta',
            'phone' => '081355556666',
        ]);
        $I->seeResponseCodeIs(201);
        $patientId = (int)json_decode($I->grabPageSource(), true)['data']['id'];

        // 2. Create Registration (REGISTRATION/CREATE + BILLING/CREATE)
        $I->sendAjaxPostRequest('/api/v1/registrations', [
            'patient_id' => $patientId,
            'polyclinic_id' => 1,
            'doctor_id' => 1,
            'schedule_id' => 1,
            'insurance_type' => 'GENERAL',
        ]);
        $I->seeResponseCodeIs(201);
        $regId = (int)json_decode($I->grabPageSource(), true)['data']['id'];

        // 3. Create Nurse Assessment (EXAMINATION/CREATE)
        $I->haveHttpHeader('Authorization', 'Bearer ' . $this->nurseToken);
        $I->sendAjaxPostRequest('/api/v1/nurse-assessments', [
            'registration_id' => $regId,
            'nurse_id' => 1,
            'age_years' => 34,
            'gender' => 'P',
            'weight_kg' => 58.0,
            'height_cm' => 162.0,
            'systolic' => 118,
            'diastolic' => 76,
            'pulse_rate' => 78,
            'body_temp' => 36.7,
            'respiratory_rate' => 18,
            'chief_complaint' => 'Batuk ringan',
        ]);
        $I->seeResponseCodeIs(201);

        // 4. Create Doctor Examination & Action (EXAMINATION/CREATE)
        $I->haveHttpHeader('Authorization', 'Bearer ' . $this->doctorToken);
        $I->sendAjaxPostRequest('/api/v1/examinations', [
            'registration_id' => $regId,
            'doctor_id' => 1,
            'physical_exam' => 'Tenggorokan kemerahan',
            'primary_diagnosis_code' => 'J06.9',
            'primary_diagnosis_desc' => 'ISPA',
        ]);
        $I->seeResponseCodeIs(201);
        $examId = (int)json_decode($I->grabPageSource(), true)['data']['id'];

        $I->sendAjaxPostRequest("/api/v1/examinations/{$examId}/actions", [
            'action_id' => 1,
        ]);
        $I->seeResponseCodeIs(201);

        // 5. Create Prescription (PHARMACY/CREATE)
        $I->sendAjaxPostRequest('/api/v1/pharmacy/prescriptions', [
            'examination_id' => $examId,
            'items' => [
                [
                    'medicine_id' => 1,
                    'quantity' => 2,
                    'dosage' => '500 mg',
                    'frequency' => '3x1',
                ],
            ],
        ]);
        $I->seeResponseCodeIs(201);
        $presId = (int)json_decode($I->grabPageSource(), true)['data']['id'];

        // 6. Dispense Prescription (PHARMACY/DISPENSE + PHARMACY/UPDATE)
        $I->haveHttpHeader('Authorization', 'Bearer ' . $this->pharmaToken);
        $I->sendAjaxPostRequest("/api/v1/pharmacy/prescriptions/{$presId}/dispense");
        $I->seeResponseCodeIs(200);

        // 7. Pay Billing (BILLING/PAYMENT + BILLING/CREATE + BILLING/UPDATE)
        $I->haveHttpHeader('Authorization', 'Bearer ' . $this->cashierToken);
        $I->sendAjaxGetRequest("/api/v1/billings?registration_id={$regId}");
        $I->seeResponseCodeIs(200);
        $billingData = json_decode($I->grabPageSource(), true)['data'][0];
        $billingId = (int)$billingData['id'];
        $payable = (float)$billingData['patient_payable'];

        $I->sendAjaxPostRequest("/api/v1/billings/{$billingId}/pay", [
            'payment_method' => 'CASH',
            'amount_received' => $payable + 10000,
            'notes' => 'Pembayaran uji audit trail',
        ]);
        $I->seeResponseCodeIs(200);

        // 8. Admin queries GET /api/v1/audit-logs for each expected domain event
        $adminToken = $this->obtainAdminToken($I);
        $I->haveHttpHeader('Authorization', 'Bearer ' . $adminToken);

        $expectedQueries = [
            ['module' => 'PATIENT', 'action' => 'CREATE', 'record_id' => (string)$patientId, 'username' => 'pendaftaran'],
            ['module' => 'REGISTRATION', 'action' => 'CREATE', 'record_id' => (string)$regId, 'username' => 'pendaftaran'],
            ['module' => 'EXAMINATION', 'action' => 'CREATE', 'record_id' => (string)$examId, 'username' => 'dokter'],
            ['module' => 'PHARMACY', 'action' => 'CREATE', 'record_id' => (string)$presId, 'username' => 'dokter'],
            ['module' => 'PHARMACY', 'action' => 'UPDATE', 'record_id' => (string)$presId, 'username' => 'apotek'],
            ['module' => 'PHARMACY', 'action' => 'DISPENSE', 'record_id' => (string)$presId, 'username' => 'apotek'],
            ['module' => 'BILLING', 'action' => 'UPDATE', 'record_id' => (string)$billingId, 'username' => 'kasir'],
            ['module' => 'BILLING', 'action' => 'PAYMENT', 'record_id' => (string)$billingId, 'username' => 'kasir'],
        ];

        foreach ($expectedQueries as $expected) {
            $url = sprintf('/api/v1/audit-logs?module=%s&action=%s', $expected['module'], $expected['action']);
            $I->sendAjaxGetRequest($url);
            $I->seeResponseCodeIs(200);
            $res = json_decode($I->grabPageSource(), true);
            $I->assertTrue($res['success']);

            $matched = array_values(array_filter(
                $res['data'],
                static fn(array $item): bool => (string)$item['record_id'] === $expected['record_id']
            ));

            $I->assertNotEmpty(
                $matched,
                "Expected audit log {$expected['module']}/{$expected['action']} for record_id={$expected['record_id']}."
            );

            $log = $matched[0];
            $I->assertIsArray($log['user'], "User relation must be present for {$expected['module']}/{$expected['action']}.");
            $I->assertSame($expected['username'], $log['user']['username']);
            $I->assertNotEmpty($log['user']['name']);
            $I->assertNotEmpty($log['user']['role']);
            $I->assertIsArray($log['new_values'], "new_values must be decoded JSON array for {$expected['module']}/{$expected['action']}.");
            $I->assertIsArray($log['details'], "details must be decoded JSON array for {$expected['module']}/{$expected['action']}.");
        }
    }
}
