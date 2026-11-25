<?php

declare(strict_types=1);

namespace app\models;

use Yii;
use app\behaviors\AuditTrailBehavior;
use yii\db\ActiveQuery;
use yii\db\ActiveRecord;

/**
 * BillingPayment model representing the 'billing_payments' table.
 *
 * @property int $id
 * @property int $billing_id
 * @property string $payment_number
 * @property string $payment_method
 * @property float $amount
 * @property float $amount_received
 * @property float $change_amount
 * @property string $payment_date
 * @property int $cashier_id
 * @property string|null $notes
 *
 * @property Billing $billing
 * @property User $cashier
 */
class BillingPayment extends ActiveRecord
{
    public static function tableName(): string
    {
        return '{{%billing_payments}}';
    }

    public function behaviors(): array
    {
        return [
            'auditTrail' => [
                'class' => AuditTrailBehavior::class,
                'module' => 'BILLING',
            ],
        ];
    }

    public function rules(): array
    {
        return [
            [['billing_id', 'payment_method', 'amount', 'cashier_id'], 'required', 'message' => '{attribute} wajib diisi.'],
            [['billing_id', 'cashier_id'], 'integer'],
            [['payment_method'], 'in', 'range' => ['CASH', 'BPJS'], 'message' => 'Metode pembayaran harus CASH atau BPJS.'],
            [['amount', 'amount_received', 'change_amount'], 'number', 'min' => 0],
            [['payment_number'], 'string', 'max' => 30],
            [['payment_number'], 'unique'],
            [['notes'], 'string'],
            [['billing_id'], 'exist', 'skipOnError' => true, 'targetClass' => Billing::class, 'targetAttribute' => ['billing_id' => 'id']],
            [['cashier_id'], 'exist', 'skipOnError' => true, 'targetClass' => User::class, 'targetAttribute' => ['cashier_id' => 'id']],
        ];
    }

    public function getBilling(): ActiveQuery
    {
        return $this->hasOne(Billing::class, ['id' => 'billing_id']);
    }

    public function getCashier(): ActiveQuery
    {
        return $this->hasOne(User::class, ['id' => 'cashier_id']);
    }

    public static function generatePaymentNumber(?string $date = null): string
    {
        $d = $date ?: date('Y-m-d');
        $prefix = 'PAY-' . date('Ymd', strtotime($d)) . '-';
        $count = self::find()->where(['like', 'payment_number', $prefix . '%', false])->count();
        return $prefix . sprintf('%04d', $count + 1);
    }

    public function beforeSave($insert): bool
    {
        if (!parent::beforeSave($insert)) {
            return false;
        }

        if ($insert) {
            if (empty($this->payment_number)) {
                $this->payment_number = self::generatePaymentNumber();
            }
            if (empty($this->payment_date)) {
                $this->payment_date = date('Y-m-d H:i:s');
            }
        }

        return true;
    }
}
