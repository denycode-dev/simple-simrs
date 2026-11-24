<?php

declare(strict_types=1);

namespace app\tests\Functional;

use app\tests\Support\FunctionalTester;

/**
 * PrescriptionStockCheckCest tests e-prescription creation and real-time stock pre-validation.
 */
final class PrescriptionStockCheckCest
{
    private string $doctorToken = 'access_token_doctor_0000000000004';

    public function createPrescriptionFailsWhenStockInsufficient(FunctionalTester $I): void
    {
        $I->haveHttpHeader('Accept', 'application/json');
        $I->haveHttpHeader('Authorization', 'Bearer ' . $this->doctorToken);

        // 1. Create registration & examination
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

        $I->sendAjaxPostRequest('/api/v1/examinations', [
            'registration_id' => $regId,
            'doctor_id' => 1,
            'physical_exam' => 'Demam tinggi 3 hari',
            'primary_diagnosis_code' => 'R50.9',
            'primary_diagnosis_desc' => 'Demam tidak spesifik',
        ]);
        $I->seeResponseCodeIs(201);
        $exam = json_decode($I->grabPageSource(), true);
        $examId = $exam['data']['id'];

        // 2. Doctor attempts to prescribe medicine exceeding stock (e.g. 999999 items)
        $I->sendAjaxPostRequest('/api/v1/pharmacy/prescriptions', [
            'examination_id' => $examId,
            'items' => [
                [
                    'medicine_id' => 1,
                    'quantity' => 999999,
                    'dosage' => '500 mg',
                    'frequency' => '3x1 tablet',
                    'instructions' => 'Bila demam',
                ]
            ]
        ]);
        $I->seeResponseCodeIs(422);
        $res = json_decode($I->grabPageSource(), true);
        $I->assertFalse($res['success']);
        $I->assertStringContainsString('tidak mencukupi', $res['message']);
    }

    public function createPrescriptionSuccessfullyWhenStockSufficient(FunctionalTester $I): void
    {
        $I->haveHttpHeader('Accept', 'application/json');
        $I->haveHttpHeader('Authorization', 'Bearer ' . $this->doctorToken);

        // 1. Create registration & examination
        $I->sendAjaxPostRequest('/api/v1/registrations', [
            'patient_id' => 2,
            'polyclinic_id' => 1,
            'doctor_id' => 1,
            'schedule_id' => 1,
            'insurance_type' => 'GENERAL',
        ]);
        $I->seeResponseCodeIs(201);
        $reg = json_decode($I->grabPageSource(), true);
        $regId = $reg['data']['id'];

        $I->sendAjaxPostRequest('/api/v1/examinations', [
            'registration_id' => $regId,
            'doctor_id' => 1,
            'physical_exam' => 'Batuk berdahak',
            'primary_diagnosis_code' => 'J20.9',
            'primary_diagnosis_desc' => 'Bronkitis akut tidak spesifik',
        ]);
        $I->seeResponseCodeIs(201);
        $exam = json_decode($I->grabPageSource(), true);
        $examId = $exam['data']['id'];

        // 2. Doctor prescribes valid medicine with sufficient stock
        $I->sendAjaxPostRequest('/api/v1/pharmacy/prescriptions', [
            'examination_id' => $examId,
            'items' => [
                [
                    'medicine_id' => 1,
                    'quantity' => 10,
                    'dosage' => '500 mg',
                    'frequency' => '3x1 tablet sesudah makan',
                    'instructions' => 'Habiskan obat',
                ]
            ]
        ]);
        $I->seeResponseCodeIs(201);
        $presRes = json_decode($I->grabPageSource(), true);
        $I->assertTrue($presRes['success']);
        $I->assertSame('e-Resep dokter berhasil dibuat.', $presRes['message']);
        $I->assertMatchesRegularExpression('/^RX-\d{8}-\d{4}$/', $presRes['data']['prescription_number']);
        $I->assertSame('PENDING', $presRes['data']['status']);
        $I->assertNotEmpty($presRes['data']['items']);
        $I->assertSame(10, (int)$presRes['data']['items'][0]['quantity']);
        $I->assertGreaterThan(0, (float)$presRes['data']['items'][0]['subtotal']);

        // 3. Verify registration status advanced to PHARMACY
        $I->sendAjaxGetRequest("/api/v1/registrations/{$regId}");
        $I->seeResponseCodeIs(200);
        $regJson = json_decode($I->grabPageSource(), true);
        $I->assertSame('PHARMACY', $regJson['data']['status']);
    }
}
