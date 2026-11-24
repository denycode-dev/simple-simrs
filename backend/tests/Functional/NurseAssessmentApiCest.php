<?php

declare(strict_types=1);

namespace app\tests\Functional;

use app\tests\Support\FunctionalTester;

/**
 * NurseAssessmentApiCest tests initial nursing triage assessment endpoints.
 */
final class NurseAssessmentApiCest
{
    private string $nurseToken = 'access_token_nurse_00000000000003';

    public function createNurseAssessmentSuccessfullyAndAdvanceQueue(FunctionalTester $I): void
    {
        $I->haveHttpHeader('Accept', 'application/json');
        $I->haveHttpHeader('Authorization', 'Bearer ' . $this->nurseToken);

        // 1. Create a registration first
        $I->sendAjaxPostRequest('/api/v1/registrations', [
            'patient_id' => 1,
            'polyclinic_id' => 1,
            'doctor_id' => 1,
            'schedule_id' => 1,
            'insurance_type' => 'GENERAL',
        ]);
        $I->seeResponseCodeIs(201);
        $reg = json_decode($I->grabPageSource(), true);
        $regId = $reg['data']['id'];

        // 2. Submit nurse assessment
        $I->sendAjaxPostRequest('/api/v1/nurse-assessments', [
            'registration_id' => $regId,
            'nurse_id' => 1,
            'age_years' => 34,
            'gender' => 'L',
            'weight_kg' => 70.5,
            'height_cm' => 172.0,
            'systolic' => 120,
            'diastolic' => 80,
            'pulse_rate' => 80,
            'body_temp' => 36.6,
            'respiratory_rate' => 18,
            'chief_complaint' => 'Demam dan pusing sejak 2 hari yang lalu',
            'allergy_history' => 'Alergi obat Amoxicillin',
            'disease_history' => 'Riwayat maag/gastritis',
            'notes' => 'Pasien tampak lemas',
        ]);
        $I->seeResponseCodeIs(201);

        $json = json_decode($I->grabPageSource(), true);
        $I->assertTrue($json['success']);
        $I->assertSame('Asesmen awal keperawatan berhasil disimpan.', $json['message']);
        $I->assertSame(120, (int)$json['data']['systolic']);
        $I->assertSame(80, (int)$json['data']['diastolic']);

        // 3. Verify registration queue advanced to WAITING_DOCTOR
        $I->sendAjaxGetRequest("/api/v1/registrations/{$regId}");
        $I->seeResponseCodeIs(200);
        $regCheck = json_decode($I->grabPageSource(), true);
        $I->assertSame('WAITING_DOCTOR', $regCheck['data']['status']);
    }

    public function createNurseAssessmentFailsWithMissingVitalSigns(FunctionalTester $I): void
    {
        $I->haveHttpHeader('Accept', 'application/json');
        $I->haveHttpHeader('Authorization', 'Bearer ' . $this->nurseToken);

        $I->sendAjaxPostRequest('/api/v1/nurse-assessments', [
            'registration_id' => 1,
            'nurse_id' => 1,
            'chief_complaint' => 'Hanya keluhan tanpa TTV',
        ]);
        $I->seeResponseCodeIs(422);

        $json = json_decode($I->grabPageSource(), true);
        $I->assertFalse($json['success']);
        $I->assertArrayHasKey('systolic', $json['errors']);
    }
}
