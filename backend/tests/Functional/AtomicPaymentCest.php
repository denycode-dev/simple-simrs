<?php

declare(strict_types=1);

namespace app\tests\Functional;

use app\tests\Support\FunctionalTester;

/**
 * AtomicPaymentCest tests cashier payment processing: Cash Full Payment, BPJS Coverage, and Race Condition Prevention.
 */
final class AtomicPaymentCest
{
    private string $cashierToken = 'access_token_cashier_000000000007';
    private string $doctorToken = 'access_token_doctor_0000000000004';

    public function testCashFullPaymentCalculatesChangeAndCompletesRegistration(FunctionalTester $I): void
    {
        // 1. Setup registration, examination, action for General patient
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
            'physical_exam' => 'Gigi berlubang',
            'primary_diagnosis_code' => 'K02.9',
            'primary_diagnosis_desc' => 'Karies gigi',
        ]);
        $I->seeResponseCodeIs(201);
        $exam = json_decode($I->grabPageSource(), true);
        $examId = $exam['data']['id'];

        $I->sendAjaxPostRequest("/api/v1/examinations/{$examId}/actions", [
            'action_id' => 1,
        ]);
        $I->seeResponseCodeIs(201);

        // 2. Cashier checks billing
        $I->haveHttpHeader('Authorization', 'Bearer ' . $this->cashierToken);
        $I->sendAjaxGetRequest("/api/v1/billings?registration_id={$regId}");
        $I->seeResponseCodeIs(200);
        $billings = json_decode($I->grabPageSource(), true);
        $billing = $billings['data'][0];
        $billingId = $billing['id'];
        $payable = (float)$billing['patient_payable'];
        $I->assertGreaterThan(0, $payable);

        // 3. Test pay with insufficient cash fails
        $I->sendAjaxPostRequest("/api/v1/billings/{$billingId}/pay", [
            'payment_method' => 'CASH',
            'amount_received' => $payable - 5000,
        ]);
        $I->seeResponseCodeIs(422);
        $insufficientRes = json_decode($I->grabPageSource(), true);
        $I->assertFalse($insufficientRes['success']);

        // 4. Pay with exact or more cash (e.g. payable + 50,000)
        $received = $payable + 50000.00;
        $I->sendAjaxPostRequest("/api/v1/billings/{$billingId}/pay", [
            'payment_method' => 'CASH',
            'amount_received' => $received,
            'notes' => 'Pembayaran tunai kasir',
        ]);
        $I->seeResponseCodeIs(200);

        $payRes = json_decode($I->grabPageSource(), true);
        $I->assertTrue($payRes['success']);
        $I->assertSame('Pembayaran tagihan berhasil diproses.', $payRes['message']);
        $paymentData = $payRes['data']['payment'];
        $I->assertMatchesRegularExpression('/^PAY-\d{8}-\d{4}$/', $paymentData['payment_number']);
        $I->assertEquals($payable, (float)$paymentData['amount']);
        $I->assertEquals($received, (float)$paymentData['amount_received']);
        $I->assertEquals(50000.00, (float)$paymentData['change_amount']);

        // 5. Verify billing is PAID and registration status is COMPLETED
        $I->assertSame('PAID', $payRes['data']['billing']['payment_status']);

        $I->sendAjaxGetRequest("/api/v1/registrations/{$regId}");
        $I->seeResponseCodeIs(200);
        $regAfter = json_decode($I->grabPageSource(), true);
        $I->assertSame('COMPLETED', $regAfter['data']['status']);

        // 6. Test duplicate payment fails
        $I->sendAjaxPostRequest("/api/v1/billings/{$billingId}/pay", [
            'payment_method' => 'CASH',
            'amount_received' => $received,
        ]);
        $I->seeResponseCodeIs(422);
        $dupRes = json_decode($I->grabPageSource(), true);
        $I->assertFalse($dupRes['success']);
        $I->assertStringContainsString('lunas', $dupRes['message']);
    }

    public function testBpjsPaymentSettlesZeroFeeAndCompletesRegistration(FunctionalTester $I): void
    {
        // 1. Setup registration for BPJS patient
        $I->haveHttpHeader('Accept', 'application/json');
        $I->haveHttpHeader('Authorization', 'Bearer ' . $this->doctorToken);

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

        // 2. Cashier processes BPJS settlement
        $I->haveHttpHeader('Authorization', 'Bearer ' . $this->cashierToken);
        $I->sendAjaxGetRequest("/api/v1/billings?registration_id={$regId}");
        $I->seeResponseCodeIs(200);
        $billings = json_decode($I->grabPageSource(), true);
        $billingId = $billings['data'][0]['id'];

        $I->sendAjaxPostRequest("/api/v1/billings/{$billingId}/pay", [
            'payment_method' => 'BPJS',
            'notes' => 'Klaim BPJS Kesehatan Rawat Jalan',
        ]);
        $I->seeResponseCodeIs(200);

        $res = json_decode($I->grabPageSource(), true);
        $I->assertTrue($res['success']);
        $I->assertSame('PAID', $res['data']['billing']['payment_status']);
        $I->assertEquals(0.00, (float)$res['data']['payment']['amount']);
        $I->assertEquals(0.00, (float)$res['data']['payment']['change_amount']);

        // Verify registration status is COMPLETED
        $I->sendAjaxGetRequest("/api/v1/registrations/{$regId}");
        $I->seeResponseCodeIs(200);
        $regAfter = json_decode($I->grabPageSource(), true);
        $I->assertSame('COMPLETED', $regAfter['data']['status']);
    }
}
