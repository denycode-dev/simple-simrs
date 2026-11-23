<?php

declare(strict_types=1);

use yii\db\Migration;

/**
 * Handles the creation of master tables: `patients`, `polyclinics`, `doctor_schedules`,
 * `medical_actions`, `medicines`, and `medicine_stock_logs`.
 */
class m261123_000002_create_master_tables extends Migration
{
    /**
     * {@inheritdoc}
     */
    public function safeUp(): void
    {
        // 1. Table patients
        $this->createTable('{{%patients}}', [
            'id' => $this->primaryKey(),
            'medical_record_number' => $this->string(20)->notNull()->unique(),
            'nik' => $this->string(16)->notNull()->unique(),
            'name' => $this->string(100)->notNull(),
            'birth_date' => $this->date()->notNull(),
            'gender' => $this->string(1)->notNull(),
            'address' => $this->text()->notNull(),
            'phone' => $this->string(20)->notNull(),
            'bpjs_number' => $this->string(20)->null(),
            'created_at' => $this->timestamp()->notNull()->defaultExpression('CURRENT_TIMESTAMP'),
            'updated_at' => $this->timestamp()->notNull()->defaultExpression('CURRENT_TIMESTAMP'),
        ]);

        $this->execute("ALTER TABLE {{%patients}} ADD CONSTRAINT patients_nik_check CHECK (length(nik) = 16)");
        $this->execute("ALTER TABLE {{%patients}} ADD CONSTRAINT patients_gender_check CHECK (gender IN ('L', 'P'))");
        $this->createIndex('idx_patients_name', '{{%patients}}', 'name');

        // 2. Table polyclinics
        $this->createTable('{{%polyclinics}}', [
            'id' => $this->primaryKey(),
            'code' => $this->string(20)->notNull()->unique(),
            'name' => $this->string(100)->notNull(),
            'description' => $this->text()->null(),
            'is_active' => $this->boolean()->notNull()->defaultValue(true),
            'created_at' => $this->timestamp()->notNull()->defaultExpression('CURRENT_TIMESTAMP'),
        ]);

        // 3. Table doctor_schedules
        $this->createTable('{{%doctor_schedules}}', [
            'id' => $this->primaryKey(),
            'doctor_id' => $this->integer()->notNull(),
            'polyclinic_id' => $this->integer()->notNull(),
            'day_of_week' => $this->string(10)->notNull(),
            'start_time' => $this->time()->notNull(),
            'end_time' => $this->time()->notNull(),
            'quota' => $this->integer()->notNull()->defaultValue(30),
            'is_active' => $this->boolean()->notNull()->defaultValue(true),
        ]);

        $this->addForeignKey(
            'fk_doctor_schedules_doctor',
            '{{%doctor_schedules}}',
            'doctor_id',
            '{{%doctors}}',
            'id',
            'CASCADE',
            'CASCADE'
        );
        $this->addForeignKey(
            'fk_doctor_schedules_polyclinic',
            '{{%doctor_schedules}}',
            'polyclinic_id',
            '{{%polyclinics}}',
            'id',
            'CASCADE',
            'CASCADE'
        );

        $this->execute("ALTER TABLE {{%doctor_schedules}} ADD CONSTRAINT doctor_schedules_day_of_week_check CHECK (day_of_week IN ('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'))");
        $this->execute("ALTER TABLE {{%doctor_schedules}} ADD CONSTRAINT doctor_schedules_quota_check CHECK (quota > 0)");

        $this->createIndex('idx_doctor_schedules_doctor_day', '{{%doctor_schedules}}', ['doctor_id', 'day_of_week']);
        $this->createIndex('idx_doctor_schedules_polyclinic_day', '{{%doctor_schedules}}', ['polyclinic_id', 'day_of_week']);

        // 4. Table medical_actions
        $this->createTable('{{%medical_actions}}', [
            'id' => $this->primaryKey(),
            'code' => $this->string(20)->notNull()->unique(),
            'name' => $this->string(100)->notNull(),
            'category' => $this->string(50)->notNull(),
            'tariff' => $this->decimal(12, 2)->notNull(),
            'is_active' => $this->boolean()->notNull()->defaultValue(true),
        ]);

        $this->execute("ALTER TABLE {{%medical_actions}} ADD CONSTRAINT medical_actions_tariff_check CHECK (tariff >= 0)");
        $this->createIndex('idx_medical_actions_category', '{{%medical_actions}}', 'category');

        // 5. Table medicines
        $this->createTable('{{%medicines}}', [
            'id' => $this->primaryKey(),
            'code' => $this->string(20)->notNull()->unique(),
            'name' => $this->string(100)->notNull(),
            'category' => $this->string(50)->notNull(),
            'unit' => $this->string(20)->notNull(),
            'stock' => $this->integer()->notNull()->defaultValue(0),
            'min_stock' => $this->integer()->notNull()->defaultValue(0),
            'unit_price' => $this->decimal(12, 2)->notNull(),
            'is_active' => $this->boolean()->notNull()->defaultValue(true),
        ]);

        $this->execute("ALTER TABLE {{%medicines}} ADD CONSTRAINT medicines_stock_check CHECK (stock >= 0)");
        $this->execute("ALTER TABLE {{%medicines}} ADD CONSTRAINT medicines_min_stock_check CHECK (min_stock >= 0)");
        $this->execute("ALTER TABLE {{%medicines}} ADD CONSTRAINT medicines_unit_price_check CHECK (unit_price >= 0)");
        $this->createIndex('idx_medicines_name', '{{%medicines}}', 'name');

        // 6. Table medicine_stock_logs
        $this->createTable('{{%medicine_stock_logs}}', [
            'id' => $this->bigPrimaryKey(),
            'medicine_id' => $this->integer()->notNull(),
            'transaction_type' => $this->string(20)->notNull(),
            'quantity' => $this->integer()->notNull(),
            'balance_after' => $this->integer()->notNull(),
            'reference_type' => $this->string(50)->null(),
            'reference_id' => $this->integer()->null(),
            'notes' => $this->text()->null(),
            'created_at' => $this->timestamp()->notNull()->defaultExpression('CURRENT_TIMESTAMP'),
        ]);

        $this->addForeignKey(
            'fk_stock_logs_medicine',
            '{{%medicine_stock_logs}}',
            'medicine_id',
            '{{%medicines}}',
            'id',
            'RESTRICT',
            'CASCADE'
        );

        $this->execute("ALTER TABLE {{%medicine_stock_logs}} ADD CONSTRAINT stock_logs_transaction_type_check CHECK (transaction_type IN ('IN', 'OUT', 'ADJUSTMENT'))");
        $this->execute("ALTER TABLE {{%medicine_stock_logs}} ADD CONSTRAINT stock_logs_quantity_check CHECK (quantity > 0)");
        $this->execute("ALTER TABLE {{%medicine_stock_logs}} ADD CONSTRAINT stock_logs_balance_after_check CHECK (balance_after >= 0)");

        $this->createIndex('idx_stock_logs_medicine_created', '{{%medicine_stock_logs}}', ['medicine_id', 'created_at']);
    }

    /**
     * {@inheritdoc}
     */
    public function safeDown(): void
    {
        $this->dropForeignKey('fk_stock_logs_medicine', '{{%medicine_stock_logs}}');
        $this->dropTable('{{%medicine_stock_logs}}');

        $this->dropTable('{{%medicines}}');
        $this->dropTable('{{%medical_actions}}');

        $this->dropForeignKey('fk_doctor_schedules_polyclinic', '{{%doctor_schedules}}');
        $this->dropForeignKey('fk_doctor_schedules_doctor', '{{%doctor_schedules}}');
        $this->dropTable('{{%doctor_schedules}}');

        $this->dropTable('{{%polyclinics}}');
        $this->dropTable('{{%patients}}');
    }
}
