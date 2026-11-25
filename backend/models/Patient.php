<?php

declare(strict_types=1);

namespace app\models;

use Yii;
use app\behaviors\AuditTrailBehavior;
use yii\db\ActiveRecord;

/**
 * Patient model representing the 'patients' table.
 *
 * @property int $id
 * @property string $medical_record_number
 * @property string $nik
 * @property string $name
 * @property string $birth_date
 * @property string $gender
 * @property string $address
 * @property string $phone
 * @property string|null $bpjs_number
 * @property string $created_at
 * @property string $updated_at
 */
class Patient extends ActiveRecord
{
    /**
     * {@inheritdoc}
     */
    public static function tableName(): string
    {
        return '{{%patients}}';
    }

    public function behaviors(): array
    {
        return [
            'auditTrail' => [
                'class' => AuditTrailBehavior::class,
                'module' => 'PATIENT',
            ],
        ];
    }

    /**
     * {@inheritdoc}
     */
    public function rules(): array
    {
        return [
            [['name', 'nik', 'birth_date', 'gender', 'address', 'phone'], 'required', 'message' => '{attribute} wajib diisi.'],
            [['nik'], 'string', 'length' => 16, 'message' => 'Nomor Induk Kependudukan (NIK) harus terdiri dari 16 digit angka.'],
            [['nik'], 'match', 'pattern' => '/^\d{16}$/', 'message' => 'Nomor Induk Kependudukan (NIK) harus terdiri dari 16 digit angka.'],
            [['nik'], 'unique', 'message' => 'NIK sudah terdaftar dalam sistem.'],
            [['medical_record_number'], 'unique', 'message' => 'Nomor Rekam Medis sudah digunakan.'],
            [['medical_record_number'], 'string', 'max' => 20],
            [['name'], 'string', 'max' => 100],
            [['birth_date'], 'date', 'format' => 'php:Y-m-d', 'message' => 'Format tanggal lahir tidak valid (YYYY-MM-DD).'],
            [['gender'], 'in', 'range' => ['L', 'P'], 'message' => 'Jenis kelamin harus L (Laki-laki) atau P (Perempuan).'],
            [['address'], 'string'],
            [['phone', 'bpjs_number'], 'string', 'max' => 20],
            [['bpjs_number'], 'default', 'value' => null],
        ];
    }

    /**
     * {@inheritdoc}
     */
    public function attributeLabels(): array
    {
        return [
            'id' => 'ID Pasien',
            'medical_record_number' => 'No. Rekam Medis',
            'nik' => 'NIK',
            'name' => 'Nama Pasien',
            'birth_date' => 'Tanggal Lahir',
            'gender' => 'Jenis Kelamin',
            'address' => 'Alamat',
            'phone' => 'No. Telepon',
            'bpjs_number' => 'No. Kartu BPJS',
            'created_at' => 'Waktu Dibuat',
            'updated_at' => 'Waktu Diperbarui',
        ];
    }

    /**
     * Auto-generate Medical Record Number in format RM-YYYYMM-XXXXX
     */
    public static function generateMedicalRecordNumber(): string
    {
        $prefix = 'RM-' . date('Ym') . '-';
        
        $lastPatient = self::find()
            ->where(['like', 'medical_record_number', $prefix . '%', false])
            ->orderBy(['medical_record_number' => SORT_DESC])
            ->one();

        $nextNumber = 1;
        if ($lastPatient !== null && preg_match('/-(\d{5})$/', $lastPatient->medical_record_number, $matches)) {
            $nextNumber = (int)$matches[1] + 1;
        }

        return $prefix . sprintf('%05d', $nextNumber);
    }

    /**
     * {@inheritdoc}
     */
    public function beforeSave($insert): bool
    {
        if (!parent::beforeSave($insert)) {
            return false;
        }

        $now = date('Y-m-d H:i:s');
        if ($insert) {
            if (empty($this->medical_record_number)) {
                $this->medical_record_number = self::generateMedicalRecordNumber();
            }
            if (empty($this->created_at)) {
                $this->created_at = $now;
            }
        }

        $this->updated_at = $now;
        return true;
    }
}
