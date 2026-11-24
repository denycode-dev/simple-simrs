<?php

declare(strict_types=1);

namespace app\controllers\api;

use Yii;
use app\models\Billing;
use app\models\MedicalExamination;
use app\models\Medicine;
use app\models\Prescription;
use app\models\PrescriptionItem;
use app\models\Registration;
use yii\data\ActiveDataProvider;
use yii\filters\AccessControl;
use yii\filters\auth\HttpBearerAuth;

class PharmacyController extends BaseApiController
{
    public function behaviors(): array
    {
        $behaviors = parent::behaviors();
        $behaviors['authenticator'] = [
            'class' => HttpBearerAuth::class,
            'except' => ['options'],
        ];

        $behaviors['access'] = [
            'class' => AccessControl::class,
            'rules' => [
                [
                    'allow' => true,
                    'actions' => ['options'],
                ],
                [
                    'allow' => true,
                    'actions' => ['create'],
                    'matchCallback' => function () {
                        $user = Yii::$app->user->identity;
                        return $user !== null && in_array($user->role, ['doctor', 'admin'], true);
                    },
                ],
                [
                    'allow' => true,
                    'actions' => ['dispense'],
                    'matchCallback' => function () {
                        $user = Yii::$app->user->identity;
                        return $user !== null && in_array($user->role, ['pharmacist', 'admin'], true);
                    },
                ],
                [
                    'allow' => true,
                    'actions' => ['index', 'view'],
                    'matchCallback' => function () {
                        return !Yii::$app->user->isGuest;
                    },
                ],
            ],
        ];

        return $behaviors;
    }

    public function actionIndex(): array
    {
        $query = Prescription::find()->with([
            'items.medicine',
            'examination.doctor',
            'registration.patient',
        ]);

        $status = Yii::$app->request->get('status');
        if (!empty($status)) {
            $query->andWhere(['status' => $status]);
        }

        $regId = Yii::$app->request->get('registration_id');
        if (!empty($regId)) {
            $query->andWhere(['registration_id' => (int)$regId]);
        }

        $examId = Yii::$app->request->get('examination_id');
        if (!empty($examId)) {
            $query->andWhere(['examination_id' => (int)$examId]);
        }

        $dataProvider = new ActiveDataProvider([
            'query' => $query->orderBy(['id' => SORT_DESC]),
            'pagination' => ['pageSize' => 50],
        ]);

        $items = array_map(function (Prescription $p) {
            return $this->formatPrescriptionData($p);
        }, $dataProvider->getModels());

        return $this->successResponse($items, 'Daftar resep farmasi berhasil dimuat.');
    }

    public function actionView(int $id): array
    {
        $prescription = Prescription::find()
            ->where(['id' => $id])
            ->with([
                'items.medicine',
                'examination.doctor',
                'registration.patient',
                'dispensedByUser',
            ])
            ->one();

        if ($prescription === null) {
            return $this->notFoundResponse('Data resep tidak ditemukan.');
        }

        return $this->successResponse($this->formatPrescriptionData($prescription), 'Data resep berhasil dimuat.');
    }

    public function actionCreate(): array
    {
        $body = Yii::$app->request->getBodyParams();
        $examId = $body['examination_id'] ?? null;
        $itemsData = $body['items'] ?? null;

        if (empty($examId)) {
            return $this->validationErrorResponse(['examination_id' => ['examination_id wajib diisi.']]);
        }

        if (!is_array($itemsData) || empty($itemsData)) {
            return $this->validationErrorResponse(['items' => ['Daftar obat dalam resep tidak boleh kosong.']]);
        }

        $exam = MedicalExamination::findOne((int)$examId);
        if ($exam === null) {
            return $this->notFoundResponse('Data pemeriksaan medis dokter tidak ditemukan.');
        }

        // Real-time stock pre-validation
        $medicines = [];
        foreach ($itemsData as $idx => $item) {
            $medId = (int)($item['medicine_id'] ?? 0);
            $qty = (int)($item['quantity'] ?? 0);

            if ($qty <= 0) {
                return $this->validationErrorResponse(["items.{$idx}.quantity" => ['Jumlah obat harus lebih dari 0.']]);
            }

            $medicine = Medicine::findOne($medId);
            if ($medicine === null) {
                return $this->notFoundResponse("Obat dengan ID {$medId} tidak ditemukan.");
            }

            if ($medicine->stock < $qty) {
                return $this->validationErrorResponse(
                    ["items.{$idx}.quantity" => ["Stok obat {$medicine->name} tidak mencukupi."]],
                    "Stok obat {$medicine->name} tidak mencukupi. (Sisa stok: {$medicine->stock}, diminta: {$qty})"
                );
            }

            $medicines[$idx] = $medicine;
        }

        $transaction = Yii::$app->db->beginTransaction();
        try {
            $prescription = new Prescription();
            $prescription->examination_id = $exam->id;
            $prescription->registration_id = $exam->registration_id;
            $prescription->prescription_number = Prescription::generatePrescriptionNumber();
            $prescription->status = 'PENDING';

            if (!$prescription->save()) {
                throw new \Exception('Gagal membuat header e-resep.');
            }

            foreach ($itemsData as $idx => $item) {
                $med = $medicines[$idx];
                $presItem = new PrescriptionItem();
                $presItem->prescription_id = $prescription->id;
                $presItem->medicine_id = $med->id;
                $presItem->quantity = (int)$item['quantity'];
                $presItem->dosage = $item['dosage'] ?? 'Sesuai indikasi';
                $presItem->frequency = $item['frequency'] ?? '3x1';
                $presItem->instructions = $item['instructions'] ?? null;
                $presItem->unit_price = (float)$med->unit_price;
                $presItem->subtotal = (float)$presItem->quantity * (float)$presItem->unit_price;

                if (!$presItem->save()) {
                    throw new \Exception('Gagal menyimpan rincian obat resep: ' . json_encode($presItem->errors));
                }
            }

            // Advance registration status to PHARMACY
            $reg = Registration::findOne($exam->registration_id);
            if ($reg !== null) {
                $reg->status = 'PHARMACY';
                $reg->save(false);
            }

            // Recalculate billing
            Billing::recalculate($exam->registration_id);

            $transaction->commit();

            // Reload prescription with items
            $reloaded = Prescription::find()->where(['id' => $prescription->id])->with('items.medicine')->one();
            return $this->successResponse($this->formatPrescriptionData($reloaded), 'e-Resep dokter berhasil dibuat.', 201);
        } catch (\Throwable $e) {
            $transaction->rollBack();
            return $this->errorResponse($e->getMessage(), null, 500);
        }
    }

