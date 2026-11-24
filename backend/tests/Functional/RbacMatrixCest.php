<?php

declare(strict_types=1);

namespace app\tests\Functional;

use app\tests\Support\FunctionalTester;

/**
 * RbacMatrixCest tests 403 Forbidden enforcement on unauthorized roles across API modules.
 */
final class RbacMatrixCest
{
    private string $doctorToken = 'access_token_doctor_0000000000004';
    private string $pharmaToken = 'access_token_pharma_0000000000005';
    private string $nurseToken = 'access_token_nurse_00000000000003';
    private string $cashierToken = 'access_token_cashier_000000000007';

    public function testDoctorCannotProcessCashierPayment(FunctionalTester $I): void
    {
        $I->haveHttpHeader('Accept', 'application/json');
        $I->haveHttpHeader('Authorization', 'Bearer ' . $this->doctorToken);

        $I->sendAjaxPostRequest('/api/v1/billings/1/pay', [
            'payment_method' => 'CASH',
            'amount_received' => 50000,
        ]);
        $I->seeResponseCodeIs(403);
        $res = json_decode($I->grabPageSource(), true);
        $I->assertFalse($res['success']);
    }

    public function testCashierCannotCreateMedicalExamination(FunctionalTester $I): void
    {
        $I->haveHttpHeader('Accept', 'application/json');
        $I->haveHttpHeader('Authorization', 'Bearer ' . $this->cashierToken);

        $I->sendAjaxPostRequest('/api/v1/examinations', [
            'registration_id' => 1,
            'doctor_id' => 1,
            'primary_diagnosis_code' => 'J06.9',
            'primary_diagnosis_desc' => 'ISPA',
        ]);
        $I->seeResponseCodeIs(403);
    }

    public function testCashierCannotDispensePrescription(FunctionalTester $I): void
    {
        $I->haveHttpHeader('Accept', 'application/json');
        $I->haveHttpHeader('Authorization', 'Bearer ' . $this->cashierToken);

        $I->sendAjaxPostRequest('/api/v1/pharmacy/prescriptions/1/dispense');
        $I->seeResponseCodeIs(403);
    }

    public function testNurseCannotDispensePrescription(FunctionalTester $I): void
    {
        $I->haveHttpHeader('Accept', 'application/json');
        $I->haveHttpHeader('Authorization', 'Bearer ' . $this->nurseToken);

        $I->sendAjaxPostRequest('/api/v1/pharmacy/prescriptions/1/dispense');
        $I->seeResponseCodeIs(403);
    }

    public function testDoctorCannotCreateNurseAssessment(FunctionalTester $I): void
    {
        $I->haveHttpHeader('Accept', 'application/json');
        $I->haveHttpHeader('Authorization', 'Bearer ' . $this->doctorToken);

        $I->sendAjaxPostRequest('/api/v1/nurse-assessments', [
            'registration_id' => 1,
            'nurse_id' => 1,
            'weight_kg' => 60,
            'height_cm' => 165,
            'systolic' => 120,
            'diastolic' => 80,
            'pulse_rate' => 80,
            'body_temp' => 36.5,
            'respiratory_rate' => 18,
            'chief_complaint' => 'Keluhan',
        ]);
        $I->seeResponseCodeIs(403);
    }

    public function testNonAdminCannotAccessAuditLogs(FunctionalTester $I): void
    {
        $I->haveHttpHeader('Accept', 'application/json');
        $I->haveHttpHeader('Authorization', 'Bearer ' . $this->doctorToken);

        $I->sendAjaxGetRequest('/api/v1/audit-logs');
        $I->seeResponseCodeIs(403);
    }
}
