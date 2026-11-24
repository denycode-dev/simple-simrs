<?php

declare(strict_types=1);

namespace app\controllers\api;

use Yii;
use app\models\Doctor;
use yii\data\ActiveDataProvider;
use yii\filters\auth\HttpBearerAuth;

class DoctorController extends BaseApiController
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
        $query = Doctor::find()->with(['user']);
        $search = Yii::$app->request->get('q');
        if (!empty($search)) {
            $query->andFilterWhere([
                'or',
                ['ilike', 'name', $search],
                ['like', 'nip', $search],
                ['ilike', 'specialization', $search],
            ]);
        }

        $dataProvider = new ActiveDataProvider([
            'query' => $query->orderBy(['name' => SORT_ASC]),
            'pagination' => ['pageSize' => 50],
        ]);

        return $this->successResponse($dataProvider->getModels(), 'Data dokter berhasil dimuat.');
    }

    public function actionView(int $id): array
    {
        $doctor = Doctor::find()->where(['id' => $id])->with(['user', 'schedules.polyclinic'])->one();
        if ($doctor === null) {
            return $this->notFoundResponse('Data dokter tidak ditemukan.');
        }
        return $this->successResponse($doctor, 'Data dokter berhasil dimuat.');
    }

    public function actionCreate(): array
    {
        $doctor = new Doctor();
        $doctor->load(Yii::$app->request->getBodyParams(), '');

        if (!$doctor->validate()) {
            return $this->validationErrorResponse($doctor->errors, 'Validasi data dokter gagal.');
        }

        if (!$doctor->save()) {
            return $this->errorResponse('Gagal menyimpan data dokter.', $doctor->errors, 500);
        }

        return $this->successResponse($doctor, 'Data dokter berhasil ditambahkan.', 201);
    }

    public function actionUpdate(int $id): array
    {
        $doctor = Doctor::findOne($id);
        if ($doctor === null) {
            return $this->notFoundResponse('Data dokter tidak ditemukan.');
        }

        $doctor->load(Yii::$app->request->getBodyParams(), '');
        if (!$doctor->validate()) {
            return $this->validationErrorResponse($doctor->errors, 'Validasi data dokter gagal.');
        }

        if (!$doctor->save()) {
            return $this->errorResponse('Gagal memperbarui data dokter.', $doctor->errors, 500);
        }

        return $this->successResponse($doctor, 'Data dokter berhasil diperbarui.');
    }
}