    public function actionDispense(int $id): array
    {
        $prescription = Prescription::findOne($id);
        if ($prescription === null) {
            return $this->notFoundResponse('Data resep tidak ditemukan.');
        }

        if ($prescription->status !== 'PENDING') {
            return $this->validationErrorResponse(
                ['status' => ['Resep ini sudah pernah diserahkan/ditebus atau telah dibatalkan.']],
                'Resep ini tidak dalam status PENDING.'
            );
        }

        $items = PrescriptionItem::findAll(['prescription_id' => $prescription->id]);
        if (empty($items)) {
            return $this->validationErrorResponse(['items' => ['Resep tidak memiliki rincian obat.']]);
        }

        $transaction = Yii::$app->db->beginTransaction();
        try {
            $userId = Yii::$app->user->id ?? null;

            foreach ($items as $item) {
                // Row-level lock FOR UPDATE
                $sql = 'SELECT * FROM ' . Medicine::tableName() . ' WHERE id = :id FOR UPDATE';
                $medicine = Medicine::findBySql($sql, [':id' => $item->medicine_id])->one();

                if ($medicine === null) {
                    throw new \Exception("Data obat ID {$item->medicine_id} tidak ditemukan.");
                }

                if ($medicine->stock < $item->quantity) {
                    throw new \Exception("Stok obat {$medicine->name} tidak mencukupi saat proses dispensing. (Sisa: {$medicine->stock}, diminta: {$item->quantity})");
                }

                // Adjust stock atomically with stock log
                $medicine->adjustStock(
                    'OUT',
                    (int)$item->quantity,
                    "Penyerahan obat resep {$prescription->prescription_number}",
                    'PRESCRIPTION',
                    (int)$prescription->id
                );
            }

            $prescription->status = 'DISPENSED';
            $prescription->dispensed_at = date('Y-m-d H:i:s');
            $prescription->dispensed_by = $userId ? (int)$userId : null;
            if (!$prescription->save(false)) {
                throw new \Exception('Gagal memperbarui status resep menjadi DISPENSED.');
            }

            // Recalculate billing
            Billing::recalculate($prescription->registration_id);

            // Advance registration status to BILLING
            $reg = Registration::findOne($prescription->registration_id);
            if ($reg !== null) {
                $reg->status = 'BILLING';
                $reg->save(false);
            }

            $transaction->commit();

            $reloaded = Prescription::find()->where(['id' => $prescription->id])->with('items.medicine')->one();
            return $this->successResponse($this->formatPrescriptionData($reloaded), 'Obat berhasil diserahkan dan stok obat telah diperbarui.');
        } catch (\Throwable $e) {
            $transaction->rollBack();
            return $this->errorResponse($e->getMessage(), null, 422);
        }
    }

    private function formatPrescriptionData(Prescription $p): array
    {
        $data = $p->toArray();
        if (!empty($p->items)) {
            $data['items'] = array_map(function (PrescriptionItem $item) {
                $res = $item->toArray();
                if ($item->medicine) {
                    $res['medicine'] = $item->medicine->toArray();
                }
                return $res;
            }, $p->items);
        } else {
            $data['items'] = [];
        }

        if ($p->examination) {
            $data['examination'] = $p->examination->toArray();
        }
        if ($p->registration) {
            $data['registration'] = $p->registration->toArray();
        }
        return $data;
    }
}
