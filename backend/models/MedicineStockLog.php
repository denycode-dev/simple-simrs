<?php

declare(strict_types=1);

namespace app\models;

use Yii;
use yii\db\ActiveQuery;
use yii\db\ActiveRecord;

/**
 * MedicineStockLog model representing the 'medicine_stock_logs' table.
 *
 * @property int $id
 * @property int $medicine_id
 * @property string $transaction_type
 * @property int $quantity
 * @property int $balance_after
 * @property string|null $reference_type
 * @property int|null $reference_id
 * @property string|null $notes
 * @property string $created_at
 *
 * @property Medicine $medicine
 */
class MedicineStockLog extends ActiveRecord
{
    public static function tableName(): string
    {
        return '{{%medicine_stock_logs}}';
    }

    public function rules(): array
    {
        return [
            [['medicine_id', 'transaction_type', 'quantity', 'balance_after'], 'required'],
            [['medicine_id', 'quantity', 'balance_after', 'reference_id'], 'integer'],
            [['transaction_type'], 'in', 'range' => ['IN', 'OUT', 'ADJUSTMENT']],
            [['reference_type'], 'string', 'max' => 50],
            [['notes'], 'string'],
        ];
    }

    public function getMedicine(): ActiveQuery
    {
        return $this->hasOne(Medicine::class, ['id' => 'medicine_id']);
    }

    public function beforeSave($insert): bool
    {
        if (!parent::beforeSave($insert)) {
            return false;
        }
        if ($insert && empty($this->created_at)) {
            $this->created_at = date('Y-m-d H:i:s');
        }
        return true;
    }
}
