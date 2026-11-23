<?php

declare(strict_types=1);

namespace app\tests\Unit\Models;

use Codeception\Test\Unit;
use Yii;
use yii\db\IntegrityException;

final class MasterTablesMigrationTest extends Unit
{
    private function cleanupTestData(): void
    {
        $db = Yii::$app->db;
        $db->createCommand("DELETE FROM {{%medicine_stock_logs}} WHERE reference_type = 'TEST'")->execute();
        $db->createCommand("DELETE FROM {{%medicines}} WHERE code LIKE 'TEST-MED%'")->execute();
        $db->createCommand("DELETE FROM {{%medical_actions}} WHERE code LIKE 'TEST-ACT%'")->execute();
        $db->createCommand("DELETE FROM {{%doctor_schedules}} WHERE day_of_week = 'Minggu' AND quota = 99")->execute();
        $db->createCommand("DELETE FROM {{%polyclinics}} WHERE code LIKE 'TEST-POL%'")->execute();
        $db->createCommand("DELETE FROM {{%patients}} WHERE medical_record_number LIKE 'TEST-RM%'")->execute();
    }

    protected function _before(): void
    {
        parent::_before();
        $this->cleanupTestData();
    }

    protected function _after(): void
    {
        $this->cleanupTestData();
        parent::_after();
    }

    public function testMasterTablesExist(): void
    {
        $schema = Yii::$app->db->getSchema();
        $tables = $schema->getTableNames();

        $expectedTables = [
            'patients',
            'polyclinics',
            'doctor_schedules',
            'medical_actions',
            'medicines',
            'medicine_stock_logs',
        ];

        foreach ($expectedTables as $table) {
            $this->assertContains($table, $tables, "Master table `{$table}` must exist.");
        }
    }

    public function testPatientsTableStructureAndConstraints(): void
    {
        $table = Yii::$app->db->getSchema()->getTableSchema('patients');
        $this->assertNotNull($table, 'Table `patients` schema must be retrievable.');

        $expectedColumns = [
            'id', 'medical_record_number', 'nik', 'name', 'birth_date',
            'gender', 'address', 'phone', 'bpjs_number', 'created_at', 'updated_at'
        ];

        foreach ($expectedColumns as $col) {
            $this->assertArrayHasKey($col, $table->columns, "Column `{$col}` must exist in `patients`.");
        }

        $this->assertEquals(['id'], $table->primaryKey, 'Primary key of `patients` must be `id`.');
    }

    public function testPatientNik16CharCheckConstraint(): void
    {
        $db = Yii::$app->db;

        // Valid 16-digit NIK succeeds
        $inserted = $db->createCommand()->insert('{{%patients}}', [
            'medical_record_number' => 'TEST-RM-00001',
            'nik' => '3201011234560001', // 16 characters
            'name' => 'Pasien Uji Valid',
            'birth_date' => '1990-01-01',
            'gender' => 'L',
            'address' => 'Jl. Test No. 1',
            'phone' => '081234567890',
        ])->execute();
        $this->assertEquals(1, $inserted);

        // Invalid NIK length (< 16 chars) must fail check constraint
        $transaction = $db->beginTransaction();
        try {
            $db->createCommand()->insert('{{%patients}}', [
                'medical_record_number' => 'TEST-RM-00002',
                'nik' => '320101123456', // only 12 characters
                'name' => 'Pasien Uji Invalid NIK',
                'birth_date' => '1990-01-01',
                'gender' => 'L',
                'address' => 'Jl. Test No. 2',
                'phone' => '081234567891',
            ])->execute();
            $transaction->commit();
            $this->fail('Expected IntegrityException for NIK length != 16');
        } catch (IntegrityException $e) {
            $transaction->rollBack();
            $this->assertStringContainsString('patients_nik_check', $e->getMessage());
        }
    }

