<?php

declare(strict_types=1);

namespace app\tests\Unit;

use app\commands\SeedController;
use Codeception\Test\Unit;
use Yii;
use yii\console\ExitCode;
use yii\db\Query;

/**
 * SeedCheckTest verifies that the database seeder (SeedController)
 * accurately seeds all required accounts, master data, stock logs, and demo patients.
 */
final class SeedCheckTest extends Unit
{
    private static bool $seeded = false;

    protected function _before(): void
    {
        parent::_before();
        if (!self::$seeded) {
            $controller = new SeedController('seed', Yii::$app);
            $exitCode = $controller->actionIndex();
            $this->assertSame(ExitCode::OK, $exitCode, 'Seeder must execute cleanly on initial bootstrap.');
            self::$seeded = true;
        }
    }

    /**
     * Test seeder execution and idempotency when run repeatedly.
     */
    public function testSeederExecutionAndIdempotency(): void
    {
        $controller = new SeedController('seed', Yii::$app);
        $exitCode = $controller->actionIndex();
        $this->assertSame(ExitCode::OK, $exitCode, 'SeedController must run idempotently and return ExitCode::OK (0).');

        // Verify count of users is still exactly 7 after re-seeding
        $userCount = (new Query())->from('{{%users}}')->count();
        $this->assertSame(7, (int)$userCount, 'User count must remain exactly 7 after re-seeding.');
    }

    /**
     * Test user accounts count and role distribution.
     */
    public function testUserAccountsCountAndRoles(): void
    {
        $users = (new Query())
            ->from('{{%users}}')
            ->indexBy('username')
            ->all();

        $this->assertCount(7, $users, 'There must be exactly 7 user accounts seeded.');

        $expectedUsers = [
            'admin' => ['role' => 'admin', 'full_name' => 'Administrator Sistem'],
            'pendaftaran' => ['role' => 'registration', 'full_name' => 'Petugas Pendaftaran'],
            'perawat' => ['role' => 'nurse', 'full_name' => 'Perawat Rawat Jalan'],
            'dokter' => ['role' => 'doctor', 'full_name' => 'dr. Budi Santoso, Sp.PD'],
            'apotek' => ['role' => 'pharmacist', 'full_name' => 'Petugas Farmasi'],
            'lab' => ['role' => 'lab', 'full_name' => 'Analis Laboratorium'],
            'kasir' => ['role' => 'cashier', 'full_name' => 'Petugas Kasir'],
        ];

        foreach ($expectedUsers as $username => $expected) {
            $this->assertArrayHasKey($username, $users, "User `{$username}` must exist in `users` table.");
            $this->assertSame($expected['role'], $users[$username]['role'], "User `{$username}` must have role `{$expected['role']}`.");
            $this->assertSame($expected['full_name'], $users[$username]['full_name'], "User `{$username}` full_name mismatch.");
            $this->assertTrue((bool)$users[$username]['is_active'], "User `{$username}` must be active.");
            $this->assertNotEmpty($users[$username]['auth_key'], "User `{$username}` must have a non-empty auth_key.");
            $this->assertNotEmpty($users[$username]['access_token'], "User `{$username}` must have a non-empty access_token.");
        }
    }

    /**
     * Test Bcrypt password validation for all seeded accounts.
     */
    public function testUserPasswordBcryptValidation(): void
    {
        $security = Yii::$app->security;
        $users = (new Query())->from('{{%users}}')->all();

        $this->assertNotEmpty($users, 'Users must be seeded before checking passwords.');

        foreach ($users as $user) {
            $this->assertTrue(
                $security->validatePassword('admin123', $user['password_hash']),
                "User `{$user['username']}` password hash must match 'admin123'."
            );
            $this->assertFalse(
                $security->validatePassword('wrongpassword', $user['password_hash']),
                "User `{$user['username']}` password hash must reject invalid password."
            );
        }
    }

