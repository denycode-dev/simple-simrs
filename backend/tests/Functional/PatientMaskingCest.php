<?php

declare(strict_types=1);

namespace app\tests\Functional;

use app\tests\Support\FunctionalTester;

/**
 * PatientMaskingCest tests patient data masking by default and audit-logged unmasking endpoint.
 */
final class PatientMaskingCest
{
    private string $doctorToken = 'access_token_doctor_0000000000004';

    public function testPatientDetailIsMaskedByDefault(FunctionalTester $I): void
    {
        $I->haveHttpHeader('Accept', 'application/json');
        $I->haveHttpHeader('Authorization', 'Bearer ' . $this->doctorToken);

        $I->sendAjaxGetRequest('/api/v1/patients/1');
        $I->seeResponseCodeIs(200);

        $json = json_decode($I->grabPageSource(), true);
        $I->assertTrue($json['success']);
        $data = $json['data'];

        $I->assertTrue($data['is_masked'], 'Patient data should be masked by default.');
        $I->assertMatchesRegularExpression('/^\d{6}\*{10}$/', $data['nik'], 'NIK must be masked leaving first 6 digits visible.');
        $I->assertSame('320101**********', $data['nik']);
    }

    public function testUnmaskPatientLogsAuditTrailAndReturnsRawNik(FunctionalTester $I): void
    {
        $I->haveHttpHeader('Accept', 'application/json');
        $I->haveHttpHeader('Authorization', 'Bearer ' . $this->doctorToken);

        $reason = 'Verifikasi identitas pasien untuk tindakan medis RME';
        $I->sendAjaxPostRequest('/api/v1/patients/1/unmask', [
            'reason' => $reason,
        ]);
        $I->seeResponseCodeIs(200);

        $json = json_decode($I->grabPageSource(), true);
        $I->assertTrue($json['success']);
        $I->assertSame('Data NIK dan kontak pasien berhasil dibuka.', $json['message']);

        $data = $json['data'];
        $I->assertFalse($data['is_masked'], 'Data should be unmasked.');
        $I->assertSame('3201010101900001', $data['nik'], 'Raw NIK should be returned when unmasked.');

        // Verify audit log entry
        $exists = (new \yii\db\Query())
            ->from('{{%audit_logs}}')
            ->where([
                'module' => 'PATIENTS',
                'action' => 'UNMASK_DATA',
                'record_id' => '1',
            ])
            ->exists();
        $I->assertTrue($exists, 'Audit log UNMASK_DATA must be recorded in database.');
    }
}
