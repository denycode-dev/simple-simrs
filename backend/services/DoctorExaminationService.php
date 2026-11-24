<?php

declare(strict_types=1);

namespace app\services;

use Yii;
use app\models\Billing;
use app\models\ExaminationAction;
use app\models\MedicalAction;
use app\models\MedicalExamination;
use app\models\Medicine;
use app\models\Prescription;
use app\models\PrescriptionItem;
use app\models\Registration;

/**
 * DoctorExaminationService orchestrates atomic creation of a doctor's medical examination
 * along with optional medical actions, e-prescription items, registration status transition,
 * and single-pass billing recalculation.
 */
class DoctorExaminationService
{
    /**
     * Allowed registration status transitions from the doctor examination endpoint.
     *
     * @var string[]
     */
    public const ALLOWED_NEXT_STATUSES = ['IN_DOCTOR', 'PHARMACY', 'BILLING'];

    /**
     * Creates a medical examination and optionally persists associated medical actions
     * and e-prescription items within a single ACID database transaction.
     *
     * @param array<string, mixed> $payload
     * @return array{
     *     success: bool,
     *     statusCode: int,
     *     message: string,
     *     errors: array<string, mixed>|null,
     *     examination: MedicalExamination|null
     * }
     */
    public function create(array $payload): array
    {
        $exam = new MedicalExamination();
        $exam->load($this->extractExaminationAttributes($payload), '');
        $exam->validate();

        /** @var array<string, string[]> $errors */
        $errors = $exam->getErrors();

        $validatedActions = $this->validateActions($payload, $errors);
        $stockErrorMessage = null;
        $validatedPrescriptionItems = $this->validatePrescriptionItems($payload, $errors, $stockErrorMessage);
        $nextStatus = $this->validateNextStatus($payload, !empty($validatedPrescriptionItems), $errors);

        if (!empty($errors)) {
            $summaryMessage = $stockErrorMessage ?? 'Validasi pemeriksaan medis gagal.';
            return [
                'success' => false,
                'statusCode' => 422,
                'message' => $summaryMessage,
                'errors' => $errors,
                'examination' => null,
            ];
        }

        $transaction = Yii::$app->db->beginTransaction();
        try {
            if (!$exam->save()) {
                throw new \RuntimeException('Gagal menyimpan rekam medis pemeriksaan dokter.');
            }

            foreach ($validatedActions as $actionEntry) {
                /** @var MedicalAction $medAction */
                $medAction = $actionEntry['model'];

                $examAction = new ExaminationAction();
                $examAction->skipBillingRecalculate = true;
                $examAction->examination_id = (int)$exam->id;
                $examAction->action_id = (int)$medAction->id;
                $examAction->tariff = (float)$medAction->tariff;
                $examAction->notes = $actionEntry['notes'];

                if (!$examAction->save()) {
                    throw new \RuntimeException(
                        'Gagal menyimpan tindakan medis pemeriksaan: ' . json_encode($examAction->errors)
                    );
                }
            }

            $hasPrescription = !empty($validatedPrescriptionItems);
            if ($hasPrescription) {
                $prescription = new Prescription();
                $prescription->examination_id = (int)$exam->id;
                $prescription->registration_id = (int)$exam->registration_id;
                $prescription->prescription_number = Prescription::generatePrescriptionNumber();
                $prescription->status = 'PENDING';

                if (!$prescription->save()) {
                    throw new \RuntimeException(
                        'Gagal membuat header e-resep: ' . json_encode($prescription->errors)
                    );
                }

                foreach ($validatedPrescriptionItems as $itemEntry) {
                    /** @var Medicine $medicine */
                    $medicine = $itemEntry['medicine'];
                    $qty = $itemEntry['quantity'];

                    $presItem = new PrescriptionItem();
                    $presItem->prescription_id = (int)$prescription->id;
                    $presItem->medicine_id = (int)$medicine->id;
                    $presItem->quantity = $qty;
                    $presItem->dosage = $itemEntry['dosage'];
                    $presItem->frequency = $itemEntry['frequency'];
                    $presItem->instructions = $itemEntry['instructions'];
                    $presItem->unit_price = (float)$medicine->unit_price;
                    $presItem->subtotal = (float)$qty * (float)$medicine->unit_price;

                    if (!$presItem->save()) {
                        throw new \RuntimeException(
                            'Gagal menyimpan rincian obat resep: ' . json_encode($presItem->errors)
                        );
                    }
                }
            }

            $reg = Registration::findOne((int)$exam->registration_id);
            if ($reg !== null) {
                if ($nextStatus !== null) {
                    $reg->status = $nextStatus;
                    $reg->save(false);
                } elseif ($hasPrescription) {
                    $reg->status = 'PHARMACY';
                    $reg->save(false);
                } elseif (in_array($reg->status, ['WAITING_NURSE', 'IN_NURSE', 'WAITING_DOCTOR'], true)) {
                    $reg->status = 'IN_DOCTOR';
                    $reg->save(false);
                }
            }

            if (!empty($validatedActions) || $hasPrescription) {
                Billing::recalculate((int)$exam->registration_id);
            }

            $transaction->commit();

            /** @var MedicalExamination|null $reloaded */
            $reloaded = MedicalExamination::find()
                ->where(['id' => $exam->id])
                ->with([
                    'doctor',
                    'registration.patient',
                    'registration.nurseAssessment',
                    'registration.billing',
                    'actions.action',
                    'prescriptions.items.medicine',
                ])
                ->one();

            return [
                'success' => true,
                'statusCode' => 201,
                'message' => 'Pemeriksaan medis RME berhasil disimpan.',
                'errors' => null,
                'examination' => $reloaded ?? $exam,
            ];
        } catch (\Throwable $e) {
            $transaction->rollBack();
            return [
                'success' => false,
                'statusCode' => 500,
                'message' => $e->getMessage(),
                'errors' => null,
                'examination' => null,
            ];
        }
    }