    /**
     * Test linked doctor and nurse profile records.
     */
    public function testLinkedDoctorAndNurseProfiles(): void
    {
        $dokterUser = (new Query())
            ->from('{{%users}}')
            ->where(['username' => 'dokter'])
            ->one();

        $this->assertNotNull($dokterUser, 'User `dokter` must exist.');

        $doctor = (new Query())
            ->from('{{%doctors}}')
            ->where(['user_id' => $dokterUser['id']])
            ->one();

        $this->assertNotNull($doctor, 'Doctor profile linked to user `dokter` must exist.');
        $this->assertNotEmpty($doctor['nip'], 'Doctor NIP must not be empty.');
        $this->assertNotEmpty($doctor['sip_number'], 'Doctor SIP number must not be empty.');
        $this->assertSame('Penyakit Dalam', $doctor['specialization'], 'Doctor specialization must be `Penyakit Dalam`.');
        $this->assertSame('dr. Budi Santoso, Sp.PD', $doctor['name'], 'Doctor name must match dr. Budi Santoso, Sp.PD.');

        $perawatUser = (new Query())
            ->from('{{%users}}')
            ->where(['username' => 'perawat'])
            ->one();

        $this->assertNotNull($perawatUser, 'User `perawat` must exist.');

        $nurse = (new Query())
            ->from('{{%nurses}}')
            ->where(['user_id' => $perawatUser['id']])
            ->one();

        $this->assertNotNull($nurse, 'Nurse profile linked to user `perawat` must exist.');
        $this->assertNotEmpty($nurse['nip'], 'Nurse NIP must not be empty.');
        $this->assertSame('Perawat Rawat Jalan', $nurse['name'], 'Nurse name must match Perawat Rawat Jalan.');
    }

    /**
     * Test master polyclinics count and codes.
     */
    public function testMasterPolyclinics(): void
    {
        $polyclinics = (new Query())
            ->from('{{%polyclinics}}')
            ->indexBy('code')
            ->all();

        $this->assertCount(3, $polyclinics, 'There must be exactly 3 master polyclinics seeded.');

        $expectedPolis = [
            'POL-UMUM' => 'Poli Umum',
            'POL-DALAM' => 'Poli Penyakit Dalam',
            'POL-ANAK' => 'Poli Anak',
        ];

        foreach ($expectedPolis as $code => $name) {
            $this->assertArrayHasKey($code, $polyclinics, "Polyclinic with code `{$code}` must exist.");
            $this->assertSame($name, $polyclinics[$code]['name'], "Polyclinic `{$code}` name mismatch.");
            $this->assertTrue((bool)$polyclinics[$code]['is_active'], "Polyclinic `{$code}` must be active.");
        }
    }

    /**
     * Test doctor schedules seeding.
     */
    public function testDoctorSchedules(): void
    {
        $doctor = (new Query())
            ->from('{{%doctors}}')
            ->where(['name' => 'dr. Budi Santoso, Sp.PD'])
            ->one();

        $this->assertNotNull($doctor, 'Doctor record must exist for schedule verification.');

        $schedules = (new Query())
            ->from('{{%doctor_schedules}}')
            ->where(['doctor_id' => $doctor['id']])
            ->all();

        $this->assertNotEmpty($schedules, 'Doctor schedules must be seeded.');
        $this->assertGreaterThanOrEqual(5, count($schedules), 'Doctor must have at least 5 scheduled days.');

        $validDays = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
        foreach ($schedules as $schedule) {
            $this->assertContains($schedule['day_of_week'], $validDays, "Day of week `{$schedule['day_of_week']}` must be valid.");
            $this->assertSame(30, (int)$schedule['quota'], 'Schedule quota must be 30.');
            $this->assertTrue((bool)$schedule['is_active'], 'Schedule must be active.');
            $this->assertNotEmpty($schedule['start_time'], 'Schedule start time must be non-empty.');
            $this->assertNotEmpty($schedule['end_time'], 'Schedule end time must be non-empty.');
        }
    }

