<?php

declare(strict_types=1);

namespace app\tests\Functional;

use app\tests\Support\FunctionalTester;

/**
 * DoctorExaminationApiCest tests doctor electronic medical record (EHR) examination endpoints.
 */
final class DoctorExaminationApiCest
{
    private string $doctorToken = 'access_token_doctor_0000000000004';
    private string $nurseToken = 'access_token_nurse_00000000000003';

    public function createDoctorExaminationSuccessfullyWithNurseAssessment(FunctionalTester $I): void
    {
        $I->haveHttpHeader('Accept', 'application/json');
        $I->haveHttpHeader('Authorization', 'Bearer ' . $this->doctorToken);

        // 1. Create a registration
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

        // 2. Nurse performs initial assessment
        $I->haveHttpHeader('Authorization', 'Bearer ' . $this->nurseToken);
        $I->sendAjaxPostRequest('/api/v1/nurse-assessments', [
            'registration_id' => $regId,
            'nurse_id' => 1,
            'age_years' => 34,
            'gender' => 'L',
            'weight_kg' => 70.0,
            'height_cm' => 170.0,
            'systolic' => 120,
            'diastolic' => 80,
            'pulse_rate' => 82,
            'body_temp' => 37.0,
            'respiratory_rate' => 18,
            'chief_complaint' => 'Batuk pilek dan radang tenggorokan',
            'allergy_history' => 'Tidak ada alergi',
            'disease_history' => 'Tidak ada',
        ]);
        $I->seeResponseCodeIs(201);

        // 3. Doctor submits examination (SOAP + ICD-10)
        $I->haveHttpHeader('Authorization', 'Bearer ' . $this->doctorToken);
        $I->sendAjaxPostRequest('/api/v1/examinations', [
            'registration_id' => $regId,
            'doctor_id' => 1,
            'physical_exam' => 'Faring hiperemis (+), pembesaran tonsil T1/T1, ronki (-), wheezing (-)',
            'primary_diagnosis_code' => 'J06.9',
            'primary_diagnosis_desc' => 'Infeksi saluran pernapasan akut atas, tidak spesifik (ISPA)',
            'secondary_diagnosis' => 'Faringitis akut',
            'doctor_notes' => 'Edukasi istirahat cukup, hindari makanan berminyak, resep obat simptomatik',
        ]);
        $I->seeResponseCodeIs(201);

        $json = json_decode($I->grabPageSource(), true);
        $I->assertTrue($json['success']);
        $I->assertSame('Pemeriksaan medis RME berhasil disimpan.', $json['message']);
        $I->assertSame('J06.9', $json['data']['primary_diagnosis_code']);
        $I->assertNotEmpty($json['data']['id']);

        // 4. Verify doctor can view examination along with nurse assessment info
        $examId = $json['data']['id'];
        $I->sendAjaxGetRequest("/api/v1/examinations/{$examId}");
        $I->seeResponseCodeIs(200);

        $viewJson = json_decode($I->grabPageSource(), true);
        $I->assertTrue($viewJson['success']);
        $I->assertNotEmpty($viewJson['data']['registration']['nurseAssessment']);
        $I->assertSame(120, (int)$viewJson['data']['registration']['nurseAssessment']['systolic']);
        $I->assertSame('Batuk pilek dan radang tenggorokan', $viewJson['data']['registration']['nurseAssessment']['chief_complaint']);
    }

    public function createDoctorExaminationFailsWithoutPrimaryDiagnosis(FunctionalTester $I): void
    {
        $I->haveHttpHeader('Accept', 'application/json');
        $I->haveHttpHeader('Authorization', 'Bearer ' . $this->doctorToken);

        $I->sendAjaxPostRequest('/api/v1/examinations', [
            'registration_id' => 1,
            'doctor_id' => 1,
            'physical_exam' => 'Pemeriksaan fisik ada tapi tanpa diagnosis ICD-10',
        ]);
        $I->seeResponseCodeIs(422);

        $json = json_decode($I->grabPageSource(), true);
        $I->assertFalse($json['success']);
        $I->assertArrayHasKey('primary_diagnosis_code', $json['errors']);
    }

    public function createCompositeExaminationWithActionsAndPrescriptionAtomically(FunctionalTester $I): void
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

