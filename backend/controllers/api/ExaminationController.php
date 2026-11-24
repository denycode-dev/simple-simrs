<?php

declare(strict_types=1);

namespace app\controllers\api;

use Yii;
use app\models\MedicalExamination;
use app\models\Registration;
use yii\data\ActiveDataProvider;
use yii\filters\auth\HttpBearerAuth;

class ExaminationController extends BaseApiController
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
        $query = MedicalExamination::find()->with([
            'doctor',
            'registration.patient',
            'registration.nurseAssessment',
        ]);

        $regId = Yii::$app->request->get('registration_id');
        if (!empty($regId)) {
            $query->andWhere(['registration_id' => (int)$regId]);
        }

        $doctorId = Yii::$app->request->get('doctor_id');
        if (!empty($doctorId)) {
            $query->andWhere(['doctor_id' => (int)$doctorId]);
        }

        $dataProvider = new ActiveDataProvider([
            'query' => $query->orderBy(['id' => SORT_DESC]),
            'pagination' => ['pageSize' => 50],
        ]);

        $items = array_map(function (MedicalExamination $exam) {
            return $this->formatExamData($exam);
        }, $dataProvider->getModels());

        return $this->successResponse($items, 'Data pemeriksaan RME berhasil dimuat.');
    }

    public function actionView(int $id): array
    {
        $exam = MedicalExamination::find()
            ->where(['id' => $id])
            ->with([
                'doctor',
                'registration.patient',
                'registration.nurseAssessment',
                'registration.billing',
            ])
            ->one();

        if ($exam === null) {
            return $this->notFoundResponse('Data pemeriksaan medis tidak ditemukan.');
        }

        return $this->successResponse($this->formatExamData($exam), 'Data pemeriksaan RME berhasil dimuat.');
    }

    private function formatExamData(MedicalExamination $exam): array
    {
        $data = $exam->toArray();
        if ($exam->doctor) {
            $data['doctor'] = $exam->doctor->toArray();
        }
        if ($exam->registration) {
            $regData = $exam->registration->toArray();
            if ($exam->registration->patient) {
                $regData['patient'] = $exam->registration->patient->toArray();
            }
            if ($exam->registration->nurseAssessment) {
                $regData['nurseAssessment'] = $exam->registration->nurseAssessment->toArray();
            }
            if ($exam->registration->billing) {
                $regData['billing'] = $exam->registration->billing->toArray();
            }
            $data['registration'] = $regData;
        }
        return $data;
    }

    public function actionCreate(): array
    {
        $exam = new MedicalExamination();
        $exam->load(Yii::$app->request->getBodyParams(), '');

        if (!$exam->validate()) {
            return $this->validationErrorResponse($exam->errors, 'Validasi pemeriksaan medis gagal.');
        }

        $transaction = Yii::$app->db->beginTransaction();
        try {
            if (!$exam->save()) {
                throw new \Exception('Gagal menyimpan rekam medis pemeriksaan dokter.');
            }

            // Update registration status to IN_DOCTOR if still WAITING_DOCTOR
            $reg = Registration::findOne($exam->registration_id);
            if ($reg !== null && in_array($reg->status, ['WAITING_NURSE', 'IN_NURSE', 'WAITING_DOCTOR'], true)) {
                $reg->status = 'IN_DOCTOR';
                $reg->save(false);
            }

            $transaction->commit();
            return $this->successResponse($exam, 'Pemeriksaan medis RME berhasil disimpan.', 201);
        } catch (\Throwable $e) {
            $transaction->rollBack();
            return $this->errorResponse($e->getMessage(), $exam->errors, 500);
        }
    }

    public function actionUpdate(int $id): array
    {
        $exam = MedicalExamination::findOne($id);
        if ($exam === null) {
            return $this->notFoundResponse('Data pemeriksaan medis tidak ditemukan.');
        }

        $exam->load(Yii::$app->request->getBodyParams(), '');
        if (!$exam->validate()) {
            return $this->validationErrorResponse($exam->errors, 'Validasi pemeriksaan medis gagal.');
        }

        if (!$exam->save()) {
            return $this->errorResponse('Gagal memperbarui pemeriksaan medis.', $exam->errors, 500);
        }

        return $this->successResponse($exam, 'Pemeriksaan medis RME berhasil diperbarui.');
    }
}
