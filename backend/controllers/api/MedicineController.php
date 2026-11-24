<?php

declare(strict_types=1);

namespace app\controllers\api;

use Yii;
use app\models\Medicine;
use yii\data\ActiveDataProvider;
use yii\filters\auth\HttpBearerAuth;

class MedicineController extends BaseApiController
{
    public function behaviors(): array
    {
        $behaviors = parent::behaviors();
        $behaviors['authenticator'] = [
            'class' => HttpBearerAuth::class,
            'except' => ['options'],
        ];
        return $behaviors;
    }

    public function actionIndex(): array
    {
        $query = Medicine::find();
        $search = Yii::$app->request->get('q');
        if (!empty($search)) {
            $query->andFilterWhere([
                'or',
                ['ilike', 'name', $search],
                ['like', 'code', $search],
                ['ilike', 'category', $search],
            ]);
        }

        $activeOnly = Yii::$app->request->get('active_only');
        if ($activeOnly !== null) {
            $query->andWhere(['is_active' => filter_var($activeOnly, FILTER_VALIDATE_BOOLEAN)]);
        }

        $dataProvider = new ActiveDataProvider([
            'query' => $query->orderBy(['name' => SORT_ASC]),
            'pagination' => ['pageSize' => 50],
        ]);

        return $this->successResponse($dataProvider->getModels(), 'Data obat berhasil dimuat.');
    }

    public function actionView(int $id): array
    {
        $medicine = Medicine::find()->where(['id' => $id])->with(['stockLogs'])->one();
        if ($medicine === null) {
            return $this->notFoundResponse('Data obat tidak ditemukan.');
        }
        return $this->successResponse($medicine, 'Data obat berhasil dimuat.');
    }

    public function actionCreate(): array
    {
        $medicine = new Medicine();
        $medicine->load(Yii::$app->request->getBodyParams(), '');

        if (!$medicine->validate()) {
            return $this->validationErrorResponse($medicine->errors, 'Validasi data obat gagal.');
        }

        if (!$medicine->save()) {
            return $this->errorResponse('Gagal menyimpan data obat.', $medicine->errors, 500);
        }

        return $this->successResponse($medicine, 'Data obat berhasil ditambahkan.', 201);
    }

    public function actionUpdate(int $id): array
    {
        $medicine = Medicine::findOne($id);
        if ($medicine === null) {
            return $this->notFoundResponse('Data obat tidak ditemukan.');
        }

        $medicine->load(Yii::$app->request->getBodyParams(), '');
        if (!$medicine->validate()) {
            return $this->validationErrorResponse($medicine->errors, 'Validasi data obat gagal.');
        }

        if (!$medicine->save()) {
            return $this->errorResponse('Gagal memperbarui data obat.', $medicine->errors, 500);
        }

        return $this->successResponse($medicine, 'Data obat berhasil diperbarui.');
    }

    public function actionAdjustStock(int $id): array
    {
        $medicine = Medicine::findOne($id);
        if ($medicine === null) {
            return $this->notFoundResponse('Data obat tidak ditemukan.');
        }

        $body = Yii::$app->request->getBodyParams();
        $type = strtoupper((string)($body['transaction_type'] ?? ''));
        $qty = (int)($body['quantity'] ?? 0);
        $notes = (string)($body['notes'] ?? '');

        if (!in_array($type, ['IN', 'OUT', 'ADJUSTMENT'], true)) {
            return $this->validationErrorResponse([
                'transaction_type' => ['Jenis transaksi harus IN, OUT, atau ADJUSTMENT.']
            ], 'Validasi penyesuaian stok gagal.');
        }

        if ($qty <= 0 && $type !== 'ADJUSTMENT') {
            return $this->validationErrorResponse([
                'quantity' => ['Jumlah kuantitas harus lebih besar dari 0.']
            ], 'Validasi penyesuaian stok gagal.');
        }

        try {
            $log = $medicine->adjustStock($type, $qty, $notes);
            return $this->successResponse([
                'medicine' => $medicine,
                'log' => $log,
            ], 'Penyesuaian stok obat berhasil disimpan.');
        } catch (\Throwable $e) {
            return $this->errorResponse($e->getMessage(), null, 422);
        }
    }
}
