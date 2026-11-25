<?php

declare(strict_types=1);

namespace app\models;

use Yii;
use app\behaviors\AuditTrailBehavior;
use yii\db\ActiveQuery;
use yii\db\ActiveRecord;

/**
 * MedicalExamination model representing the 'medical_examinations' table.
 *
 * @property int $id
 * @property int $registration_id
 * @property int $doctor_id
 * @property string|null $physical_exam
 * @property string $primary_diagnosis_code
 * @property string $primary_diagnosis_desc
 * @property string|null $secondary_diagnosis
 * @property string|null $doctor_notes
 * @property string $created_at
 * @property string $updated_at
 *
 * @property Registration $registration
 * @property Doctor $doctor
 * @property ExaminationAction[] $actions
 * @property Prescription[] $prescriptions
 * @property LabOrder[] $labOrders
 */
class MedicalExamination extends ActiveRecord
{
    public static function tableName(): string
    {
        return '{{%medical_examinations}}';
    }

    public function behaviors(): array
    {
        return [
            'auditTrail' => [
                'class' => AuditTrailBehavior::class,
                'module' => 'EXAMINATION',
            ],
        ];
    }

    public function rules(): array
    {
        return [
            [['registration_id', 'doctor_id', 'primary_diagnosis_code', 'primary_diagnosis_desc'], 'required', 'message' => '{attribute} wajib diisi.'],
            [['registration_id', 'doctor_id'], 'integer'],
            [['registration_id'], 'unique', 'message' => 'Pemeriksaan RME dokter untuk registrasi ini sudah pernah dibuat.'],
            [['primary_diagnosis_code'], 'string', 'max' => 20],
            [['primary_diagnosis_desc'], 'string', 'max' => 255],
            [['physical_exam', 'secondary_diagnosis', 'doctor_notes'], 'string'],
            [['registration_id'], 'exist', 'skipOnError' => true, 'targetClass' => Registration::class, 'targetAttribute' => ['registration_id' => 'id']],
            [['doctor_id'], 'exist', 'skipOnError' => true, 'targetClass' => Doctor::class, 'targetAttribute' => ['doctor_id' => 'id']],
        ];
    }

    public function getRegistration(): ActiveQuery
    {
        return $this->hasOne(Registration::class, ['id' => 'registration_id']);
    }

    public function getDoctor(): ActiveQuery
    {
        return $this->hasOne(Doctor::class, ['id' => 'doctor_id']);
    }

    public function getActions(): ActiveQuery
    {
        return $this->hasMany(ExaminationAction::class, ['examination_id' => 'id'])->with('action');
    }

    public function getPrescriptions(): ActiveQuery
    {
        return $this->hasMany(Prescription::class, ['examination_id' => 'id'])->with('items.medicine');
    }

    public function extraFields(): array
    {
        return ['registration', 'doctor', 'actions', 'prescriptions'];
    }

    public function beforeSave($insert): bool
    {
        if (!parent::beforeSave($insert)) {
            return false;
        }

        $now = date('Y-m-d H:i:s');
        if ($insert && empty($this->created_at)) {
            $this->created_at = $now;
        }
        $this->updated_at = $now;
        return true;
    }
}