    /**
     * Extracts only allowlisted MedicalExamination attributes from the raw request payload.
     *
     * @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    private function extractExaminationAttributes(array $payload): array
    {
        $allowed = [
            'registration_id',
            'doctor_id',
            'physical_exam',
            'primary_diagnosis_code',
            'primary_diagnosis_desc',
            'secondary_diagnosis',
            'doctor_notes',
        ];

        $result = [];
        foreach ($allowed as $key) {
            if (array_key_exists($key, $payload)) {
                $result[$key] = $payload[$key];
            }
        }

        return $result;
    }

    /**
     * Validates optional 'actions' list and resolves master MedicalAction records.
     *
     * @param array<string, mixed> $payload
     * @param array<string, string[]> $errors
     * @return array<int, array{model: MedicalAction, notes: string|null}>
     */
    private function validateActions(array $payload, array &$errors): array
    {
        if (!array_key_exists('actions', $payload) || $payload['actions'] === null) {
            return [];
        }

        $actionsData = $payload['actions'];
        if (!is_array($actionsData) || (!empty($actionsData) && !array_is_list($actionsData))) {
            $errors['actions'][] = 'Daftar tindakan medis harus berupa array.';
            return [];
        }

        /** @var array<int, MedicalAction|null> $actionCache */
        $actionCache = [];
        $validated = [];

        foreach ($actionsData as $idx => $item) {
            if (!is_array($item)) {
                $errors["actions.{$idx}"][] = 'Format item tindakan medis tidak valid.';
                continue;
            }

            $rawActionId = $item['action_id'] ?? null;
            $actionId = filter_var($rawActionId, FILTER_VALIDATE_INT);
            if ($actionId === false || $actionId <= 0) {
                $errors["actions.{$idx}.action_id"][] = 'action_id wajib berupa angka bulat positif.';
                continue;
            }

            if (!array_key_exists($actionId, $actionCache)) {
                $actionCache[$actionId] = MedicalAction::findOne($actionId);
            }

            $medAction = $actionCache[$actionId];
            if ($medAction === null) {
                $errors["actions.{$idx}.action_id"][] = "Data tindakan medis master dengan ID {$actionId} tidak ditemukan.";
                continue;
            }

            $notes = $item['notes'] ?? null;
            if ($notes !== null && !is_string($notes)) {
                $errors["actions.{$idx}.notes"][] = 'Catatan tindakan medis harus berupa teks.';
                continue;
            }

            $validated[] = [
                'model' => $medAction,
                'notes' => $notes,
            ];
        }

        return $validated;
    }

