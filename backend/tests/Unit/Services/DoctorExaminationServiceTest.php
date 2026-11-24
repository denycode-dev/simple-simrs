<?php

declare(strict_types=1);

namespace app\tests\Unit\Services;

use Codeception\Test\Unit;
use app\models\Billing;
use app\models\ExaminationAction;
use app\models\MedicalAction;
use app\models\MedicalExamination;
use app\models\Medicine;
use app\models\Prescription;
use app\models\Registration;
use app\services\DoctorExaminationService;

/**
 * Unit tests for DoctorExaminationService covering atomic creation, validation,
 * aggregated stock checking, tariff/price locking, status transitions, and rollback safety.
 */
final class DoctorExaminationServiceTest extends Unit
{
    /** @var int[] */
    private array $createdRegistrationIds = [];

    protected function _after(): void
    {
        foreach ($this->createdRegistrationIds as $regId) {
            $reg = Registration::findOne($regId);
            if ($reg !== null) {
                $reg->delete();
            }
        }
        $this->createdRegistrationIds = [];
    }

    private function createTestRegistration(string $insuranceType = 'GENERAL'): Registration
    {
        $reg = new Registration();
        $reg->patient_id = 1;
        $reg->polyclinic_id = 1;
        $reg->doctor_id = 1;
        $reg->schedule_id = 1;
        $reg->insurance_type = $insuranceType;
        $reg->status = 'WAITING_DOCTOR';
        $this->assertTrue($reg->save(), 'Failed creating test registration: ' . json_encode($reg->errors));
        $this->createdRegistrationIds[] = (int)$reg->id;
        return $reg;
    }

    public function testCreateBasicExaminationOnlyIsBackwardCompatible(): void
    {
        $reg = $this->createTestRegistration();
        $service = new DoctorExaminationService();

        $result = $service->create([
            'registration_id' => $reg->id,
            'doctor_id' => 1,
            'physical_exam' => 'DBN',
            'primary_diagnosis_code' => 'J06.9',
            'primary_diagnosis_desc' => 'ISPA akut',
        ]);

        $this->assertTrue($result['success']);
        $this->assertSame(201, $result['statusCode']);
        $this->assertNotNull($result['examination']);
        $this->assertEmpty($result['examination']->actions);
        $this->assertEmpty($result['examination']->prescriptions);

        $reg->refresh();
        $this->assertSame('IN_DOCTOR', $reg->status);
    }

    public function testCreateCompositeExaminationWithActionsAndPrescriptionAtomically(): void
    {
        $reg = $this->createTestRegistration('GENERAL');
        $action1 = MedicalAction::findOne(1);
        $action2 = MedicalAction::findOne(2);
        $medicine = Medicine::findOne(1);

        $this->assertNotNull($action1);
        $this->assertNotNull($action2);
        $this->assertNotNull($medicine);
        $this->assertGreaterThanOrEqual(5, (int)$medicine->stock);

        $service = new DoctorExaminationService();
        $result = $service->create([
            'registration_id' => $reg->id,
            'doctor_id' => 1,
            'physical_exam' => 'Faring hiperemis (+)',
            'primary_diagnosis_code' => 'J02.9',
            'primary_diagnosis_desc' => 'Faringitis akut',
            'doctor_notes' => 'Perbanyak minum air hangat',
            'actions' => [
                ['action_id' => $action1->id, 'notes' => 'Konsultasi umum', 'tariff' => 1],
                ['action_id' => $action2->id, 'notes' => 'Tindakan tambahan'],
            ],
            'prescription_items' => [
                [
                    'medicine_id' => $medicine->id,
                    'quantity' => 5,
                    'dosage' => '500 mg',
                    'frequency' => '3x1 sesudah makan',
                    'instructions' => 'Habiskan',
                    'unit_price' => 1, // Must be ignored; master price must be locked
                ],
            ],
        ]);

        $this->assertTrue($result['success'], 'Expected success, got errors: ' . json_encode($result['errors']));
        $this->assertSame(201, $result['statusCode']);

        $exam = $result['examination'];
        $this->assertNotNull($exam);
        $this->assertCount(2, $exam->actions);
        $this->assertCount(1, $exam->prescriptions);

        // Verify server-side locked tariff and unit price
        $this->assertEquals((float)$action1->tariff, (float)$exam->actions[0]->tariff);
        $this->assertEquals((float)$action2->tariff, (float)$exam->actions[1]->tariff);

        $prescription = $exam->prescriptions[0];
        $this->assertSame('PENDING', $prescription->status);
        $this->assertMatchesRegularExpression('/^RX-\d{8}-\d{4}$/', $prescription->prescription_number);
        $this->assertCount(1, $prescription->items);
        $this->assertEquals((float)$medicine->unit_price, (float)$prescription->items[0]->unit_price);
        $this->assertEquals((float)$medicine->unit_price * 5, (float)$prescription->items[0]->subtotal);

        // Verify registration status auto-advanced to PHARMACY
        $reg->refresh();
        $this->assertSame('PHARMACY', $reg->status);

        // Verify single-pass billing recalculation
        $billing = Billing::findOne(['registration_id' => $reg->id]);
        $this->assertNotNull($billing);
        $expectedActionsFee = (float)$action1->tariff + (float)$action2->tariff;
        $expectedMedicinesFee = (float)$medicine->unit_price * 5;
        $this->assertEquals($expectedActionsFee, (float)$billing->total_actions_fee);
        $this->assertEquals($expectedMedicinesFee, (float)$billing->total_medicines_fee);
        $this->assertEquals(
            (float)$billing->total_registration_fee + $expectedActionsFee + $expectedMedicinesFee,
            (float)$billing->total_amount
        );
    }

