<?php

declare(strict_types=1);

namespace app\models;

use Yii;
use yii\db\ActiveQuery;
use yii\db\ActiveRecord;

/**
 * Billing model representing the 'billings' table.
 *
 * @property int $id
 * @property int $registration_id
 * @property string $invoice_number
 * @property string $insurance_type
 * @property float $total_registration_fee
 * @property float $total_actions_fee
 * @property float $total_medicines_fee
 * @property float $total_lab_fee
 * @property float $total_amount
 * @property float $covered_by_bpjs
 * @property float $patient_payable
 * @property string $payment_status
 * @property string $created_at
 * @property string $updated_at
 *
 * @property Registration $registration
 * @property BillingPayment[] $payments
 */
class Billing extends ActiveRecord
{
    public static function tableName(): string
    {
        return '{{%billings}}';
    }

    public function rules(): array
    {
        return [
            [['registration_id', 'invoice_number', 'insurance_type'], 'required'],
            [['registration_id'], 'integer'],
            [['registration_id', 'invoice_number'], 'unique'],
            [['insurance_type'], 'in', 'range' => ['GENERAL', 'BPJS']],
            [['payment_status'], 'in', 'range' => ['UNPAID', 'PAID']],
            [['payment_status'], 'default', 'value' => 'UNPAID'],
            [['total_registration_fee', 'total_actions_fee', 'total_medicines_fee', 'total_lab_fee', 'total_amount', 'covered_by_bpjs', 'patient_payable'], 'number'],
        ];
    }

    public function getRegistration(): ActiveQuery
    {
        return $this->hasOne(Registration::class, ['id' => 'registration_id']);
    }

    public function getPayments(): ActiveQuery
    {
        return $this->hasMany(BillingPayment::class, ['billing_id' => 'id']);
    }

    public static function generateInvoiceNumber(string $date): string
    {
        $prefix = 'INV-' . date('Ymd', strtotime($date)) . '-';
        $count = self::find()->where(['like', 'invoice_number', $prefix . '%', false])->count();
        return $prefix . sprintf('%04d', $count + 1);
    }

    public static function createForRegistration(Registration $reg): self
    {
        $billing = new self();
        $billing->registration_id = $reg->id;
        $billing->invoice_number = self::generateInvoiceNumber($reg->registration_date);
        $billing->insurance_type = $reg->insurance_type;
        $billing->total_registration_fee = (float)$reg->registration_fee;
        $billing->total_actions_fee = 0.00;
        $billing->total_medicines_fee = 0.00;
        $billing->total_lab_fee = 0.00;
        $billing->total_amount = (float)$reg->registration_fee;

        if ($reg->insurance_type === 'BPJS') {
            $billing->covered_by_bpjs = (float)$reg->registration_fee;
            $billing->patient_payable = 0.00;
        } else {
            $billing->covered_by_bpjs = 0.00;
            $billing->patient_payable = (float)$reg->registration_fee;
        }

        $billing->payment_status = 'UNPAID';
        $billing->created_at = date('Y-m-d H:i:s');
        $billing->updated_at = date('Y-m-d H:i:s');
        $billing->save(false);

        return $billing;
    }

    public static function recalculate(int $registrationId): ?self
    {
        $billing = self::findOne(['registration_id' => $registrationId]);
        if ($billing === null) {
            return null;
        }

        // Actions fee
        $actionsFee = (float) ExaminationAction::find()
            ->innerJoin('medical_examinations me', 'me.id = examination_actions.examination_id')
            ->where(['me.registration_id' => $registrationId])
            ->sum('tariff') ?? 0.00;

        // Medicines fee
        $medicinesFee = (float) PrescriptionItem::find()
            ->innerJoin('prescriptions p', 'p.id = prescription_items.prescription_id')
            ->where(['p.registration_id' => $registrationId])
            ->sum('subtotal') ?? 0.00;

        // Lab fee
        $labFee = (float) LabOrderItem::find()
            ->innerJoin('lab_orders lo', 'lo.id = lab_order_items.lab_order_id')
            ->where(['lo.registration_id' => $registrationId])
            ->sum('tariff') ?? 0.00;

        $billing->total_actions_fee = $actionsFee;
        $billing->total_medicines_fee = $medicinesFee;
        $billing->total_lab_fee = $labFee;
        $billing->total_amount = (float)$billing->total_registration_fee + $actionsFee + $medicinesFee + $labFee;

        if ($billing->insurance_type === 'BPJS') {
            $billing->covered_by_bpjs = $billing->total_amount;
            $billing->patient_payable = 0.00;
        } else {
            $billing->covered_by_bpjs = 0.00;
            $billing->patient_payable = $billing->total_amount;
        }

        $billing->updated_at = date('Y-m-d H:i:s');
        $billing->save(false);

        return $billing;
    }
}
