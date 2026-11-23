<?php

declare(strict_types=1);

namespace app\commands;

use Yii;
use yii\console\Controller;
use yii\console\ExitCode;
use yii\db\Query;
use yii\helpers\Console;

/**
 * SeedController populates the database with essential master data and demo accounts.
 *
 * Usage:
 *   php yii seed
 */
class SeedController extends Controller
{
    /**
     * Executes the comprehensive database seeding process.
     *
     * @return int Exit code
     */
    public function actionIndex(): int
    {
        $this->stdout("Starting database seeding process...\n", Console::BOLD);

        $db = Yii::$app->db;
        $transaction = $db->beginTransaction();

        try {
            // 1. Truncate existing data cleanly with RESTART IDENTITY CASCADE
            $this->stdout("1. Cleaning existing data tables...\n", Console::FG_YELLOW);
            $tables = [
                'billing_payments',
                'billings',
                'lab_order_items',
                'lab_orders',
                'prescription_items',
                'prescriptions',
                'examination_actions',
                'medical_examinations',
                'nurse_assessments',
                'registrations',
                'medicine_stock_logs',
                'medicines',
                'medical_actions',
                'doctor_schedules',
                'polyclinics',
                'patients',
                'doctors',
                'nurses',
                'users',
            ];

            $truncateSql = 'TRUNCATE TABLE ' . implode(', ', array_map(fn($t) => "{{%{$t}}}", $tables)) . ' RESTART IDENTITY CASCADE';
            $db->createCommand($truncateSql)->execute();

            // 2. Seed 7 user accounts with Bcrypt password admin123
            $this->stdout("2. Seeding 7 RBAC user accounts...\n", Console::FG_CYAN);
            $security = Yii::$app->security;
            $passwordHash = $security->generatePasswordHash('admin123');

            $users = [
                [
                    'username' => 'admin',
                    'full_name' => 'Administrator Sistem',
                    'role' => 'admin',
                    'auth_key' => 'auth_key_admin_00000000000000001',
                    'access_token' => 'access_token_admin_00000000000001',
                ],
                [
                    'username' => 'pendaftaran',
                    'full_name' => 'Petugas Pendaftaran',
                    'role' => 'registration',
                    'auth_key' => 'auth_key_reg_00000000000000000002',
                    'access_token' => 'access_token_reg_000000000000002',
                ],
                [
                    'username' => 'perawat',
                    'full_name' => 'Perawat Rawat Jalan',
                    'role' => 'nurse',
                    'auth_key' => 'auth_key_nurse_000000000000000003',
                    'access_token' => 'access_token_nurse_00000000000003',
                ],
                [
                    'username' => 'dokter',
                    'full_name' => 'dr. Budi Santoso, Sp.PD',
                    'role' => 'doctor',
                    'auth_key' => 'auth_key_doctor_00000000000000004',
                    'access_token' => 'access_token_doctor_0000000000004',
                ],
                [
                    'username' => 'apotek',
                    'full_name' => 'Petugas Farmasi',
                    'role' => 'pharmacist',
                    'auth_key' => 'auth_key_pharma_00000000000000005',
                    'access_token' => 'access_token_pharma_0000000000005',
                ],
                [
                    'username' => 'lab',
                    'full_name' => 'Analis Laboratorium',
                    'role' => 'lab',
                    'auth_key' => 'auth_key_lab_00000000000000000006',
                    'access_token' => 'access_token_lab_000000000000006',
                ],
                [
                    'username' => 'kasir',
                    'full_name' => 'Petugas Kasir',
                    'role' => 'cashier',
                    'auth_key' => 'auth_key_cashier_0000000000000007',
                    'access_token' => 'access_token_cashier_000000000007',
                ],
            ];

            foreach ($users as $user) {
                $db->createCommand()->insert('{{%users}}', [
                    'username' => $user['username'],
                    'password_hash' => $passwordHash,
                    'auth_key' => $user['auth_key'],
                    'access_token' => $user['access_token'],
                    'full_name' => $user['full_name'],
                    'role' => $user['role'],
                    'is_active' => true,
                ])->execute();
            }

            $dokterUserId = (int) (new Query())
                ->from('{{%users}}')
                ->where(['username' => 'dokter'])
                ->select('id')
                ->scalar();

            $perawatUserId = (int) (new Query())
                ->from('{{%users}}')
                ->where(['username' => 'perawat'])
                ->select('id')
                ->scalar();

            // 3. Seed linked doctor and nurse profiles
            $this->stdout("3. Seeding linked doctor and nurse profiles...\n", Console::FG_CYAN);
            $db->createCommand()->insert('{{%doctors}}', [
                'user_id' => $dokterUserId,
                'nip' => '198501012010011001',
                'name' => 'dr. Budi Santoso, Sp.PD',
                'specialization' => 'Penyakit Dalam',
                'phone' => '081234567801',
                'sip_number' => 'SIP/2026/001',
            ])->execute();

            $doctorId = (int) (new Query())
                ->from('{{%doctors}}')
                ->where(['user_id' => $dokterUserId])
                ->select('id')
                ->scalar();

            $db->createCommand()->insert('{{%nurses}}', [
                'user_id' => $perawatUserId,
                'nip' => '199002022015022002',
                'name' => 'Perawat Rawat Jalan',
                'phone' => '081234567802',
            ])->execute();

            // 4. Seed master polyclinics
            $this->stdout("4. Seeding master polyclinics...\n", Console::FG_CYAN);
            $polyclinics = [
                [
                    'code' => 'POL-UMUM',
                    'name' => 'Poli Umum',
                    'description' => 'Pelayanan pemeriksaan kesehatan umum dan keluhan dasar pasien',
                ],
                [
                    'code' => 'POL-DALAM',
                    'name' => 'Poli Penyakit Dalam',
                    'description' => 'Pelayanan subspesialis penyakit dalam, diabetes, hipertensi, dan metabolik',
                ],
                [
                    'code' => 'POL-ANAK',
                    'name' => 'Poli Anak',
                    'description' => 'Pelayanan kesehatan anak, tumbuh kembang, dan imunisasi pediatrik',
                ],
            ];

            foreach ($polyclinics as $poli) {
                $db->createCommand()->insert('{{%polyclinics}}', [
                    'code' => $poli['code'],
                    'name' => $poli['name'],
                    'description' => $poli['description'],
                    'is_active' => true,
                ])->execute();
            }

            $poliDalamId = (int) (new Query())
                ->from('{{%polyclinics}}')
                ->where(['code' => 'POL-DALAM'])
                ->select('id')
                ->scalar();

            // 5. Seed doctor schedules (Senin s/d Jumat)
            $this->stdout("5. Seeding doctor schedules...\n", Console::FG_CYAN);
            $scheduledDays = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
            foreach ($scheduledDays as $day) {
                $db->createCommand()->insert('{{%doctor_schedules}}', [
                    'doctor_id' => $doctorId,
                    'polyclinic_id' => $poliDalamId,
                    'day_of_week' => $day,
                    'start_time' => '08:00:00',
                    'end_time' => '12:00:00',
                    'quota' => 30,
                    'is_active' => true,
                ])->execute();
            }

            // 6. Seed 5 master medical actions
            $this->stdout("6. Seeding 5 master medical actions...\n", Console::FG_CYAN);
            $medicalActions = [
                ['ACT-001', 'Konsultasi & Pemeriksaan Dokter Spesialis', 'Konsultasi', 100000.00],
                ['ACT-002', 'Pemeriksaan Elektrokardiografi (EKG)', 'Diagnostik', 125000.00],
                ['ACT-003', 'Pemberian Nebulisasi Inhalasi', 'Tindakan Keperawatan', 75000.00],
                ['ACT-004', 'Perawatan Luka Rawat Jalan (Sedang)', 'Tindakan Keperawatan', 85000.00],
                ['ACT-005', 'Injeksi Intramuskular / Intravena', 'Tindakan Medis', 50000.00],
            ];

            foreach ($medicalActions as [$code, $name, $category, $tariff]) {
                $db->createCommand()->insert('{{%medical_actions}}', [
                    'code' => $code,
                    'name' => $name,
                    'category' => $category,
                    'tariff' => $tariff,
                    'is_active' => true,
                ])->execute();
            }

            // 7. Seed 10 master medicines & initial stock logs
            $this->stdout("7. Seeding 10 master medicines & initial stock logs...\n", Console::FG_CYAN);
            $medicines = [
                ['MED-001', 'Paracetamol 500mg', 'Analgesik & Antipiretik', 'Tablet', 500, 50, 5000.00],
                ['MED-002', 'Amoxicillin 500mg', 'Antibiotik', 'Kapsul', 300, 30, 12000.00],
                ['MED-003', 'Metformin 500mg', 'Antidiabetes Oral', 'Tablet', 400, 40, 8000.00],
                ['MED-004', 'Amlodipine 10mg', 'Antihipertensi', 'Tablet', 350, 35, 10000.00],
                ['MED-005', 'Omeprazole 20mg', 'Antasida & Antiulkus', 'Kapsul', 250, 25, 15000.00],
                ['MED-006', 'Cetirizine 10mg', 'Antihistamin', 'Tablet', 300, 30, 7500.00],
                ['MED-007', 'Ibuprofen 400mg', 'Antiinflamasi Non-Steroid', 'Tablet', 200, 20, 9000.00],
                ['MED-008', 'Ciprofloxacin 500mg', 'Antibiotik', 'Tablet', 150, 15, 18000.00],
                ['MED-009', 'Salbutamol Inhaler 100mcg', 'Bronkodilator', 'Botol', 100, 10, 65000.00],
                ['MED-010', 'Vitamin B Complex', 'Suplemen & Vitamin', 'Tablet', 600, 60, 4000.00],
            ];

            foreach ($medicines as [$code, $name, $category, $unit, $stock, $minStock, $unitPrice]) {
                $db->createCommand()->insert('{{%medicines}}', [
                    'code' => $code,
                    'name' => $name,
                    'category' => $category,
                    'unit' => $unit,
                    'stock' => $stock,
                    'min_stock' => $minStock,
                    'unit_price' => $unitPrice,
                    'is_active' => true,
                ])->execute();

                $medId = (int) (new Query())
                    ->from('{{%medicines}}')
                    ->where(['code' => $code])
                    ->select('id')
                    ->scalar();

                $db->createCommand()->insert('{{%medicine_stock_logs}}', [
                    'medicine_id' => $medId,
                    'transaction_type' => 'IN',
                    'quantity' => $stock,
                    'balance_after' => $stock,
                    'reference_type' => 'INITIAL_SEED',
                    'reference_id' => null,
                    'notes' => 'Stok awal',
                ])->execute();
            }

            // 8. Seed 5 demo patients
            $this->stdout("8. Seeding 5 demo patients...\n", Console::FG_CYAN);
            $patients = [
                [
                    'medical_record_number' => 'RM-202611-00001',
                    'nik' => '3201010101900001',
                    'name' => 'Ahmad Pratama',
                    'birth_date' => '1990-01-01',
                    'gender' => 'L',
                    'address' => 'Jl. Asia Afrika No. 12, Bandung',
                    'phone' => '081234560001',
                    'bpjs_number' => '0001234567891',
                ],
                [
                    'medical_record_number' => 'RM-202611-00002',
                    'nik' => '3201010202850002',
                    'name' => 'Siti Nurhaliza',
                    'birth_date' => '1985-02-02',
                    'gender' => 'P',
                    'address' => 'Jl. Riau No. 45, Bandung',
                    'phone' => '081234560002',
                    'bpjs_number' => '0001234567892',
                ],
                [
                    'medical_record_number' => 'RM-202611-00003',
                    'nik' => '3201010303950003',
                    'name' => 'Bambang Sudarmono',
                    'birth_date' => '1995-03-03',
                    'gender' => 'L',
                    'address' => 'Jl. Dago No. 88, Bandung',
                    'phone' => '081234560003',
                    'bpjs_number' => null,
                ],
                [
                    'medical_record_number' => 'RM-202611-00004',
                    'nik' => '3201010404880004',
                    'name' => 'Dewi Anggraeni',
                    'birth_date' => '1988-04-04',
                    'gender' => 'P',
                    'address' => 'Jl. Buah Batu No. 101, Bandung',
                    'phone' => '081234560004',
                    'bpjs_number' => '0001234567894',
                ],
                [
                    'medical_record_number' => 'RM-202611-00005',
                    'nik' => '3201010505920005',
                    'name' => 'Hendra Setiawan',
                    'birth_date' => '1992-05-05',
                    'gender' => 'L',
                    'address' => 'Jl. Cihampelas No. 23, Bandung',
                    'phone' => '081234560005',
                    'bpjs_number' => null,
                ],
            ];

            foreach ($patients as $patient) {
                $db->createCommand()->insert('{{%patients}}', $patient)->execute();
            }

            $transaction->commit();
            $this->stdout("Database seeding completed successfully!\n", Console::FG_GREEN, Console::BOLD);

            return ExitCode::OK;
        } catch (\Throwable $e) {
            $transaction->rollBack();
            $this->stderr("Database seeding failed: {$e->getMessage()}\n", Console::FG_RED, Console::BOLD);
            $this->stderr($e->getTraceAsString() . "\n");

            return ExitCode::UNSPECIFIED_ERROR;
        }
    }
}