    public function testCreateExaminationWithActionsDirectlyToBilling(): void
    {
        $reg = $this->createTestRegistration('GENERAL');
        $service = new DoctorExaminationService();

        $result = $service->create([
            'registration_id' => $reg->id,
            'doctor_id' => 1,
            'physical_exam' => 'Kontrol rutin normal',
            'primary_diagnosis_code' => 'Z00.0',
            'primary_diagnosis_desc' => 'General medical examination',
            'next_status' => 'BILLING',
            'actions' => [
                ['action_id' => 1, 'notes' => 'Konsultasi kontrol'],
            ],
        ]);

        $this->assertTrue($result['success']);
        $this->assertSame(201, $result['statusCode']);

        $reg->refresh();
        $this->assertSame('BILLING', $reg->status);
        $this->assertSame(0, (int)Prescription::find()->where(['registration_id' => $reg->id])->count());
    }

    public function testCreateRejectsAggregatedInsufficientMedicineStockWithoutPartialWrite(): void
    {
        $reg = $this->createTestRegistration();
        $medicine = Medicine::findOne(1);
        $this->assertNotNull($medicine);

        $halfPlusOne = (int)floor(((int)$medicine->stock) / 2) + 1;
        $service = new DoctorExaminationService();

        $result = $service->create([
            'registration_id' => $reg->id,
            'doctor_id' => 1,
            'physical_exam' => 'Demam',
            'primary_diagnosis_code' => 'R50.9',
            'primary_diagnosis_desc' => 'Demam tidak spesifik',
            'actions' => [
                ['action_id' => 1, 'notes' => 'Konsultasi'],
            ],
            'prescription_items' => [
                ['medicine_id' => $medicine->id, 'quantity' => $halfPlusOne],
                ['medicine_id' => $medicine->id, 'quantity' => $halfPlusOne],
            ],
        ]);

        $this->assertFalse($result['success']);
        $this->assertSame(422, $result['statusCode']);
        $this->assertStringContainsString('tidak mencukupi', $result['message']);
        $this->assertIsArray($result['errors']);
        $this->assertArrayHasKey('prescription_items.0.quantity', $result['errors']);
        $this->assertArrayHasKey('prescription_items.1.quantity', $result['errors']);

        // Ensure zero partial records were persisted
        $this->assertNull(MedicalExamination::findOne(['registration_id' => $reg->id]));
        $this->assertSame(0, (int)Prescription::find()->where(['registration_id' => $reg->id])->count());
        $reg->refresh();
        $this->assertSame('WAITING_DOCTOR', $reg->status);
    }

    public function testCreateRejectsInvalidActionAndConflictingOrDisallowedNextStatus(): void
    {
        $reg = $this->createTestRegistration();
        $service = new DoctorExaminationService();

        // Case 1: invalid action_id + BILLING next_status with prescription_items
        $result1 = $service->create([
            'registration_id' => $reg->id,
            'doctor_id' => 1,
            'primary_diagnosis_code' => 'I10',
            'primary_diagnosis_desc' => 'Essential hypertension',
            'next_status' => 'BILLING',
            'actions' => [
                ['action_id' => 999999],
            ],
            'prescription_items' => [
                ['medicine_id' => 1, 'quantity' => 1],
            ],
        ]);

        $this->assertFalse($result1['success']);
        $this->assertSame(422, $result1['statusCode']);
        $this->assertIsArray($result1['errors']);
        $this->assertArrayHasKey('actions.0.action_id', $result1['errors']);
        $this->assertArrayHasKey('next_status', $result1['errors']);
        $this->assertNull(MedicalExamination::findOne(['registration_id' => $reg->id]));

        // Case 2: disallowed status COMPLETED
        $result2 = $service->create([
            'registration_id' => $reg->id,
            'doctor_id' => 1,
            'primary_diagnosis_code' => 'I10',
            'primary_diagnosis_desc' => 'Essential hypertension',
            'next_status' => 'COMPLETED',
        ]);

        $this->assertFalse($result2['success']);
        $this->assertSame(422, $result2['statusCode']);
        $this->assertIsArray($result2['errors']);
        $this->assertArrayHasKey('next_status', $result2['errors']);
        $this->assertNull(MedicalExamination::findOne(['registration_id' => $reg->id]));
        $this->assertSame(0, (int)ExaminationAction::find()->joinWith('examination')->where(['medical_examinations.registration_id' => $reg->id])->count());
    }
}
