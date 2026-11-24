<?php

declare(strict_types=1);

namespace app\tests\Functional;

use app\tests\Support\FunctionalTester;

/**
 * RegistrationApiCest tests registration endpoints, queue sequence, and insurance options.
 */
final class RegistrationApiCest
{
    private string $regToken = 'access_token_reg_000000000000002';

    public function createRegistrationSuccessfullyGeneral(FunctionalTester $I): void
    {
        $I->haveHttpHeader('Accept', 'application/json');
        $I->haveHttpHeader('Authorization', 'Bearer ' . $this->regToken);
        $I->sendAjaxPostRequest('/api/v1/registrations', [
            'patient_id' => 1,
            'polyclinic_id' => 1,
            'doctor_id' => 1,
            'schedule_id' => 1,
            'insurance_type' => 'GENERAL',
        ]);
        $I->seeResponseCodeIs(201);

        $json = json_decode($I->grabPageSource(), true);
        $I->assertTrue($json['success']);
        $I->assertSame('Pendaftaran kunjungan berhasil dibuat.', $json['message']);
        $I->assertNotEmpty($json['data']['id']);
        $I->assertMatchesRegularExpression('/^REG-\d{8}-\d{4}$/', $json['data']['registration_number']);
        $I->assertSame('WAITING_NURSE', $json['data']['status']);
        $I->assertGreaterThanOrEqual(1, (int)$json['data']['queue_sequence']);
        $I->assertNotEmpty($json['data']['queue_number']);
    }

    public function createRegistrationSuccessfullyBpjs(FunctionalTester $I): void
    {
        $I->haveHttpHeader('Accept', 'application/json');
        $I->haveHttpHeader('Authorization', 'Bearer ' . $this->regToken);
        $I->sendAjaxPostRequest('/api/v1/registrations', [
            'patient_id' => 2,
            'polyclinic_id' => 1,
            'doctor_id' => 1,
            'schedule_id' => 1,
            'insurance_type' => 'BPJS',
        ]);
        $I->seeResponseCodeIs(201);

        $json = json_decode($I->grabPageSource(), true);
        $I->assertTrue($json['success']);
        $I->assertSame('BPJS', $json['data']['insurance_type']);
        $I->assertGreaterThanOrEqual(1, (int)$json['data']['queue_sequence']);
    }

    public function createRegistrationFailsWithInvalidInsurance(FunctionalTester $I): void
    {
        $I->haveHttpHeader('Accept', 'application/json');
        $I->haveHttpHeader('Authorization', 'Bearer ' . $this->regToken);
        $I->sendAjaxPostRequest('/api/v1/registrations', [
            'patient_id' => 1,
            'polyclinic_id' => 1,
            'doctor_id' => 1,
            'schedule_id' => 1,
            'insurance_type' => 'INVALID_INSURANCE',
        ]);
        $I->seeResponseCodeIs(422);

        $json = json_decode($I->grabPageSource(), true);
        $I->assertFalse($json['success']);
        $I->assertArrayHasKey('insurance_type', $json['errors']);
    }

    public function getRegistrationsList(FunctionalTester $I): void
    {
        $I->haveHttpHeader('Accept', 'application/json');
        $I->haveHttpHeader('Authorization', 'Bearer ' . $this->regToken);
        
        // Ensure at least one registration exists in this test transaction
        $I->sendAjaxPostRequest('/api/v1/registrations', [
            'patient_id' => 3,
            'polyclinic_id' => 1,
            'doctor_id' => 1,
            'schedule_id' => 1,
            'insurance_type' => 'GENERAL',
        ]);
        $I->seeResponseCodeIs(201);

        $I->sendAjaxGetRequest('/api/v1/registrations');
        $I->seeResponseCodeIs(200);

        $json = json_decode($I->grabPageSource(), true);
        $I->assertTrue($json['success']);
        $I->assertNotEmpty($json['data']);
    }
}
