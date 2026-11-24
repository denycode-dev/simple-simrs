<?php

declare(strict_types=1);

namespace app\tests\Functional;

use app\tests\Support\FunctionalTester;

/**
 * BillingCalculationCest tests unified billing cost aggregation endpoint.
 */
final class BillingCalculationCest
{
    private string $cashierToken = 'access_token_cashier_000000000007';
    private string $doctorToken = 'access_token_doctor_0000000000004';

    public function testUnifiedBillingSummaryAggregatesAllCostComponents(FunctionalTester $I): void
    {
        // 1. Doctor sets up visit, examination, action, and prescription
        $I->haveHttpHeader('Accept', 'application/json');
        $I->haveHttpHeader('Authorization', 'Bearer ' . $this->doctorToken);

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
            'physical_exam' => 'Faringitis sedang',
            'primary_diagnosis_code' => 'J02.9',
            'primary_diagnosis_desc' => 'Faringitis akut',
        ]);
        $I->seeResponseCodeIs(201);
        $exam = json_decode($I->grabPageSource(), true);
        $examId = $exam['data']['id'];

        // Add action
        $I->sendAjaxPostRequest("/api/v1/examinations/{$examId}/actions", [
            'action_id' => 1,
            'notes' => 'Pemeriksaan standar',
        ]);
        $I->seeResponseCodeIs(201);
        $actionRes = json_decode($I->grabPageSource(), true);
        $actionTariff = (float)$actionRes['data']['tariff'];

        // Add prescription (qty = 4)
        $I->sendAjaxPostRequest('/api/v1/pharmacy/prescriptions', [
            'examination_id' => $examId,
            'items' => [
                [
                    'medicine_id' => 1,
                    'quantity' => 4,
                    'dosage' => '500 mg',
                    'frequency' => '3x1',
                ]
            ]
        ]);
        $I->seeResponseCodeIs(201);
        $presRes = json_decode($I->grabPageSource(), true);
        $medSubtotal = (float)$presRes['data']['items'][0]['subtotal'];

        // 2. Cashier queries billing summary
        $I->haveHttpHeader('Authorization', 'Bearer ' . $this->cashierToken);
        $I->sendAjaxGetRequest("/api/v1/billings?registration_id={$regId}");
        $I->seeResponseCodeIs(200);
        $billingsList = json_decode($I->grabPageSource(), true);
        $I->assertNotEmpty($billingsList['data']);
        $billingId = $billingsList['data'][0]['id'];

        $I->sendAjaxGetRequest("/api/v1/billings/{$billingId}/summary");
        $I->seeResponseCodeIs(200);
        $summaryRes = json_decode($I->grabPageSource(), true);
        $I->assertTrue($summaryRes['success']);
        $data = $summaryRes['data'];

        $I->assertSame('UNPAID', $data['payment_status']);
        $I->assertSame('GENERAL', $data['insurance_type']);
        $I->assertEquals(25000.00, (float)$data['total_registration_fee']);
        $I->assertEquals($actionTariff, (float)$data['total_actions_fee']);
        $I->assertEquals($medSubtotal, (float)$data['total_medicines_fee']);
        $I->assertEquals(0.00, (float)$data['total_lab_fee']);

        $expectedGrandTotal = 25000.00 + $actionTariff + $medSubtotal;
        $I->assertEquals($expectedGrandTotal, (float)$data['total_amount']);
        $I->assertEquals($expectedGrandTotal, (float)$data['patient_payable']);
        $I->assertEquals(0.00, (float)$data['covered_by_bpjs']);

        $I->assertArrayHasKey('breakdown', $data);
        $I->assertNotEmpty($data['breakdown']['actions']);
        $I->assertNotEmpty($data['breakdown']['medicines']);
    }
}