    /**
     * Validates optional 'prescription_items' list and checks aggregated real-time medicine stock.
     *
     * @param array<string, mixed> $payload
     * @param array<string, string[]> $errors
     * @return array<int, array{
     *     medicine: Medicine,
     *     quantity: int,
     *     dosage: string,
     *     frequency: string,
     *     instructions: string|null
     * }>
     */
    private function validatePrescriptionItems(
        array $payload,
        array &$errors,
        ?string &$stockErrorMessage
    ): array {
        if (!array_key_exists('prescription_items', $payload) || $payload['prescription_items'] === null) {
            return [];
        }

        $itemsData = $payload['prescription_items'];
        if (!is_array($itemsData) || (!empty($itemsData) && !array_is_list($itemsData))) {
            $errors['prescription_items'][] = 'Daftar obat dalam resep harus berupa array.';
            return [];
        }

        /** @var array<int, Medicine|null> $medicineCache */
        $medicineCache = [];
        /** @var array<int, int> $aggregatedQty */
        $aggregatedQty = [];
        /** @var array<int, int[]> $medicineItemIndices */
        $medicineItemIndices = [];
        $validated = [];

        foreach ($itemsData as $idx => $item) {
            if (!is_array($item)) {
                $errors["prescription_items.{$idx}"][] = 'Format item obat resep tidak valid.';
                continue;
            }

            $rawMedId = $item['medicine_id'] ?? null;
            $medId = filter_var($rawMedId, FILTER_VALIDATE_INT);
            $rawQty = $item['quantity'] ?? null;
            $qty = filter_var($rawQty, FILTER_VALIDATE_INT);

            $rowValid = true;
            if ($medId === false || $medId <= 0) {
                $errors["prescription_items.{$idx}.medicine_id"][] = 'medicine_id wajib berupa angka bulat positif.';
                $rowValid = false;
            }

            if ($qty === false || $qty <= 0) {
                $errors["prescription_items.{$idx}.quantity"][] = 'Jumlah obat harus lebih dari 0.';
                $rowValid = false;
            }

            $dosage = array_key_exists('dosage', $item) && $item['dosage'] !== null && $item['dosage'] !== ''
                ? $item['dosage']
                : 'Sesuai indikasi';
            if (!is_string($dosage) || mb_strlen($dosage) > 50) {
                $errors["prescription_items.{$idx}.dosage"][] = 'Dosis harus berupa teks maksimal 50 karakter.';
                $rowValid = false;
            }

            $frequency = array_key_exists('frequency', $item) && $item['frequency'] !== null && $item['frequency'] !== ''
                ? $item['frequency']
                : '3x1';
            if (!is_string($frequency) || mb_strlen($frequency) > 50) {
                $errors["prescription_items.{$idx}.frequency"][] = 'Frekuensi harus berupa teks maksimal 50 karakter.';
                $rowValid = false;
            }

            $instructions = $item['instructions'] ?? null;
            if ($instructions !== null && (!is_string($instructions) || mb_strlen($instructions) > 255)) {
                $errors["prescription_items.{$idx}.instructions"][] = 'Instruksi harus berupa teks maksimal 255 karakter.';
                $rowValid = false;
            }

            if (!$rowValid) {
                continue;
            }

            /** @var int $medId */
            /** @var int $qty */
            /** @var string $dosage */
            /** @var string $frequency */
            /** @var string|null $instructions */
            if (!array_key_exists($medId, $medicineCache)) {
                $medicineCache[$medId] = Medicine::findOne($medId);
            }

            $medicine = $medicineCache[$medId];
            if ($medicine === null) {
                $errors["prescription_items.{$idx}.medicine_id"][] = "Obat dengan ID {$medId} tidak ditemukan.";
                continue;
            }

            $aggregatedQty[$medId] = ($aggregatedQty[$medId] ?? 0) + $qty;
            $medicineItemIndices[$medId][] = $idx;

            $validated[] = [
                'medicine' => $medicine,
                'quantity' => $qty,
                'dosage' => $dosage,
                'frequency' => $frequency,
                'instructions' => $instructions,
            ];
        }

        // Real-time stock pre-validation across aggregated quantities per medicine_id
        foreach ($aggregatedQty as $medId => $totalRequested) {
            $medicine = $medicineCache[$medId];
            if ($medicine !== null && $medicine->stock < $totalRequested) {
                $msg = "Stok obat {$medicine->name} tidak mencukupi. (Sisa stok: {$medicine->stock}, diminta: {$totalRequested})";
                if ($stockErrorMessage === null) {
                    $stockErrorMessage = $msg;
                }
                foreach ($medicineItemIndices[$medId] as $itemIdx) {
                    $errors["prescription_items.{$itemIdx}.quantity"][] = "Stok obat {$medicine->name} tidak mencukupi.";
                }
            }
        }

        return $validated;
    }

    /**
     * Validates optional 'next_status' transition and clinical consistency with prescriptions.
     *
     * @param array<string, mixed> $payload
     * @param array<string, string[]> $errors
     */
    private function validateNextStatus(array $payload, bool $hasPrescriptionItems, array &$errors): ?string
    {
        if (!array_key_exists('next_status', $payload) || $payload['next_status'] === null || $payload['next_status'] === '') {
            return null;
        }

        if (!is_string($payload['next_status'])) {
            $errors['next_status'][] = 'Status tujuan tidak valid.';
            return null;
        }

        $normalized = strtoupper(trim($payload['next_status']));
        if (!in_array($normalized, self::ALLOWED_NEXT_STATUSES, true)) {
            $errors['next_status'][] = 'Status tujuan tidak valid. Pilihan yang diizinkan: IN_DOCTOR, PHARMACY, atau BILLING.';
            return null;
        }

        if ($hasPrescriptionItems && $normalized === 'BILLING') {
            $errors['next_status'][] = 'Status tujuan tidak boleh BILLING jika terdapat resep obat. Gunakan PHARMACY atau IN_DOCTOR.';
            return null;
        }

        return $normalized;
    }
}
