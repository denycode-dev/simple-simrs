<?php

declare(strict_types=1);

namespace app\models;

use Yii;
use app\behaviors\AuditTrailBehavior;
use yii\db\ActiveQuery;
use yii\db\ActiveRecord;

/**
 * Prescription model representing the 'prescriptions' table.
 *
 * @property int $id
 * @property int $examination_id
 * @property int $registration_id
 * @property string $prescription_number
 * @property string $status
 * @property string|null $dispensed_at
 * @property int|null $dispensed_by
 * @property string $created_at
 *
 * @property MedicalExamination $examination
 * @property Registration $registration
 * @property PrescriptionItem[] $items
 * @property User|null $dispensedByUser
 */
class Prescription extends ActiveRecord
{
    public static function tableName(): string
    {
        return '{{%prescriptions}}';
    }

    public function behaviors(): array
    {
        return [
            'auditTrail' => [
                'class' => AuditTrailBehavior::class,
                'module' => 'PHARMACY',
            ],
        ];
    }

    public function rules(): array
    {
        return [
            [['examination_id', 'registration_id'], 'required', 'message' => '{attribute} wajib diisi.'],
            [['examination_id', 'registration_id', 'dispensed_by'], 'integer'],
            [['prescription_number'], 'string', 'max' => 30],
            [['prescription_number'], 'unique'],
            [['status'], 'in', 'range' => ['PENDING', 'DISPENSED', 'CANCELLED']],
            [['status'], 'default', 'value' => 'PENDING'],
            [['dispensed_at'], 'safe'],
            [['examination_id'], 'exist', 'skipOnError' => true, 'targetClass' => MedicalExamination::class, 'targetAttribute' => ['examination_id' => 'id']],
            [['registration_id'], 'exist', 'skipOnError' => true, 'targetClass' => Registration::class, 'targetAttribute' => ['registration_id' => 'id']],
            [['dispensed_by'], 'exist', 'skipOnError' => true, 'targetClass' => User::class, 'targetAttribute' => ['dispensed_by' => 'id']],
        ];
    }

    public function getExamination(): ActiveQuery
    {
        return $this->hasOne(MedicalExamination::class, ['id' => 'examination_id']);
    }

    public function getRegistration(): ActiveQuery
    {
        return $this->hasOne(Registration::class, ['id' => 'registration_id']);
    }

    public function getItems(): ActiveQuery
    {
        return $this->hasMany(PrescriptionItem::class, ['prescription_id' => 'id'])->with('medicine');
    }

    public function getDispensedByUser(): ActiveQuery
    {
        return $this->hasOne(User::class, ['id' => 'dispensed_by']);
    }

    public static function generatePrescriptionNumber(?string $date = null): string
    {
        $d = $date ?: date('Y-m-d');
        $prefix = 'RX-' . date('Ymd', strtotime($d)) . '-';
        $count = self::find()->where(['like', 'prescription_number', $prefix . '%', false])->count();
        return $prefix . sprintf('%04d', $count + 1);
    }

    public function beforeSave($insert): bool
    {
        if (!parent::beforeSave($insert)) {
            return false;
        }

        if ($insert) {
            if (empty($this->prescription_number)) {
                $this->prescription_number = self::generatePrescriptionNumber();
            }
            if (empty($this->status)) {
                $this->status = 'PENDING';
            }
            if (empty($this->created_at)) {
                $this->created_at = date('Y-m-d H:i:s');
            }
        }

        return true;
    }

    public function extraFields(): array
    {
        return ['items', 'examination', 'registration', 'dispensedByUser'];
    }
}
