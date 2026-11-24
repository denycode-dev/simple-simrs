<?php

declare(strict_types=1);

namespace app\models;

use Yii;
use yii\db\ActiveRecord;

/**
 * MedicalAction model representing the 'medical_actions' table.
 *
 * @property int $id
 * @property string $code
 * @property string $name
 * @property string $category
 * @property float $tariff
 * @property bool $is_active
 */
class MedicalAction extends ActiveRecord
{
    public static function tableName(): string
    {
        return '{{%medical_actions}}';
    }

    public function rules(): array
    {
        return [
            [['code', 'name', 'category', 'tariff'], 'required', 'message' => '{attribute} wajib diisi.'],
            [['code'], 'unique', 'message' => 'Kode tindakan sudah digunakan.'],
            [['code'], 'string', 'max' => 20],
            [['name'], 'string', 'max' => 100],
            [['category'], 'string', 'max' => 50],
            [['tariff'], 'number', 'min' => 0, 'message' => 'Tarif tidak boleh bernilai negatif.'],
            [['is_active'], 'boolean'],
            [['is_active'], 'default', 'value' => true],
        ];
    }
}