    /**
     * Test master medical actions count and attributes.
     */
    public function testMasterMedicalActions(): void
    {
        $actions = (new Query())
            ->from('{{%medical_actions}}')
            ->indexBy('code')
            ->all();

        $this->assertCount(5, $actions, 'There must be exactly 5 medical actions seeded.');

        for ($i = 1; $i <= 5; $i++) {
            $code = sprintf('ACT-%03d', $i);
            $this->assertArrayHasKey($code, $actions, "Medical action `{$code}` must exist.");
            $this->assertNotEmpty($actions[$code]['name'], "Medical action `{$code}` must have a name.");
            $this->assertNotEmpty($actions[$code]['category'], "Medical action `{$code}` must have a category.");
            $this->assertGreaterThanOrEqual(0, (float)$actions[$code]['tariff'], "Tariff for `{$code}` must be >= 0.");
            $this->assertTrue((bool)$actions[$code]['is_active'], "Medical action `{$code}` must be active.");
        }
    }

    /**
     * Test 10 distinct medicines and their corresponding stock logs.
     */
    public function testMedicinesAndStockLogs(): void
    {
        $medicines = (new Query())
            ->from('{{%medicines}}')
            ->indexBy('code')
            ->all();

        $this->assertCount(10, $medicines, 'There must be exactly 10 medicines seeded.');

        for ($i = 1; $i <= 10; $i++) {
            $code = sprintf('MED-%03d', $i);
            $this->assertArrayHasKey($code, $medicines, "Medicine `{$code}` must exist.");
            $medicine = $medicines[$code];

            $this->assertNotEmpty($medicine['name'], "Medicine `{$code}` must have a name.");
            $this->assertNotEmpty($medicine['category'], "Medicine `{$code}` must have a category.");
            $this->assertNotEmpty($medicine['unit'], "Medicine `{$code}` must have a unit.");
            $this->assertGreaterThan(0, (int)$medicine['stock'], "Medicine `{$code}` stock must be > 0.");
            $this->assertGreaterThanOrEqual(0, (int)$medicine['min_stock'], "Medicine `{$code}` min_stock must be >= 0.");
            $this->assertGreaterThanOrEqual(0, (float)$medicine['unit_price'], "Medicine `{$code}` unit_price must be >= 0.");
            $this->assertTrue((bool)$medicine['is_active'], "Medicine `{$code}` must be active.");

            // Verify stock log
            $log = (new Query())
                ->from('{{%medicine_stock_logs}}')
                ->where(['medicine_id' => $medicine['id']])
                ->one();

            $this->assertNotNull($log, "Stock log must exist for medicine `{$code}`.");
            $this->assertSame('IN', $log['transaction_type'], "Transaction type must be 'IN'.");
            $this->assertSame((int)$medicine['stock'], (int)$log['quantity'], "Log quantity must match medicine initial stock.");
            $this->assertSame((int)$medicine['stock'], (int)$log['balance_after'], "Log balance_after must match medicine initial stock.");
            $this->assertSame('Stok awal', $log['notes'], "Log notes must be 'Stok awal'.");
        }
    }

    /**
     * Test demo patients count, NIK validation, MRN, and attributes.
     */
    public function testDemoPatients(): void
    {
        $patients = (new Query())
            ->from('{{%patients}}')
            ->indexBy('medical_record_number')
            ->all();

        $this->assertCount(5, $patients, 'There must be exactly 5 demo patients seeded.');

        for ($i = 1; $i <= 5; $i++) {
            $mrn = sprintf('RM-202611-%05d', $i);
            $this->assertArrayHasKey($mrn, $patients, "Patient with MRN `{$mrn}` must exist.");
            $patient = $patients[$mrn];

            $this->assertEquals(16, strlen($patient['nik']), "Patient `{$mrn}` NIK must be exactly 16 characters.");
            $this->assertMatchesRegularExpression('/^[0-9]{16}$/', $patient['nik'], "Patient `{$mrn}` NIK must be numeric.");
            $this->assertContains($patient['gender'], ['L', 'P'], "Patient `{$mrn}` gender must be 'L' or 'P'.");
            $this->assertNotEmpty($patient['name'], "Patient `{$mrn}` name must not be empty.");
            $this->assertNotEmpty($patient['birth_date'], "Patient `{$mrn}` birth_date must not be empty.");
            $this->assertNotEmpty($patient['address'], "Patient `{$mrn}` address must not be empty.");
            $this->assertNotEmpty($patient['phone'], "Patient `{$mrn}` phone must not be empty.");
        }
    }
}
