<?php

declare(strict_types=1);

namespace app\models;

use Yii;
use yii\db\ActiveQuery;
use yii\db\ActiveRecord;

/**
 * Doctor model representing the 'doctors' table.
 *
 * @property int $id
 * @property int $user_id
 * @property string $nip
 * @property string $name
 * @property string $specialization
 * @property string $phone
 * @property string $sip_number
 * @property string $created_at
 *
 * @property User $user
 * @property DoctorSchedule[] $schedules
 */
class Doctor extends ActiveRecord
{
    /**
     * {@inheritdoc}
     */
    public static function tableName(): string
    {
        return '{{%doctors}}';
    }

    /**
     * {@inheritdoc}
     */
    public function rules(): array
    {
        return [
            [['user_id', 'nip', 'name', 'specialization', 'phone', 'sip_number'], 'required', 'message' => '{attribute} wajib diisi.'],
            [['user_id'], 'integer'],
            [['user_id'], 'exist', 'skipOnError' => true, 'targetClass' => User::class, 'targetAttribute' => ['user_id' => 'id']],
            [['nip', 'sip_number'], 'unique'],
            [['nip'], 'string', 'max' => 30],
            [['sip_number'], 'string', 'max' => 50],
            [['name', 'specialization'], 'string', 'max' => 100],
            [['phone'], 'string', 'max' => 20],
        ];
    }

    public function getUser(): ActiveQuery
    {
        return $this->hasOne(User::class, ['id' => 'user_id']);
    }

    public function getSchedules(): ActiveQuery
    {
        return $this->hasMany(DoctorSchedule::class, ['doctor_id' => 'id']);
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