    public function testPatientGenderCheckConstraint(): void
    {
        $db = Yii::$app->db;
        $transaction = $db->beginTransaction();
        try {
            $db->createCommand()->insert('{{%patients}}', [
                'medical_record_number' => 'TEST-RM-00003',
                'nik' => '3201011234560003',
                'name' => 'Pasien Uji Invalid Gender',
                'birth_date' => '1990-01-01',
                'gender' => 'X', // Invalid gender
                'address' => 'Jl. Test No. 3',
                'phone' => '081234567892',
            ])->execute();
            $transaction->commit();
            $this->fail('Expected IntegrityException for invalid gender');
        } catch (IntegrityException $e) {
            $transaction->rollBack();
            $this->assertStringContainsString('patients_gender_check', $e->getMessage());
        }
    }

    public function testPolyclinicsUniqueCode(): void
    {
        $db = Yii::$app->db;
        $db->createCommand()->insert('{{%polyclinics}}', [
            'code' => 'TEST-POL-01',
            'name' => 'Poli Uji 1',
        ])->execute();

        $transaction = $db->beginTransaction();
        try {
            $db->createCommand()->insert('{{%polyclinics}}', [
                'code' => 'TEST-POL-01', // duplicate code
                'name' => 'Poli Uji Duplicate',
            ])->execute();
            $transaction->commit();
            $this->fail('Expected IntegrityException for duplicate polyclinic code');
        } catch (IntegrityException $e) {
            $transaction->rollBack();
            $this->assertTrue(true);
        }
    }

    public function testDoctorSchedulesForeignKeysAndChecks(): void
    {
        $table = Yii::$app->db->getSchema()->getTableSchema('doctor_schedules');
        $this->assertNotNull($table);

        $hasDoctorFk = false;
        $hasPoliFk = false;
        foreach ($table->foreignKeys as $fk) {
            if ($fk[0] === 'doctors') {
                $hasDoctorFk = true;
            }
            if ($fk[0] === 'polyclinics') {
                $hasPoliFk = true;
            }
        }
        $this->assertTrue($hasDoctorFk, 'doctor_schedules must have FK to doctors.');
        $this->assertTrue($hasPoliFk, 'doctor_schedules must have FK to polyclinics.');
    }

    public function testMedicinesCheckConstraints(): void
    {
        $db = Yii::$app->db;

        // Valid medicine
        $inserted = $db->createCommand()->insert('{{%medicines}}', [
            'code' => 'TEST-MED-01',
            'name' => 'Obat Test Valid',
            'category' => 'Analgesik',
            'unit' => 'Tablet',
            'stock' => 100,
            'min_stock' => 10,
            'unit_price' => 1500.00,
        ])->execute();
        $this->assertEquals(1, $inserted);

        // Negative stock must fail
        $transaction = $db->beginTransaction();
        try {
            $db->createCommand()->insert('{{%medicines}}', [
                'code' => 'TEST-MED-02',
                'name' => 'Obat Test Negative Stock',
                'category' => 'Analgesik',
                'unit' => 'Tablet',
                'stock' => -5,
                'min_stock' => 10,
                'unit_price' => 1500.00,
            ])->execute();
            $transaction->commit();
            $this->fail('Expected IntegrityException for negative stock');
        } catch (IntegrityException $e) {
            $transaction->rollBack();
            $this->assertStringContainsString('medicines_stock_check', $e->getMessage());
        }
    }

    public function testMedicineStockLogsStructureAndConstraints(): void
    {
        $table = Yii::$app->db->getSchema()->getTableSchema('medicine_stock_logs');
        $this->assertNotNull($table);

        $expectedColumns = [
            'id', 'medicine_id', 'transaction_type', 'quantity',
            'balance_after', 'reference_type', 'reference_id', 'notes', 'created_at'
        ];
        foreach ($expectedColumns as $col) {
            $this->assertArrayHasKey($col, $table->columns);
        }

        $hasMedFk = false;
        foreach ($table->foreignKeys as $fk) {
            if ($fk[0] === 'medicines') {
                $hasMedFk = true;
            }
        }
        $this->assertTrue($hasMedFk, 'medicine_stock_logs must have FK to medicines.');
    }
}
