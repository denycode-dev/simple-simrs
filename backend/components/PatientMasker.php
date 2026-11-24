<?php

declare(strict_types=1);

namespace app\components;

use app\models\Patient;

/**
 * PatientMasker handles data masking for compliance with UU No. 27 Tahun 2022 (UU PDP).
 */
class PatientMasker
{
    /**
     * Masks NIK keeping first 6 digits visible, masking the rest with asterisks.
     * Example: 3201010101900001 -> 320101********** (16 chars)
     */
    public static function maskNik(?string $nik): ?string
    {
        if (empty($nik)) {
            return $nik;
        }

        $length = strlen($nik);
        if ($length <= 6) {
            return $nik;
        }

        return substr($nik, 0, 6) . str_repeat('*', $length - 6);
    }

    /**
     * Masks Phone number keeping first 4 digits and last 4 digits visible.
     * Example: 081234567890 -> 0812****7890
     */
    public static function maskPhone(?string $phone): ?string
    {
        if (empty($phone)) {
            return $phone;
        }

        $length = strlen($phone);
        if ($length <= 8) {
            return $phone;
        }

        $visibleStart = 4;
        $visibleEnd = 4;
        $maskedLength = $length - $visibleStart - $visibleEnd;

        return substr($phone, 0, $visibleStart) . str_repeat('*', $maskedLength) . substr($phone, -$visibleEnd);
    }

    /**
     * Formats patient model/array with masking flag.
     */
    public static function maskPatient(Patient|array $patient, bool $masked = true): array
    {
        $data = $patient instanceof Patient ? $patient->toArray() : $patient;

        if ($masked) {
            if (isset($data['nik'])) {
                $data['nik'] = self::maskNik((string)$data['nik']);
            }
            if (isset($data['phone'])) {
                $data['phone'] = self::maskPhone((string)$data['phone']);
            }
            $data['is_masked'] = true;
        } else {
            $data['is_masked'] = false;
        }

        return $data;
    }
}