        // 2. Doctor submits complete examination (SOAP + actions + prescription_items) in 1 atomic request
        $I->sendAjaxPostRequest('/api/v1/examinations', [
            'registration_id' => $regId,
            'doctor_id' => 1,
            'physical_exam' => 'Faring hiperemis (+), suhu 38.2 C',
            'primary_diagnosis_code' => 'J06.9',
            'primary_diagnosis_desc' => 'ISPA akut dengan demam',
            'doctor_notes' => 'Istirahat cukup dan minum obat teratur',
            'actions' => [
                ['action_id' => 1, 'notes' => 'Konsultasi dokter umum'],
                ['action_id' => 2, 'notes' => 'Observasi klinis'],
            ],
            'prescription_items' => [
                [
                    'medicine_id' => 1,
                    'quantity' => 6,
                    'dosage' => '500 mg',
                    'frequency' => '3x1 tablet sesudah makan',
                    'instructions' => 'Bila demam',
                ],
            ],
        ]);
        $I->seeResponseCodeIs(201);

        $json = json_decode($I->grabPageSource(), true);
        $I->assertTrue($json['success']);
        $I->assertSame('Pemeriksaan medis RME berhasil disimpan.', $json['message']);
        $I->assertCount(2, $json['data']['actions']);
        $I->assertCount(1, $json['data']['prescriptions']);
        $I->assertSame('PENDING', $json['data']['prescriptions'][0]['status']);
        $I->assertSame(6, (int)$json['data']['prescriptions'][0]['items'][0]['quantity']);
        $I->assertSame('PHARMACY', $json['data']['registration']['status']);

        $billing = $json['data']['registration']['billing'];
        $I->assertGreaterThan(0, (float)$billing['total_actions_fee']);
        $I->assertGreaterThan(0, (float)$billing['total_medicines_fee']);
        $I->assertEquals(
            (float)$billing['total_registration_fee'] + (float)$billing['total_actions_fee'] + (float)$billing['total_medicines_fee'],
            (float)$billing['total_amount']
        );

        // 3. Verify prescription is visible in Pharmacy queue endpoint
        $examId = $json['data']['id'];
        $I->sendAjaxGetRequest("/api/v1/pharmacy/prescriptions?examination_id={$examId}");
        $I->seeResponseCodeIs(200);
        $pharmaJson = json_decode($I->grabPageSource(), true);
        $I->assertTrue($pharmaJson['success']);
        $I->assertCount(1, $pharmaJson['data']);
    }

    public function createCompositeExaminationRollsBackAtomicallyWhenStockInsufficient(FunctionalTester $I): void
    {
        $I->haveHttpHeader('Accept', 'application/json');
        $I->haveHttpHeader('Authorization', 'Bearer ' . $this->doctorToken);

        // 1. Create registration
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

        // 2. Submit composite examination with excessive medicine quantity -> must fail 422 with zero partial writes
        $I->sendAjaxPostRequest('/api/v1/examinations', [
            'registration_id' => $regId,
            'doctor_id' => 1,
            'physical_exam' => 'Demam tinggi',
            'primary_diagnosis_code' => 'R50.9',
            'primary_diagnosis_desc' => 'Demam tidak spesifik',
            'actions' => [
                ['action_id' => 1, 'notes' => 'Konsultasi'],
            ],
            'prescription_items' => [
                [
                    'medicine_id' => 1,
                    'quantity' => 999999,
                    'dosage' => '500 mg',
                    'frequency' => '3x1',
                ],
            ],
        ]);
        $I->seeResponseCodeIs(422);
        $errJson = json_decode($I->grabPageSource(), true);
        $I->assertFalse($errJson['success']);
        $I->assertStringContainsString('tidak mencukupi', $errJson['message']);
        $I->assertArrayHasKey('prescription_items.0.quantity', $errJson['errors']);

        // 3. Verify no examination record was persisted (doctor can cleanly retry)
        $I->sendAjaxGetRequest("/api/v1/examinations?registration_id={$regId}");
        $I->seeResponseCodeIs(200);
        $listJson = json_decode($I->grabPageSource(), true);
        $I->assertEmpty($listJson['data']);

        // 4. Retry with valid quantity succeeds cleanly
        $I->sendAjaxPostRequest('/api/v1/examinations', [
            'registration_id' => $regId,
            'doctor_id' => 1,
            'physical_exam' => 'Demam tinggi',
            'primary_diagnosis_code' => 'R50.9',
            'primary_diagnosis_desc' => 'Demam tidak spesifik',
            'next_status' => 'BILLING',
            'actions' => [
                ['action_id' => 1, 'notes' => 'Konsultasi'],
            ],
        ]);
        $I->seeResponseCodeIs(201);
        $retryJson = json_decode($I->grabPageSource(), true);
        $I->assertTrue($retryJson['success']);
        $I->assertSame('BILLING', $retryJson['data']['registration']['status']);
        $I->assertCount(1, $retryJson['data']['actions']);
        $I->assertEmpty($retryJson['data']['prescriptions']);
    }
}
