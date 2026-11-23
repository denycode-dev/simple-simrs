<?php

declare(strict_types=1);

namespace app\tests\Unit\Models;

use Codeception\Test\Unit;
use Yii;
use yii\db\IntegrityException;

final class TransactionTablesMigrationTest extends Unit
{
    public function testTenTransactionTablesExist(): void
    {
        $schema = Yii::$app->db->getSchema();
        $tables = $schema->getTableNames();

        $expectedTables = [
            'registrations',
            'nurse_assessments',
            'medical_examinations',
            'examination_actions',
            'prescriptions',
            'prescription_items',
            'lab_orders',
            'lab_order_items',
            'billings',
            'billing_payments',
        ];

        foreach ($expectedTables as $table) {
            $this->assertContains($table, $tables, "Transaction table `{$table}` must exist in database.");
        }
    }

    public function testRegistrationsCompositeIndexesExist(): void
    {
        $db = Yii::$app->db;
        $indexes = $db->createCommand("
            SELECT indexname, indexdef
            FROM pg_indexes
            WHERE tablename = 'registrations'
        ")->queryAll();

        $indexNames = array_column($indexes, 'indexname');

        $this->assertContains(
            'idx_registrations_polyclinic_date',
            $indexNames,
            'Composite index `idx_registrations_polyclinic_date` must exist.'
        );
        $this->assertContains(
            'idx_registrations_date_status',
            $indexNames,
            'Composite index `idx_registrations_date_status` must exist.'
        );
        $this->assertContains(
            'idx_registrations_patient_date',
            $indexNames,
            'Composite index `idx_registrations_patient_date` must exist.'
        );
    }

    public function testRegistrationStatusAndInsuranceCheckConstraints(): void
    {
        $table = Yii::$app->db->getSchema()->getTableSchema('registrations');
        $this->assertNotNull($table);

        $db = Yii::$app->db;
        // Verify check constraint violation for invalid registration status
        $transaction = $db->beginTransaction();
        try {
            $db->createCommand()->insert('{{%registrations}}', [
                'registration_number' => 'TEST-REG-INV-01',
                'patient_id' => 999999,
                'polyclinic_id' => 999999,
                'doctor_id' => 999999,
                'insurance_type' => 'GENERAL',
                'queue_number' => 'POL-001',
                'queue_sequence' => 1,
                'status' => 'INVALID_STATUS',
            ])->execute();
            $transaction->commit();
            $this->fail('Expected IntegrityException for invalid status');
        } catch (IntegrityException $e) {
            $transaction->rollBack();
            $this->assertStringContainsString('registrations_status_check', $e->getMessage());
        }

        // Verify check constraint violation for invalid insurance_type
        $transaction = $db->beginTransaction();
        try {
            $db->createCommand()->insert('{{%registrations}}', [
                'registration_number' => 'TEST-REG-INV-02',
                'patient_id' => 999999,
                'polyclinic_id' => 999999,
                'doctor_id' => 999999,
                'insurance_type' => 'INVALID_INSURANCE',
                'queue_number' => 'POL-001',
                'queue_sequence' => 1,
                'status' => 'WAITING_NURSE',
            ])->execute();
            $transaction->commit();
            $this->fail('Expected IntegrityException for invalid insurance_type');
        } catch (IntegrityException $e) {
            $transaction->rollBack();
            $this->assertStringContainsString('registrations_insurance_type_check', $e->getMessage());
        }
    }

    public function testClinicalAndPrescriptionForeignKeys(): void
    {
        $schema = Yii::$app->db->getSchema();

        // 1. nurse_assessments foreign keys
        $nurseAssTable = $schema->getTableSchema('nurse_assessments');
        $this->assertNotNull($nurseAssTable);
        $naFkTargets = array_column($nurseAssTable->foreignKeys, 0);
        $this->assertContains('registrations', $naFkTargets);
        $this->assertContains('nurses', $naFkTargets);

        // 2. medical_examinations foreign keys
        $medExamTable = $schema->getTableSchema('medical_examinations');
        $this->assertNotNull($medExamTable);
        $meFkTargets = array_column($medExamTable->foreignKeys, 0);
        $this->assertContains('registrations', $meFkTargets);
        $this->assertContains('doctors', $meFkTargets);

        // 3. examination_actions foreign keys
        $examActTable = $schema->getTableSchema('examination_actions');
        $this->assertNotNull($examActTable);
        $eaFkTargets = array_column($examActTable->foreignKeys, 0);
        $this->assertContains('medical_examinations', $eaFkTargets);
        $this->assertContains('medical_actions', $eaFkTargets);

        // 4. prescriptions foreign keys
        $prescTable = $schema->getTableSchema('prescriptions');
        $this->assertNotNull($prescTable);
        $prFkTargets = array_column($prescTable->foreignKeys, 0);
        $this->assertContains('medical_examinations', $prFkTargets);
        $this->assertContains('registrations', $prFkTargets);

        // 5. prescription_items foreign keys
        $prescItemTable = $schema->getTableSchema('prescription_items');
        $this->assertNotNull($prescItemTable);
        $piFkTargets = array_column($prescItemTable->foreignKeys, 0);
        $this->assertContains('prescriptions', $piFkTargets);
        $this->assertContains('medicines', $piFkTargets);
    }

    public function testLabAndBillingForeignKeys(): void
    {
        $schema = Yii::$app->db->getSchema();

        // 6. lab_orders foreign keys
        $labOrderTable = $schema->getTableSchema('lab_orders');
        $this->assertNotNull($labOrderTable);
        $loFkTargets = array_column($labOrderTable->foreignKeys, 0);
        $this->assertContains('medical_examinations', $loFkTargets);
        $this->assertContains('registrations', $loFkTargets);

        // 7. lab_order_items foreign keys
        $labItemTable = $schema->getTableSchema('lab_order_items');
        $this->assertNotNull($labItemTable);
        $liFkTargets = array_column($labItemTable->foreignKeys, 0);
        $this->assertContains('lab_orders', $liFkTargets);

        // 8. billings foreign keys
        $billingsTable = $schema->getTableSchema('billings');
        $this->assertNotNull($billingsTable);
        $bFkTargets = array_column($billingsTable->foreignKeys, 0);
        $this->assertContains('registrations', $bFkTargets);

        // 9. billing_payments foreign keys
        $paymentsTable = $schema->getTableSchema('billing_payments');
        $this->assertNotNull($paymentsTable);
        $bpFkTargets = array_column($paymentsTable->foreignKeys, 0);
        $this->assertContains('billings', $bpFkTargets);
        $this->assertContains('users', $bpFkTargets);
    }

    public function testBillingAndPaymentConstraints(): void
    {
        $db = Yii::$app->db;

        // Payment method check constraint
        $transaction = $db->beginTransaction();
        try {
            $db->createCommand()->insert('{{%billing_payments}}', [
                'billing_id' => 999999,
                'payment_number' => 'TEST-PAY-INV-01',
                'payment_method' => 'CRYPTO', // invalid
                'amount' => 50000.00,
                'cashier_id' => 999999,
            ])->execute();
            $transaction->commit();
            $this->fail('Expected IntegrityException for invalid payment method');
        } catch (IntegrityException $e) {
            $transaction->rollBack();
            $this->assertStringContainsString('billing_payments_payment_method_check', $e->getMessage());
        }

        // Negative payment amount check constraint
        $transaction = $db->beginTransaction();
        try {
            $db->createCommand()->insert('{{%billing_payments}}', [
                'billing_id' => 999999,
                'payment_number' => 'TEST-PAY-INV-02',
                'payment_method' => 'CASH',
                'amount' => -100.00, // negative amount
                'cashier_id' => 999999,
            ])->execute();
            $transaction->commit();
            $this->fail('Expected IntegrityException for negative amount');
        } catch (IntegrityException $e) {
            $transaction->rollBack();
            $this->assertStringContainsString('billing_payments_amount_check', $e->getMessage());
        }
    }
}
