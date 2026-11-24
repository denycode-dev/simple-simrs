<?php

declare(strict_types=1);

namespace app\tests\Functional;

use app\tests\Support\FunctionalTester;

/**
 * PatientApiCest verifies REST endpoints for patient master data.
 */
final class PatientApiCest
{
    private string $regToken = 'access_token_reg_000000000000002';

    public function getPatientsListSuccessfully(FunctionalTester $I): void
    {
        $I->haveHttpHeader('Accept', 'application/json');
        $I->haveHttpHeader('Authorization', 'Bearer ' . $this->regToken);
        $I->sendAjaxGetRequest('/api/v1/patients');
        $I->seeResponseCodeIs(200);

        $json = json_decode($I->grabPageSource(), true);
        $I->assertTrue($json['success']);
        $I->assertNotEmpty($json['data']);
    }

    public function createPatientSuccessfullyWithAutoMrn(FunctionalTester $I): void
    {
        $I->haveHttpHeader('Accept', 'application/json');
        $I->haveHttpHeader('Authorization', 'Bearer ' . $this->regToken);
        $I->sendAjaxPostRequest('/api/v1/patients', [
            'nik' => '3201999901010001',
            'name' => 'Pasien Uji Coba',
            'birth_date' => '1998-07-21',
            'gender' => 'L',
            'address' => 'Jl. Pengujian No. 99, Bandung',
            'phone' => '081298765432',
            'bpjs_number' => '0009876543210',
        ]);
        $I->seeResponseCodeIs(201);

        $json = json_decode($I->grabPageSource(), true);
        $I->assertTrue($json['success']);
        $I->assertSame('Data pasien berhasil didaftarkan.', $json['message']);
        $I->assertNotEmpty($json['data']['id']);
        $I->assertMatchesRegularExpression('/^RM-\d{6}-\d{5}$/', $json['data']['medical_record_number']);
        $I->assertSame('Pasien Uji Coba', $json['data']['name']);
        $I->assertSame('3201999901010001', $json['data']['nik']);
    }

    public function createPatientFailsWithInvalidNikLength(FunctionalTester $I): void
    {
        $I->haveHttpHeader('Accept', 'application/json');
        $I->haveHttpHeader('Authorization', 'Bearer ' . $this->regToken);
        $I->sendAjaxPostRequest('/api/v1/patients', [
            'nik' => '12345',
            'name' => 'NIK Pendek',
            'birth_date' => '1995-01-01',
            'gender' => 'L',
            'address' => 'Jl. Salah',
            'phone' => '081200000000',
        ]);
        $I->seeResponseCodeIs(422);

        $json = json_decode($I->grabPageSource(), true);
        $I->assertFalse($json['success']);
        $I->assertArrayHasKey('nik', $json['errors']);
    }

    public function createPatientFailsWithDuplicateNik(FunctionalTester $I): void
    {
        $I->haveHttpHeader('Accept', 'application/json');
        $I->haveHttpHeader('Authorization', 'Bearer ' . $this->regToken);
        $I->sendAjaxPostRequest('/api/v1/patients', [
            'nik' => '3201010101900001', // already seeded Ahmad Pratama
            'name' => 'Ahmad Palsu',
            'birth_date' => '1990-01-01',
            'gender' => 'L',
            'address' => 'Jl. Duplikat',
            'phone' => '081299999999',
        ]);
        $I->seeResponseCodeIs(422);

        $json = json_decode($I->grabPageSource(), true);
        $I->assertFalse($json['success']);
        $I->assertArrayHasKey('nik', $json['errors']);
    }

    public function getPatientDetailSuccessfully(FunctionalTester $I): void
    {
        $I->haveHttpHeader('Accept', 'application/json');
        $I->haveHttpHeader('Authorization', 'Bearer ' . $this->regToken);
        $I->sendAjaxGetRequest('/api/v1/patients/1');
        $I->seeResponseCodeIs(200);

        $json = json_decode($I->grabPageSource(), true);
        $I->assertTrue($json['success']);
        $I->assertSame(1, (int)$json['data']['id']);
        $I->assertSame('Ahmad Pratama', $json['data']['name']);
    }

    public function updatePatientSuccessfully(FunctionalTester $I): void
    {
        $I->haveHttpHeader('Accept', 'application/json');
        $I->haveHttpHeader('Authorization', 'Bearer ' . $this->regToken);
        $I->sendAjaxRequest('PUT', '/api/v1/patients/1', [
            'phone' => '081234567899',
            'address' => 'Jl. Asia Afrika No. 12B, Bandung',
        ]);
        $I->seeResponseCodeIs(200);

        $json = json_decode($I->grabPageSource(), true);
        $I->assertTrue($json['success']);
        $I->assertSame('081234567899', $json['data']['phone']);
    }
}
