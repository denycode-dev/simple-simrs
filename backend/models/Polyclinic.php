<?php

declare(strict_types=1);

namespace app\models;

use Yii;
use yii\db\ActiveQuery;
use yii\db\ActiveRecord;

/**
 * Polyclinic model representing the 'polyclinics' table.
 *
 * @property int $id
 * @property string $code
 * @property string $name
 * @property string|null $description
 * @property bool $is_active
 * @property string $created_at
 *
 * @property DoctorSchedule[] $schedules
 */
class Polyclinic extends ActiveRecord
{
    public static function tableName(): string
    {
        return '{{%polyclinics}}';
    }

    public function rules(): array
    {
        return [
            [['code', 'name'], 'required', 'message' => '{attribute} wajib diisi.'],
            [['code'], 'unique', 'message' => 'Kode poliklinik sudah digunakan.'],
            [['code'], 'string', 'max' => 20],
            [['name'], 'string', 'max' => 100],
            [['description'], 'string'],
            [['is_active'], 'boolean'],
            [['is_active'], 'default', 'value' => true],
        ];
    }

    public function getSchedules(): ActiveQuery
    {
        return $this->hasMany(DoctorSchedule::class, ['polyclinic_id' => 'id']);
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
