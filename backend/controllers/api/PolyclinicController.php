<?php

declare(strict_types=1);

namespace app\controllers\api;

use Yii;
use app\models\Polyclinic;
use yii\data\ActiveDataProvider;
use yii\filters\auth\HttpBearerAuth;

class PolyclinicController extends BaseApiController
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
        $query = Polyclinic::find();
        $activeOnly = Yii::$app->request->get('active_only');
        if ($activeOnly !== null) {
            $query->andWhere(['is_active' => filter_var($activeOnly, FILTER_VALIDATE_BOOLEAN)]);
        }

        $dataProvider = new ActiveDataProvider([
            'query' => $query->orderBy(['name' => SORT_ASC]),
            'pagination' => ['pageSize' => 50],
        ]);

        return $this->successResponse($dataProvider->getModels(), 'Data poliklinik berhasil dimuat.');
    }

    public function actionView(int $id): array
    {
        $poly = Polyclinic::find()->where(['id' => $id])->with(['schedules.doctor'])->one();
        if ($poly === null) {
            return $this->notFoundResponse('Data poliklinik tidak ditemukan.');
        }
        return $this->successResponse($poly, 'Data poliklinik berhasil dimuat.');
    }

    public function actionCreate(): array
    {
        $poly = new Polyclinic();
        $poly->load(Yii::$app->request->getBodyParams(), '');

        if (!$poly->validate()) {
            return $this->validationErrorResponse($poly->errors, 'Validasi data poliklinik gagal.');
        }

        if (!$poly->save()) {
            return $this->errorResponse('Gagal menyimpan data poliklinik.', $poly->errors, 500);
        }

        return $this->successResponse($poly, 'Data poliklinik berhasil ditambahkan.', 201);
    }

    public function actionUpdate(int $id): array
    {
        $poly = Polyclinic::findOne($id);
        if ($poly === null) {
            return $this->notFoundResponse('Data poliklinik tidak ditemukan.');
        }

        $poly->load(Yii::$app->request->getBodyParams(), '');
        if (!$poly->validate()) {
            return $this->validationErrorResponse($poly->errors, 'Validasi data poliklinik gagal.');
        }

        if (!$poly->save()) {
            return $this->errorResponse('Gagal memperbarui data poliklinik.', $poly->errors, 500);
        }

        return $this->successResponse($poly, 'Data poliklinik berhasil diperbarui.');
    }
}
