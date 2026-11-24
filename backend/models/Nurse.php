<?php

declare(strict_types=1);

namespace app\models;

use Yii;
use yii\db\ActiveQuery;
use yii\db\ActiveRecord;

/**
 * Nurse model representing the 'nurses' table.
 *
 * @property int $id
 * @property int $user_id
 * @property string $nip
 * @property string $name
 * @property string $phone
 * @property string $created_at
 *
 * @property User $user
 */
class Nurse extends ActiveRecord
{
    public static function tableName(): string
    {
        return '{{%nurses}}';
    }

    public function rules(): array
    {
        return [
            [['user_id', 'nip', 'name', 'phone'], 'required'],
            [['user_id'], 'integer'],
            [['nip'], 'unique'],
            [['nip'], 'string', 'max' => 30],
            [['name'], 'string', 'max' => 100],
            [['phone'], 'string', 'max' => 20],
        ];
    }

    public function getUser(): ActiveQuery
    {
        return $this->hasOne(User::class, ['id' => 'user_id']);
    }
}
