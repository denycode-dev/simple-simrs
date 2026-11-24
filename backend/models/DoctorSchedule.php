<?php

declare(strict_types=1);

namespace app\models;

use Yii;
use yii\db\ActiveQuery;
use yii\db\ActiveRecord;

/**
 * DoctorSchedule model representing the 'doctor_schedules' table.
 *
 * @property int $id
 * @property int $doctor_id
 * @property int $polyclinic_id
 * @property string $day_of_week
 * @property string $start_time
 * @property string $end_time
 * @property int $quota
 * @property bool $is_active
 *
 * @property Doctor $doctor
 * @property Polyclinic $polyclinic
 */
class DoctorSchedule extends ActiveRecord
{
    public static function tableName(): string
    {
        return '{{%doctor_schedules}}';
    }

    public function rules(): array
    {
        return [
            [['doctor_id', 'polyclinic_id', 'day_of_week', 'start_time', 'end_time'], 'required', 'message' => '{attribute} wajib diisi.'],
            [['doctor_id', 'polyclinic_id', 'quota'], 'integer'],
            [['quota'], 'default', 'value' => 30],
            [['is_active'], 'boolean'],
            [['is_active'], 'default', 'value' => true],
            [['day_of_week'], 'in', 'range' => ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'], 'message' => 'Hari praktik tidak valid.'],
            [['doctor_id'], 'exist', 'skipOnError' => true, 'targetClass' => Doctor::class, 'targetAttribute' => ['doctor_id' => 'id']],
            [['polyclinic_id'], 'exist', 'skipOnError' => true, 'targetClass' => Polyclinic::class, 'targetAttribute' => ['polyclinic_id' => 'id']],
            [['start_time', 'end_time'], 'validateScheduleOverlap'],
        ];
    }

    /**
     * Prevents overlapping schedules for the same doctor on the same day of week.
     */
    public function validateScheduleOverlap(string $attribute, ?array $params): void
    {
        if ($this->hasErrors() || empty($this->doctor_id) || empty($this->day_of_week) || empty($this->start_time) || empty($this->end_time)) {
            return;
        }

        if (strtotime($this->start_time) >= strtotime($this->end_time)) {
            $this->addError('end_time', 'Jam selesai praktik harus lebih akhir dari jam mulai.');
            return;
        }

        $query = self::find()
            ->where([
                'doctor_id' => $this->doctor_id,
                'day_of_week' => $this->day_of_week,
                'is_active' => true,
            ])
            ->andWhere(['<', 'start_time', $this->end_time])
            ->andWhere(['>', 'end_time', $this->start_time]);

        if (!$this->isNewRecord) {
            $query->andWhere(['!=', 'id', $this->id]);
        }

        if ($query->exists()) {
            $this->addError('start_time', 'Jadwal dokter bentrok dengan jadwal lain pada hari yang sama.');
        }
    }

    public function getDoctor(): ActiveQuery
    {
        return $this->hasOne(Doctor::class, ['id' => 'doctor_id']);
    }

    public function getPolyclinic(): ActiveQuery
    {
        return $this->hasOne(Polyclinic::class, ['id' => 'polyclinic_id']);
    }
}
