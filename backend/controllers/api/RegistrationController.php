<?php

declare(strict_types=1);

namespace app\controllers\api;

use Yii;
use app\models\Registration;
use yii\data\ActiveDataProvider;
use yii\filters\auth\HttpBearerAuth;

class RegistrationController extends BaseApiController
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
        $query = Registration::find()->with(['patient', 'polyclinic', 'doctor', 'schedule', 'billing']);

        $date = Yii::$app->request->get('date');
        if (!empty($date)) {
            $query->andWhere(['registration_date' => $date]);
        }

        $polyId = Yii::$app->request->get('polyclinic_id');
        if (!empty($polyId)) {
            $query->andWhere(['polyclinic_id' => (int)$polyId]);
        }

        $doctorId = Yii::$app->request->get('doctor_id');
        if (!empty($doctorId)) {
            $query->andWhere(['doctor_id' => (int)$doctorId]);
        }

        $status = Yii::$app->request->get('status');
        if (!empty($status)) {
            $query->andWhere(['status' => $status]);
        }

        $dataProvider = new ActiveDataProvider([
            'query' => $query->orderBy(['id' => SORT_DESC]),
            'pagination' => ['pageSize' => 50],
        ]);

        return $this->successResponse($dataProvider->getModels(), 'Data pendaftaran berhasil dimuat.');
    }

    public function actionView(int $id): array
    {
        $registration = Registration::find()
            ->where(['id' => $id])
            ->with(['patient', 'polyclinic', 'doctor', 'schedule', 'nurseAssessment', 'medicalExamination', 'billing'])
            ->one();

        if ($registration === null) {
            return $this->notFoundResponse('Data pendaftaran kunjungan tidak ditemukan.');
        }

        return $this->successResponse($registration, 'Data pendaftaran berhasil dimuat.');
    }

    public function actionCreate(): array
    {
        $registration = new Registration();
        $registration->load(Yii::$app->request->getBodyParams(), '');

        if (!$registration->validate()) {
            return $this->validationErrorResponse($registration->errors, 'Validasi data pendaftaran gagal.');
        }

        if (!$registration->save()) {
            return $this->errorResponse('Gagal menyimpan pendaftaran pasien.', $registration->errors, 500);
        }

        return $this->successResponse($registration, 'Pendaftaran kunjungan berhasil dibuat.', 201);
    }

    public function actionUpdateStatus(int $id): array
    {
        $registration = Registration::findOne($id);
        if ($registration === null) {
            return $this->notFoundResponse('Data pendaftaran tidak ditemukan.');
        }

        $body = Yii::$app->request->getBodyParams();
        $newStatus = strtoupper((string)($body['status'] ?? ''));

        $validStatuses = [
            'WAITING_NURSE', 'IN_NURSE', 'WAITING_DOCTOR', 'IN_DOCTOR',
            'PHARMACY', 'BILLING', 'COMPLETED', 'CANCELLED'
        ];

        if (!in_array($newStatus, $validStatuses, true)) {
            return $this->validationErrorResponse([
                'status' => ['Status antrean tidak valid.']
            ], 'Validasi status antrean gagal.');
        }

        $registration->status = $newStatus;
        if (!$registration->save(false)) {
            return $this->errorResponse('Gagal memperbarui status antrean pasien.', $registration->errors, 500);
        }

        return $this->successResponse($registration, 'Status antrean pasien berhasil diperbarui.');
    }
}
