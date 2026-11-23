<?php

declare(strict_types=1);

use yii\db\Migration;

/**
 * Handles the creation of 10 transaction tables:
 * `registrations`, `nurse_assessments`, `medical_examinations`, `examination_actions`,
 * `prescriptions`, `prescription_items`, `lab_orders`, `lab_order_items`,
 * `billings`, and `billing_payments`.
 */
class m261123_000003_create_transaction_tables extends Migration
{
    /**
     * {@inheritdoc}
     */
    public function safeUp(): void
    {
        // 1. Table registrations
        $this->createTable('{{%registrations}}', [
            'id' => $this->primaryKey(),
            'registration_number' => $this->string(30)->notNull()->unique(),
            'patient_id' => $this->integer()->notNull(),
            'polyclinic_id' => $this->integer()->notNull(),
            'doctor_id' => $this->integer()->notNull(),
            'schedule_id' => $this->integer()->null(),
            'insurance_type' => $this->string(20)->notNull(),
            'registration_date' => $this->date()->notNull()->defaultExpression('CURRENT_DATE'),
            'queue_number' => $this->string(20)->notNull(),
            'queue_sequence' => $this->integer()->notNull(),
            'status' => $this->string(30)->notNull()->defaultValue('WAITING_NURSE'),
            'registration_fee' => $this->decimal(12, 2)->notNull()->defaultValue(0.00),
            'created_at' => $this->timestamp()->notNull()->defaultExpression('CURRENT_TIMESTAMP'),
            'updated_at' => $this->timestamp()->notNull()->defaultExpression('CURRENT_TIMESTAMP'),
        ]);

        $this->addForeignKey(
            'fk_registrations_patient',
            '{{%registrations}}',
            'patient_id',
            '{{%patients}}',
            'id',
            'RESTRICT',
            'CASCADE'
        );
        $this->addForeignKey(
            'fk_registrations_polyclinic',
            '{{%registrations}}',
            'polyclinic_id',
            '{{%polyclinics}}',
            'id',
            'RESTRICT',
            'CASCADE'
        );
        $this->addForeignKey(
            'fk_registrations_doctor',
            '{{%registrations}}',
            'doctor_id',
            '{{%doctors}}',
            'id',
            'RESTRICT',
            'CASCADE'
        );
        $this->addForeignKey(
            'fk_registrations_schedule',
            '{{%registrations}}',
            'schedule_id',
            '{{%doctor_schedules}}',
            'id',
            'SET NULL',
            'CASCADE'
        );

        $this->execute("ALTER TABLE {{%registrations}} ADD CONSTRAINT registrations_insurance_type_check CHECK (insurance_type IN ('GENERAL', 'BPJS'))");
        $this->execute("ALTER TABLE {{%registrations}} ADD CONSTRAINT registrations_status_check CHECK (status IN ('WAITING_NURSE', 'IN_NURSE', 'WAITING_DOCTOR', 'IN_DOCTOR', 'PHARMACY', 'BILLING', 'COMPLETED', 'CANCELLED'))");

        $this->createIndex('idx_registrations_polyclinic_date', '{{%registrations}}', ['polyclinic_id', 'registration_date']);
        $this->createIndex('idx_registrations_date_status', '{{%registrations}}', ['registration_date', 'status']);
        $this->createIndex('idx_registrations_patient_date', '{{%registrations}}', ['patient_id', 'registration_date']);

        // 2. Table nurse_assessments
        $this->createTable('{{%nurse_assessments}}', [
            'id' => $this->primaryKey(),
            'registration_id' => $this->integer()->notNull()->unique(),
            'nurse_id' => $this->integer()->notNull(),
            'age_years' => $this->integer()->notNull(),
            'gender' => $this->string(1)->notNull(),
            'weight_kg' => $this->decimal(5, 2)->notNull(),
            'height_cm' => $this->decimal(5, 2)->notNull(),
            'systolic' => $this->integer()->notNull(),
            'diastolic' => $this->integer()->notNull(),
            'pulse_rate' => $this->integer()->notNull(),
            'body_temp' => $this->decimal(4, 1)->notNull(),
            'respiratory_rate' => $this->integer()->notNull(),
            'chief_complaint' => $this->text()->notNull(),
            'allergy_history' => $this->text()->null(),
            'disease_history' => $this->text()->null(),
            'notes' => $this->text()->null(),
            'created_at' => $this->timestamp()->notNull()->defaultExpression('CURRENT_TIMESTAMP'),
        ]);

        $this->addForeignKey(
            'fk_nurse_assessments_reg',
            '{{%nurse_assessments}}',
            'registration_id',
            '{{%registrations}}',
            'id',
            'CASCADE',
            'CASCADE'
        );
        $this->addForeignKey(
            'fk_nurse_assessments_nurse',
            '{{%nurse_assessments}}',
            'nurse_id',
            '{{%nurses}}',
            'id',
            'RESTRICT',
            'CASCADE'
        );

        $this->execute("ALTER TABLE {{%nurse_assessments}} ADD CONSTRAINT nurse_assessments_gender_check CHECK (gender IN ('L', 'P'))");
        $this->createIndex('idx_nurse_assessments_nurse_id', '{{%nurse_assessments}}', 'nurse_id');

        // 3. Table medical_examinations
        $this->createTable('{{%medical_examinations}}', [
            'id' => $this->primaryKey(),
            'registration_id' => $this->integer()->notNull()->unique(),
            'doctor_id' => $this->integer()->notNull(),
            'physical_exam' => $this->text()->null(),
            'primary_diagnosis_code' => $this->string(20)->notNull(),
            'primary_diagnosis_desc' => $this->string(255)->notNull(),
            'secondary_diagnosis' => $this->text()->null(),
            'doctor_notes' => $this->text()->null(),
            'created_at' => $this->timestamp()->notNull()->defaultExpression('CURRENT_TIMESTAMP'),
            'updated_at' => $this->timestamp()->notNull()->defaultExpression('CURRENT_TIMESTAMP'),
        ]);

        $this->addForeignKey(
            'fk_medical_examinations_reg',
            '{{%medical_examinations}}',
            'registration_id',
            '{{%registrations}}',
            'id',
            'CASCADE',
            'CASCADE'
        );
        $this->addForeignKey(
            'fk_medical_examinations_doctor',
            '{{%medical_examinations}}',
            'doctor_id',
            '{{%doctors}}',
            'id',
            'RESTRICT',
            'CASCADE'
        );

        $this->createIndex('idx_medical_examinations_doctor', '{{%medical_examinations}}', 'doctor_id');

        // 4. Table examination_actions
        $this->createTable('{{%examination_actions}}', [
            'id' => $this->primaryKey(),
            'examination_id' => $this->integer()->notNull(),
            'action_id' => $this->integer()->notNull(),
            'tariff' => $this->decimal(12, 2)->notNull(),
            'notes' => $this->text()->null(),
            'created_at' => $this->timestamp()->notNull()->defaultExpression('CURRENT_TIMESTAMP'),
        ]);

        $this->addForeignKey(
            'fk_exam_actions_exam',
            '{{%examination_actions}}',
            'examination_id',
            '{{%medical_examinations}}',
            'id',
            'CASCADE',
            'CASCADE'
        );
        $this->addForeignKey(
            'fk_exam_actions_action',
            '{{%examination_actions}}',
            'action_id',
            '{{%medical_actions}}',
            'id',
            'RESTRICT',
            'CASCADE'
        );

        $this->execute("ALTER TABLE {{%examination_actions}} ADD CONSTRAINT exam_actions_tariff_check CHECK (tariff >= 0)");

        $this->createIndex('idx_exam_actions_exam', '{{%examination_actions}}', 'examination_id');
        $this->createIndex('idx_exam_actions_action', '{{%examination_actions}}', 'action_id');

        // 5. Table prescriptions
        $this->createTable('{{%prescriptions}}', [
            'id' => $this->primaryKey(),
            'examination_id' => $this->integer()->notNull(),
            'registration_id' => $this->integer()->notNull(),
            'prescription_number' => $this->string(30)->notNull()->unique(),
            'status' => $this->string(20)->notNull()->defaultValue('PENDING'),
            'dispensed_at' => $this->timestamp()->null(),
            'dispensed_by' => $this->integer()->null(),
            'created_at' => $this->timestamp()->notNull()->defaultExpression('CURRENT_TIMESTAMP'),
        ]);

        $this->addForeignKey(
            'fk_prescriptions_exam',
            '{{%prescriptions}}',
            'examination_id',
            '{{%medical_examinations}}',
            'id',
            'CASCADE',
            'CASCADE'
        );
        $this->addForeignKey(
            'fk_prescriptions_reg',
            '{{%prescriptions}}',
            'registration_id',
            '{{%registrations}}',
            'id',
            'CASCADE',
            'CASCADE'
        );
        $this->addForeignKey(
            'fk_prescriptions_dispensed_by',
            '{{%prescriptions}}',
            'dispensed_by',
            '{{%users}}',
            'id',
            'SET NULL',
            'CASCADE'
        );

        $this->execute("ALTER TABLE {{%prescriptions}} ADD CONSTRAINT prescriptions_status_check CHECK (status IN ('PENDING', 'DISPENSED', 'CANCELLED'))");

        $this->createIndex('idx_prescriptions_exam', '{{%prescriptions}}', 'examination_id');
        $this->createIndex('idx_prescriptions_reg', '{{%prescriptions}}', 'registration_id');
        $this->createIndex('idx_prescriptions_status', '{{%prescriptions}}', 'status');

        // 6. Table prescription_items
        $this->createTable('{{%prescription_items}}', [
            'id' => $this->primaryKey(),
            'prescription_id' => $this->integer()->notNull(),
            'medicine_id' => $this->integer()->notNull(),
            'quantity' => $this->integer()->notNull(),
            'dosage' => $this->string(50)->notNull(),
            'frequency' => $this->string(50)->notNull(),
            'instructions' => $this->string(255)->null(),
            'unit_price' => $this->decimal(12, 2)->notNull(),
            'subtotal' => $this->decimal(12, 2)->notNull(),
        ]);

        $this->addForeignKey(
            'fk_prescription_items_prescription',
            '{{%prescription_items}}',
            'prescription_id',
            '{{%prescriptions}}',
            'id',
            'CASCADE',
            'CASCADE'
        );
        $this->addForeignKey(
            'fk_prescription_items_medicine',
            '{{%prescription_items}}',
            'medicine_id',
            '{{%medicines}}',
            'id',
            'RESTRICT',
            'CASCADE'
        );

        $this->execute("ALTER TABLE {{%prescription_items}} ADD CONSTRAINT prescription_items_quantity_check CHECK (quantity > 0)");
        $this->execute("ALTER TABLE {{%prescription_items}} ADD CONSTRAINT prescription_items_unit_price_check CHECK (unit_price >= 0)");
        $this->execute("ALTER TABLE {{%prescription_items}} ADD CONSTRAINT prescription_items_subtotal_check CHECK (subtotal >= 0)");

        $this->createIndex('idx_prescription_items_prescription', '{{%prescription_items}}', 'prescription_id');
        $this->createIndex('idx_prescription_items_medicine', '{{%prescription_items}}', 'medicine_id');

        // 7. Table lab_orders
        $this->createTable('{{%lab_orders}}', [
            'id' => $this->primaryKey(),
            'examination_id' => $this->integer()->notNull(),
            'registration_id' => $this->integer()->notNull(),
            'order_number' => $this->string(30)->notNull()->unique(),
            'status' => $this->string(20)->notNull()->defaultValue('REQUESTED'),
            'clinical_notes' => $this->text()->null(),
            'ordered_at' => $this->timestamp()->notNull()->defaultExpression('CURRENT_TIMESTAMP'),
            'completed_at' => $this->timestamp()->null(),
            'completed_by' => $this->integer()->null(),
        ]);

        $this->addForeignKey(
            'fk_lab_orders_exam',
            '{{%lab_orders}}',
            'examination_id',
            '{{%medical_examinations}}',
            'id',
            'CASCADE',
            'CASCADE'
        );
        $this->addForeignKey(
            'fk_lab_orders_reg',
            '{{%lab_orders}}',
            'registration_id',
            '{{%registrations}}',
            'id',
            'CASCADE',
            'CASCADE'
        );
        $this->addForeignKey(
            'fk_lab_orders_completed_by',
            '{{%lab_orders}}',
            'completed_by',
            '{{%users}}',
            'id',
            'SET NULL',
            'CASCADE'
        );

        $this->execute("ALTER TABLE {{%lab_orders}} ADD CONSTRAINT lab_orders_status_check CHECK (status IN ('REQUESTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'))");

        $this->createIndex('idx_lab_orders_exam', '{{%lab_orders}}', 'examination_id');
        $this->createIndex('idx_lab_orders_reg', '{{%lab_orders}}', 'registration_id');
        $this->createIndex('idx_lab_orders_status', '{{%lab_orders}}', 'status');

        // 8. Table lab_order_items
        $this->createTable('{{%lab_order_items}}', [
            'id' => $this->primaryKey(),
            'lab_order_id' => $this->integer()->notNull(),
            'test_name' => $this->string(100)->notNull(),
            'test_code' => $this->string(20)->notNull(),
            'result_value' => $this->string(100)->null(),
            'reference_range' => $this->string(100)->null(),
            'unit' => $this->string(20)->null(),
            'status_flag' => $this->string(20)->null(),
            'tariff' => $this->decimal(12, 2)->notNull()->defaultValue(0.00),
            'notes' => $this->text()->null(),
        ]);

        $this->addForeignKey(
            'fk_lab_order_items_order',
            '{{%lab_order_items}}',
            'lab_order_id',
            '{{%lab_orders}}',
            'id',
            'CASCADE',
            'CASCADE'
        );

        $this->execute("ALTER TABLE {{%lab_order_items}} ADD CONSTRAINT lab_order_items_status_flag_check CHECK (status_flag IN ('NORMAL', 'ABNORMAL', 'HIGH', 'LOW'))");
        $this->execute("ALTER TABLE {{%lab_order_items}} ADD CONSTRAINT lab_order_items_tariff_check CHECK (tariff >= 0)");

        $this->createIndex('idx_lab_order_items_order', '{{%lab_order_items}}', 'lab_order_id');

        // 9. Table billings
        $this->createTable('{{%billings}}', [
            'id' => $this->primaryKey(),
            'registration_id' => $this->integer()->notNull()->unique(),
            'invoice_number' => $this->string(30)->notNull()->unique(),
            'insurance_type' => $this->string(20)->notNull(),
            'total_registration_fee' => $this->decimal(12, 2)->notNull()->defaultValue(0.00),
            'total_actions_fee' => $this->decimal(12, 2)->notNull()->defaultValue(0.00),
            'total_medicines_fee' => $this->decimal(12, 2)->notNull()->defaultValue(0.00),
            'total_lab_fee' => $this->decimal(12, 2)->notNull()->defaultValue(0.00),
            'total_amount' => $this->decimal(12, 2)->notNull()->defaultValue(0.00),
            'covered_by_bpjs' => $this->decimal(12, 2)->notNull()->defaultValue(0.00),
            'patient_payable' => $this->decimal(12, 2)->notNull()->defaultValue(0.00),
            'payment_status' => $this->string(20)->notNull()->defaultValue('UNPAID'),
            'created_at' => $this->timestamp()->notNull()->defaultExpression('CURRENT_TIMESTAMP'),
            'updated_at' => $this->timestamp()->notNull()->defaultExpression('CURRENT_TIMESTAMP'),
        ]);

        $this->addForeignKey(
            'fk_billings_registration',
            '{{%billings}}',
            'registration_id',
            '{{%registrations}}',
            'id',
            'CASCADE',
            'CASCADE'
        );

        $this->execute("ALTER TABLE {{%billings}} ADD CONSTRAINT billings_insurance_type_check CHECK (insurance_type IN ('GENERAL', 'BPJS'))");
        $this->execute("ALTER TABLE {{%billings}} ADD CONSTRAINT billings_payment_status_check CHECK (payment_status IN ('UNPAID', 'PAID'))");

        $this->createIndex('idx_billings_payment_status', '{{%billings}}', 'payment_status');

        // 10. Table billing_payments
        $this->createTable('{{%billing_payments}}', [
            'id' => $this->primaryKey(),
            'billing_id' => $this->integer()->notNull(),
            'payment_number' => $this->string(30)->notNull()->unique(),
            'payment_method' => $this->string(20)->notNull(),
            'amount' => $this->decimal(12, 2)->notNull(),
            'amount_received' => $this->decimal(12, 2)->notNull()->defaultValue(0.00),
            'change_amount' => $this->decimal(12, 2)->notNull()->defaultValue(0.00),
            'payment_date' => $this->timestamp()->notNull()->defaultExpression('CURRENT_TIMESTAMP'),
            'cashier_id' => $this->integer()->notNull(),
            'notes' => $this->text()->null(),
        ]);

        $this->addForeignKey(
            'fk_billing_payments_billing',
            '{{%billing_payments}}',
            'billing_id',
            '{{%billings}}',
            'id',
            'CASCADE',
            'CASCADE'
        );
        $this->addForeignKey(
            'fk_billing_payments_cashier',
            '{{%billing_payments}}',
            'cashier_id',
            '{{%users}}',
            'id',
            'RESTRICT',
            'CASCADE'
        );

        $this->execute("ALTER TABLE {{%billing_payments}} ADD CONSTRAINT billing_payments_payment_method_check CHECK (payment_method IN ('CASH', 'BPJS'))");
        $this->execute("ALTER TABLE {{%billing_payments}} ADD CONSTRAINT billing_payments_amount_check CHECK (amount >= 0)");

        $this->createIndex('idx_billing_payments_billing', '{{%billing_payments}}', 'billing_id');
        $this->createIndex('idx_billing_payments_cashier', '{{%billing_payments}}', 'cashier_id');
    }

