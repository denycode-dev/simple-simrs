<?php

declare(strict_types=1);

namespace app\tests\Functional;

use app\tests\Support\FunctionalTester;

/**
 * ActionBillingIntegrationCest tests medical action input, tariff locking, and automatic billing recalculation.
 */
final class ActionBillingIntegrationCest
{
    private string $doctorToken = 'access_token_doctor_0000000000004';

    public function testAddMedicalActionLocksTariffAndRecalculatesGeneralBilling(FunctionalTester $I): void
    {
        $I->haveHttpHeader('Accept', 'application/json');
        $I->haveHttpHeader('Authorization', 'Bearer ' . $this->doctorToken);

        // 1. Create a General registration
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

        // 2. Doctor creates examination
        $I->sendAjaxPostRequest('/api/v1/examinations', [
            'registration_id' => $regId,
            'doctor_id' => 1,
            'physical_exam' => 'Faringitis sedang',
            'primary_diagnosis_code' => 'J02.9',
            'primary_diagnosis_desc' => 'Faringitis akut tidak spesifik',
        ]);
        $I->seeResponseCodeIs(201);
        $exam = json_decode($I->grabPageSource(), true);
        $examId = $exam['data']['id'];

        // 3. Add medical action to examination (action_id = 1, e.g. Konsultasi & Pemeriksaan Dokter Umum: 35000)
        $I->sendAjaxPostRequest("/api/v1/examinations/{$examId}/actions", [
            'action_id' => 1,
            'notes' => 'Pemeriksaan fisik dan konsultasi standar',
        ]);
        $I->seeResponseCodeIs(201);
        $actionRes = json_decode($I->grabPageSource(), true);
        $I->assertTrue($actionRes['success']);
        $I->assertSame('Tindakan medis berhasil ditambahkan.', $actionRes['message']);
        $I->assertGreaterThan(0, (float)$actionRes['data']['tariff']);

        // 4. Check examination view includes the added action and billing is updated
        $I->sendAjaxGetRequest("/api/v1/examinations/{$examId}");
        $I->seeResponseCodeIs(200);
        $viewJson = json_decode($I->grabPageSource(), true);
        $I->assertTrue($viewJson['success']);
        $I->assertNotEmpty($viewJson['data']['actions']);
        $I->assertSame(1, (int)$viewJson['data']['actions'][0]['action_id']);

        $billing = $viewJson['data']['registration']['billing'];
        $I->assertNotNull($billing);
        $I->assertGreaterThan(0, (float)$billing['total_actions_fee']);
        $expectedTotal = (float)$billing['total_registration_fee'] + (float)$billing['total_actions_fee'];
        $I->assertEquals($expectedTotal, (float)$billing['total_amount']);
        $I->assertEquals($expectedTotal, (float)$billing['patient_payable']);
        $I->assertEquals(0.00, (float)$billing['covered_by_bpjs']);
    }

    public function testAddMedicalActionBpjsBillingFullCoverage(FunctionalTester $I): void
    {
        $I->haveHttpHeader('Accept', 'application/json');
        $I->haveHttpHeader('Authorization', 'Bearer ' . $this->doctorToken);

        // 1. Create a BPJS registration
        $I->sendAjaxPostRequest('/api/v1/registrations', [
            'patient_id' => 2,
            'polyclinic_id' => 1,
            'doctor_id' => 1,
            'schedule_id' => 1,
            'insurance_type' => 'BPJS',
        ]);
        $I->seeResponseCodeIs(201);
        $reg = json_decode($I->grabPageSource(), true);
        $regId = $reg['data']['id'];

        // 2. Doctor creates examination
        $I->sendAjaxPostRequest('/api/v1/examinations', [
            'registration_id' => $regId,
            'doctor_id' => 1,
            'physical_exam' => 'Luka lecet di lengan',
            'primary_diagnosis_code' => 'T14.0',
            'primary_diagnosis_desc' => 'Luka lecet superfisial',
        ]);
        $I->seeResponseCodeIs(201);
        $exam = json_decode($I->grabPageSource(), true);
        $examId = $exam['data']['id'];

        // 3. Add medical action (action_id = 2, Rawat Luka Ringan)
        $I->sendAjaxPostRequest("/api/v1/examinations/{$examId}/actions", [
            'action_id' => 2,
            'notes' => 'Pembersihan luka dan antiseptik',
        ]);
        $I->seeResponseCodeIs(201);

        // 4. Verify billing covers all expenses for BPJS
        $I->sendAjaxGetRequest("/api/v1/examinations/{$examId}");
        $I->seeResponseCodeIs(200);
        $viewJson = json_decode($I->grabPageSource(), true);
        $billing = $viewJson['data']['registration']['billing'];

        $I->assertGreaterThan(0, (float)$billing['total_actions_fee']);
        $I->assertEquals((float)$billing['total_amount'], (float)$billing['covered_by_bpjs']);
        $I->assertEquals(0.00, (float)$billing['patient_payable']);
    }
}
