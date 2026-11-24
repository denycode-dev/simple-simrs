<?php

declare(strict_types=1);

namespace app\controllers\api;

use Yii;
use app\models\Patient;
use app\components\PatientMasker;
use app\models\AuditLog;
use yii\data\ActiveDataProvider;
use yii\filters\auth\HttpBearerAuth;

/**
 * PatientController provides REST API endpoints for managing patient master data.
 */
class PatientController extends BaseApiController
{
    /**
     * {@inheritdoc}
     */
    public function behaviors(): array
    {
        $behaviors = parent::behaviors();

        $behaviors['authenticator'] = [
            'class' => HttpBearerAuth::class,
            'except' => ['options'],
        ];

        return $behaviors;
    }

    /**
     * Lists all patients with search and pagination support.
     * Route: GET /api/v1/patients
     */
    public function actionIndex(): array
    {
        $search = Yii::$app->request->get('q', Yii::$app->request->get('search'));
        $query = Patient::find();

        if (!empty($search)) {
            $query->andFilterWhere([
                'or',
                ['ilike', 'name', $search],
                ['like', 'nik', $search],
                ['like', 'medical_record_number', $search],
            ]);
        }

        $pageSize = (int)Yii::$app->request->get('per-page', Yii::$app->request->get('limit', 20));
        $dataProvider = new ActiveDataProvider([
            'query' => $query->orderBy(['id' => SORT_DESC]),
            'pagination' => [
                'pageSize' => min(max($pageSize, 1), 100),
            ],
        ]);

        $models = array_map(function (Patient $p) {
            return PatientMasker::maskPatient($p, true);
        }, $dataProvider->getModels());

        return $this->successResponse(
            $models,
            'Data pasien berhasil dimuat.'
        );
    }

    /**
     * Displays a single patient detail.
     * Route: GET /api/v1/patients/{id}
     */
    public function actionView(int $id): array
    {
        $patient = Patient::findOne($id);
        if ($patient === null) {
            return $this->notFoundResponse('Data pasien tidak ditemukan.');
        }

        return $this->successResponse(PatientMasker::maskPatient($patient, true), 'Data pasien berhasil dimuat.');
    }

    /**
     * Registers a new patient.
     * Route: POST /api/v1/patients
     */
    public function actionCreate(): array
    {
        $patient = new Patient();
        $body = Yii::$app->request->getBodyParams();
        $patient->load($body, '');

        if (!$patient->validate()) {
            return $this->validationErrorResponse($patient->errors, 'Validasi data pasien gagal.');
        }

        if (!$patient->save()) {
            return $this->errorResponse('Gagal menyimpan data pasien ke database.', $patient->errors, 500);
        }

        return $this->successResponse($patient, 'Data pasien berhasil didaftarkan.', 201);
    }

    /**
     * Updates an existing patient record.
     * Route: PUT/PATCH /api/v1/patients/{id}
     */
    public function actionUpdate(int $id): array
    {
        $patient = Patient::findOne($id);
        if ($patient === null) {
            return $this->notFoundResponse('Data pasien tidak ditemukan.');
        }

        $body = Yii::$app->request->getBodyParams();
        $patient->load($body, '');

        if (!$patient->validate()) {
            return $this->validationErrorResponse($patient->errors, 'Validasi data pasien gagal.');
        }

        if (!$patient->save()) {
            return $this->errorResponse('Gagal memperbarui data pasien.', $patient->errors, 500);
        }

        return $this->successResponse($patient, 'Data pasien berhasil diperbarui.');
    }

    /**
     * Deletes an existing patient record.
     * Route: DELETE /api/v1/patients/{id}
     */
    public function actionDelete(int $id): array
    {
        $patient = Patient::findOne($id);
        if ($patient === null) {
            return $this->notFoundResponse('Data pasien tidak ditemukan.');
        }

        try {
            $patient->delete();
            return $this->successResponse(null, 'Data pasien berhasil dihapus.');
        } catch (\Throwable $e) {
            return $this->errorResponse('Pasien tidak dapat dihapus karena masih terkait dengan data rekam medis atau registrasi.', null, 422);
        }
    }
    /**
     * Unmasks patient sensitive data (NIK and phone) and logs the event to audit trail.
     * Route: POST /api/v1/patients/{id}/unmask
     */
    public function actionUnmask(int $id): array
    {
        $patient = Patient::findOne($id);
        if ($patient === null) {
            return $this->notFoundResponse('Data pasien tidak ditemukan.');
        }

        $body = Yii::$app->request->getBodyParams();
        $reason = $body['reason'] ?? 'Permintaan membuka data sensitif pasien';

        // Audit Trail log for UU PDP compliance
        AuditLog::log(
            'PATIENTS',
            'UNMASK_DATA',
            (string)$patient->id,
            [
                'reason' => $reason,
                'patient_name' => $patient->name,
                'medical_record_number' => $patient->medical_record_number,
            ],
            null,
            ['nik' => $patient->nik, 'phone' => $patient->phone]
        );

        return $this->successResponse(
            PatientMasker::maskPatient($patient, false),
            'Data NIK dan kontak pasien berhasil dibuka.'
        );
    }
}