    /**
     * {@inheritdoc}
     */
    public function safeDown(): void
    {
        // 10. billing_payments
        $this->dropForeignKey('fk_billing_payments_cashier', '{{%billing_payments}}');
        $this->dropForeignKey('fk_billing_payments_billing', '{{%billing_payments}}');
        $this->dropTable('{{%billing_payments}}');

        // 9. billings
        $this->dropForeignKey('fk_billings_registration', '{{%billings}}');
        $this->dropTable('{{%billings}}');

        // 8. lab_order_items
        $this->dropForeignKey('fk_lab_order_items_order', '{{%lab_order_items}}');
        $this->dropTable('{{%lab_order_items}}');

        // 7. lab_orders
        $this->dropForeignKey('fk_lab_orders_completed_by', '{{%lab_orders}}');
        $this->dropForeignKey('fk_lab_orders_reg', '{{%lab_orders}}');
        $this->dropForeignKey('fk_lab_orders_exam', '{{%lab_orders}}');
        $this->dropTable('{{%lab_orders}}');

        // 6. prescription_items
        $this->dropForeignKey('fk_prescription_items_medicine', '{{%prescription_items}}');
        $this->dropForeignKey('fk_prescription_items_prescription', '{{%prescription_items}}');
        $this->dropTable('{{%prescription_items}}');

        // 5. prescriptions
        $this->dropForeignKey('fk_prescriptions_dispensed_by', '{{%prescriptions}}');
        $this->dropForeignKey('fk_prescriptions_reg', '{{%prescriptions}}');
        $this->dropForeignKey('fk_prescriptions_exam', '{{%prescriptions}}');
        $this->dropTable('{{%prescriptions}}');

        // 4. examination_actions
        $this->dropForeignKey('fk_exam_actions_action', '{{%examination_actions}}');
        $this->dropForeignKey('fk_exam_actions_exam', '{{%examination_actions}}');
        $this->dropTable('{{%examination_actions}}');

        // 3. medical_examinations
        $this->dropForeignKey('fk_medical_examinations_doctor', '{{%medical_examinations}}');
        $this->dropForeignKey('fk_medical_examinations_reg', '{{%medical_examinations}}');
        $this->dropTable('{{%medical_examinations}}');

        // 2. nurse_assessments
        $this->dropForeignKey('fk_nurse_assessments_nurse', '{{%nurse_assessments}}');
        $this->dropForeignKey('fk_nurse_assessments_reg', '{{%nurse_assessments}}');
        $this->dropTable('{{%nurse_assessments}}');

        // 1. registrations
        $this->dropForeignKey('fk_registrations_schedule', '{{%registrations}}');
        $this->dropForeignKey('fk_registrations_doctor', '{{%registrations}}');
        $this->dropForeignKey('fk_registrations_polyclinic', '{{%registrations}}');
        $this->dropForeignKey('fk_registrations_patient', '{{%registrations}}');
        $this->dropTable('{{%registrations}}');
    }
}
