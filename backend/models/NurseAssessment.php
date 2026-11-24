<?php

declare(strict_types=1);

namespace app\models;

use Yii;
use yii\db\ActiveQuery;
use yii\db\ActiveRecord;

/**
 * NurseAssessment model representing the 'nurse_assessments' table.
 *
 * @property int $id
 * @property int $registration_id
 * @property int $nurse_id
 * @property int|null $age_years
 * @property string|null $gender
 * @property float $weight_kg
 * @property float $height_cm
 * @property int $systolic
 * @property int $diastolic
 * @property int $pulse_rate
 * @property float $body_temp
 * @property int $respiratory_rate
 * @property string $chief_complaint
 * @property string|null $allergy_history
 * @property string|null $disease_history
 * @property string|null $notes
 * @property string $created_at
 *
 * @property Registration $registration
 * @property Nurse $nurse
 */
class NurseAssessment extends ActiveRecord
{
    public static function tableName(): string
    {
        return '{{%nurse_assessments}}';
    }

    public function rules(): array
    {
        return [
            [['registration_id', 'nurse_id', 'weight_kg', 'height_cm', 'systolic', 'diastolic', 'pulse_rate', 'body_temp', 'respiratory_rate', 'chief_complaint'], 'required', 'message' => '{attribute} wajib diisi.'],
            [['registration_id', 'nurse_id', 'age_years', 'systolic', 'diastolic', 'pulse_rate', 'respiratory_rate'], 'integer'],
            [['registration_id'], 'unique', 'message' => 'Asesmen nakes untuk registrasi ini sudah pernah disimpan.'],
            [['weight_kg', 'height_cm', 'body_temp'], 'number'],
            [['gender'], 'in', 'range' => ['L', 'P']],
            [['chief_complaint', 'allergy_history', 'disease_history', 'notes'], 'string'],
            [['registration_id'], 'exist', 'skipOnError' => true, 'targetClass' => Registration::class, 'targetAttribute' => ['registration_id' => 'id']],
            [['nurse_id'], 'exist', 'skipOnError' => true, 'targetClass' => Nurse::class, 'targetAttribute' => ['nurse_id' => 'id']],
        ];
    }

    public function getRegistration(): ActiveQuery
    {
        return $this->hasOne(Registration::class, ['id' => 'registration_id']);
    }

    public function getNurse(): ActiveQuery
    {
        return $this->hasOne(Nurse::class, ['id' => 'nurse_id']);
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
