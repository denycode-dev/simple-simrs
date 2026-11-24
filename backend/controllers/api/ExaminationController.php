<?php

declare(strict_types=1);

namespace app\controllers\api;

use Yii;
use app\models\MedicalExamination;
use app\models\ExaminationAction;
use app\models\MedicalAction;
use app\models\Billing;
use app\models\Registration;
use yii\data\ActiveDataProvider;
use yii\filters\AccessControl;
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

        $behaviors['access'] = [
            'class' => AccessControl::class,
            'rules' => [
                [
                    'allow' => true,
                    'actions' => ['options'],
                ],
                [
                    'allow' => true,
                    'actions' => ['create', 'update', 'add-action', 'remove-action'],
                    'matchCallback' => function () {
                        $user = Yii::$app->user->identity;
                        return $user !== null && in_array($user->role, ['doctor', 'admin'], true);
                    },
                ],
                [
                    'allow' => true,
                    'actions' => ['index', 'view', 'get-actions'],
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
                'actions.action',
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
        if (!empty($exam->actions)) {
            $data['actions'] = array_map(function (ExaminationAction $a) {
                $item = $a->toArray();
                if ($a->action) {
                    $item['action'] = $a->action->toArray();
                }
                return $item;
            }, $exam->actions);
        } else {
            $data['actions'] = [];
        }

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
    public function actionAddAction(int $id): array
    {
        $exam = MedicalExamination::findOne($id);
        if ($exam === null) {
            return $this->notFoundResponse('Data pemeriksaan medis tidak ditemukan.');
        }

        $body = Yii::$app->request->getBodyParams();
        $actionId = $body['action_id'] ?? null;
        if (empty($actionId)) {
            return $this->validationErrorResponse(['action_id' => ['action_id wajib diisi.']]);
        }

        $medAction = MedicalAction::findOne((int)$actionId);
        if ($medAction === null) {
            return $this->notFoundResponse('Data tindakan medis master tidak ditemukan.');
        }

        $examAction = new ExaminationAction();
        $examAction->examination_id = $exam->id;
        $examAction->action_id = (int)$actionId;
        $examAction->tariff = (float)$medAction->tariff;
        $examAction->notes = $body['notes'] ?? null;

        if (!$examAction->validate()) {
            return $this->validationErrorResponse($examAction->errors, 'Validasi penambahan tindakan medis gagal.');
        }

        if (!$examAction->save()) {
            return $this->errorResponse('Gagal menyimpan tindakan medis pemeriksaan.', $examAction->errors, 500);
        }

        return $this->successResponse($examAction, 'Tindakan medis berhasil ditambahkan.', 201);
    }

    public function actionGetActions(int $id): array
    {
        $exam = MedicalExamination::findOne($id);
        if ($exam === null) {
            return $this->notFoundResponse('Data pemeriksaan medis tidak ditemukan.');
        }

        $actions = ExaminationAction::find()
            ->where(['examination_id' => $id])
            ->with('action')
            ->orderBy(['id' => SORT_ASC])
            ->all();

        $data = array_map(function (ExaminationAction $a) {
            $item = $a->toArray();
            if ($a->action) {
                $item['action'] = $a->action->toArray();
            }
            return $item;
        }, $actions);

        return $this->successResponse($data, 'Data rincian tindakan medis berhasil dimuat.');
    }

    public function actionRemoveAction(int $id, int $actionId): array
    {
        $examAction = ExaminationAction::findOne(['id' => $actionId, 'examination_id' => $id]);
        if ($examAction === null) {
            return $this->notFoundResponse('Data rincian tindakan medis tidak ditemukan.');
        }

        if (!$examAction->delete()) {
            return $this->errorResponse('Gagal menghapus tindakan medis pemeriksaan.', null, 500);
        }

        return $this->successResponse(null, 'Tindakan medis berhasil dihapus.');
    }
}
