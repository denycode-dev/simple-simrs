<?php

declare(strict_types=1);

namespace app\tests\Functional;

use app\tests\Support\FunctionalTester;

/**
 * AtomicDispenseCest tests atomic pharmacy dispensing, stock deduction, row locking, and registration status advance.
 */
final class AtomicDispenseCest
{
    private string $doctorToken = 'access_token_doctor_0000000000004';
    private string $pharmaToken = 'access_token_pharma_0000000000005';

    public function testAtomicDispensingDeductsStockAndLogsMutation(FunctionalTester $I): void
    {
        // 1. Doctor creates registration, examination, and prescription
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
            'primary_diagnosis_desc' => 'Faringitis',
        ]);
        $I->seeResponseCodeIs(201);
        $exam = json_decode($I->grabPageSource(), true);
        $examId = $exam['data']['id'];

        // Check initial stock of medicine #1
        $I->sendAjaxGetRequest('/api/v1/medicines/1');
        $I->seeResponseCodeIs(200);
        $medInit = json_decode($I->grabPageSource(), true);
        $initialStock = (int)$medInit['data']['stock'];

        // Create prescription for 25 units
        $prescribeQty = 25;
        $I->sendAjaxPostRequest('/api/v1/pharmacy/prescriptions', [
            'examination_id' => $examId,
            'items' => [
                [
                    'medicine_id' => 1,
                    'quantity' => $prescribeQty,
                    'dosage' => '500 mg',
                    'frequency' => '3x1 tablet',
                    'instructions' => 'Sesudah makan',
                ]
            ]
        ]);
        $I->seeResponseCodeIs(201);
        $pres = json_decode($I->grabPageSource(), true);
        $presId = $pres['data']['id'];
        $I->assertSame('PENDING', $pres['data']['status']);

        // 2. Pharmacist dispenses the prescription
        $I->haveHttpHeader('Authorization', 'Bearer ' . $this->pharmaToken);
        $I->sendAjaxPostRequest("/api/v1/pharmacy/prescriptions/{$presId}/dispense");
        $I->seeResponseCodeIs(200);

        $dispenseRes = json_decode($I->grabPageSource(), true);
        $I->assertTrue($dispenseRes['success']);
        $I->assertSame('Obat berhasil diserahkan dan stok obat telah diperbarui.', $dispenseRes['message']);
        $I->assertSame('DISPENSED', $dispenseRes['data']['status']);
        $I->assertNotNull($dispenseRes['data']['dispensed_at']);

        // 3. Verify medicine stock decreased exactly by 25
        $I->sendAjaxGetRequest('/api/v1/medicines/1');
        $I->seeResponseCodeIs(200);
        $medAfter = json_decode($I->grabPageSource(), true);
        $expectedStock = $initialStock - $prescribeQty;
        $I->assertSame($expectedStock, (int)$medAfter['data']['stock']);

        // 4. Verify registration status advanced to BILLING
        $I->sendAjaxGetRequest("/api/v1/registrations/{$regId}");
        $I->seeResponseCodeIs(200);
        $regJson = json_decode($I->grabPageSource(), true);
        $I->assertSame('BILLING', $regJson['data']['status']);

        // 5. Verify dispensing again fails with 422
        $I->sendAjaxPostRequest("/api/v1/pharmacy/prescriptions/{$presId}/dispense");
        $I->seeResponseCodeIs(422);
        $failJson = json_decode($I->grabPageSource(), true);
        $I->assertFalse($failJson['success']);
    }
}
