<?php

declare(strict_types=1);

namespace app\models;

use Yii;
use yii\db\ActiveQuery;
use yii\db\ActiveRecord;

/**
 * PrescriptionItem model representing the 'prescription_items' table.
 *
 * @property int $id
 * @property int $prescription_id
 * @property int $medicine_id
 * @property int $quantity
 * @property string $dosage
 * @property string $frequency
 * @property string|null $instructions
 * @property float $unit_price
 * @property float $subtotal
 *
 * @property Prescription $prescription
 * @property Medicine $medicine
 */
class PrescriptionItem extends ActiveRecord
{
    public static function tableName(): string
    {
        return '{{%prescription_items}}';
    }

    public function rules(): array
    {
        return [
            [['prescription_id', 'medicine_id', 'quantity', 'dosage', 'frequency'], 'required', 'message' => '{attribute} wajib diisi.'],
            [['prescription_id', 'medicine_id', 'quantity'], 'integer'],
            [['quantity'], 'compare', 'compareValue' => 0, 'operator' => '>', 'message' => 'Jumlah obat harus lebih dari 0.'],
            [['dosage', 'frequency'], 'string', 'max' => 50],
            [['instructions'], 'string', 'max' => 255],
            [['unit_price', 'subtotal'], 'number', 'min' => 0],
            [['prescription_id'], 'exist', 'skipOnError' => true, 'targetClass' => Prescription::class, 'targetAttribute' => ['prescription_id' => 'id']],
            [['medicine_id'], 'exist', 'skipOnError' => true, 'targetClass' => Medicine::class, 'targetAttribute' => ['medicine_id' => 'id']],
        ];
    }

    public function getPrescription(): ActiveQuery
    {
        return $this->hasOne(Prescription::class, ['id' => 'prescription_id']);
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

        if ($insert) {
            if ($this->unit_price === null || $this->unit_price === '') {
                $med = Medicine::findOne($this->medicine_id);
                $this->unit_price = $med ? (float)$med->unit_price : 0.00;
            }
            $this->subtotal = (float)$this->quantity * (float)$this->unit_price;
        }

        return true;
    }
}
