<?php

declare(strict_types=1);

namespace app\models;

use Yii;
use app\behaviors\AuditTrailBehavior;
use yii\db\ActiveQuery;
use yii\db\ActiveRecord;

/**
 * Registration model representing the 'registrations' table.
 *
 * @property int $id
 * @property string $registration_number
 * @property int $patient_id
 * @property int $polyclinic_id
 * @property int $doctor_id
 * @property int $schedule_id
 * @property string $insurance_type
 * @property string $registration_date
 * @property string $queue_number
 * @property int $queue_sequence
 * @property string $status
 * @property float $registration_fee
 * @property string $created_at
 * @property string $updated_at
 *
 * @property Patient $patient
 * @property Polyclinic $polyclinic
 * @property Doctor $doctor
 * @property DoctorSchedule $schedule
 * @property NurseAssessment|null $nurseAssessment
 * @property MedicalExamination|null $medicalExamination
 * @property Billing|null $billing
 */
class Registration extends ActiveRecord
{
    public static function tableName(): string
    {
        return '{{%registrations}}';
    }

    public function behaviors(): array
    {
        return [
            'auditTrail' => [
                'class' => AuditTrailBehavior::class,
                'module' => 'REGISTRATION',
            ],
        ];
    }

    public function rules(): array
    {
        return [
            [['patient_id', 'polyclinic_id', 'doctor_id', 'schedule_id', 'insurance_type'], 'required', 'message' => '{attribute} wajib diisi.'],
            [['patient_id', 'polyclinic_id', 'doctor_id', 'schedule_id', 'queue_sequence'], 'integer'],
            [['registration_fee'], 'number'],
            [['registration_fee'], 'default', 'value' => 25000.00],
            [['registration_date'], 'date', 'format' => 'php:Y-m-d'],
            [['insurance_type'], 'in', 'range' => ['GENERAL', 'BPJS'], 'message' => 'Penjamin harus GENERAL atau BPJS.'],
            [['status'], 'in', 'range' => [
                'WAITING_NURSE', 'IN_NURSE', 'WAITING_DOCTOR', 'IN_DOCTOR',
                'PHARMACY', 'BILLING', 'COMPLETED', 'CANCELLED'
            ], 'message' => 'Status antrean tidak valid.'],
            [['status'], 'default', 'value' => 'WAITING_NURSE'],
            [['patient_id'], 'exist', 'skipOnError' => true, 'targetClass' => Patient::class, 'targetAttribute' => ['patient_id' => 'id']],
            [['polyclinic_id'], 'exist', 'skipOnError' => true, 'targetClass' => Polyclinic::class, 'targetAttribute' => ['polyclinic_id' => 'id']],
            [['doctor_id'], 'exist', 'skipOnError' => true, 'targetClass' => Doctor::class, 'targetAttribute' => ['doctor_id' => 'id']],
            [['schedule_id'], 'exist', 'skipOnError' => true, 'targetClass' => DoctorSchedule::class, 'targetAttribute' => ['schedule_id' => 'id']],
        ];
    }

    public function getPatient(): ActiveQuery
    {
        return $this->hasOne(Patient::class, ['id' => 'patient_id']);
    }

    public function getPolyclinic(): ActiveQuery
    {
        return $this->hasOne(Polyclinic::class, ['id' => 'polyclinic_id']);
    }

    public function getDoctor(): ActiveQuery
    {
        return $this->hasOne(Doctor::class, ['id' => 'doctor_id']);
    }

    public function getSchedule(): ActiveQuery
    {
        return $this->hasOne(DoctorSchedule::class, ['id' => 'schedule_id']);
    }

    public function getNurseAssessment(): ActiveQuery
    {
        return $this->hasOne(NurseAssessment::class, ['registration_id' => 'id']);
    }

    public function getMedicalExamination(): ActiveQuery
    {
        return $this->hasOne(MedicalExamination::class, ['registration_id' => 'id']);
    }

    public function getBilling(): ActiveQuery
    {
        return $this->hasOne(Billing::class, ['registration_id' => 'id']);
    }

    public function beforeSave($insert): bool
    {
        if (!parent::beforeSave($insert)) {
            return false;
        }

        $now = date('Y-m-d H:i:s');
        if ($insert) {
            if (empty($this->registration_date)) {
                $this->registration_date = date('Y-m-d');
            }

            if (empty($this->registration_number)) {
                $prefix = 'REG-' . date('Ymd', strtotime($this->registration_date)) . '-';
                $todayCount = self::find()->where(['registration_date' => $this->registration_date])->count();
                $this->registration_number = $prefix . sprintf('%04d', $todayCount + 1);
            }

            if (empty($this->queue_sequence) || empty($this->queue_number)) {
                $maxSeq = self::find()
                    ->where(['polyclinic_id' => $this->polyclinic_id, 'registration_date' => $this->registration_date])
                    ->max('queue_sequence');

                $nextSeq = ($maxSeq ? (int)$maxSeq : 0) + 1;
                $this->queue_sequence = $nextSeq;

                $poly = Polyclinic::findOne($this->polyclinic_id);
                $polyCode = $poly ? $poly->code : 'POL';
                $this->queue_number = $polyCode . '-' . sprintf('%03d', $nextSeq);
            }

            if (empty($this->status)) {
                $this->status = 'WAITING_NURSE';
            }

            if (empty($this->created_at)) {
                $this->created_at = $now;
            }
        }

        $this->updated_at = $now;
        return true;
    }

    public function afterSave($insert, $changedAttributes): void
    {
        parent::afterSave($insert, $changedAttributes);
        if ($insert) {
            Billing::createForRegistration($this);
        }
    }
}
