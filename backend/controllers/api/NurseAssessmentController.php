<?php

declare(strict_types=1);

namespace app\controllers\api;

use Yii;
use app\models\NurseAssessment;
use app\models\Registration;
use yii\data\ActiveDataProvider;
use yii\filters\AccessControl;
use yii\filters\auth\HttpBearerAuth;

class NurseAssessmentController extends BaseApiController
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
                        return $user !== null && in_array($user->role, ['nurse', 'admin'], true);
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
        $query = NurseAssessment::find()->with(['nurse', 'registration']);
        $regId = Yii::$app->request->get('registration_id');
        if (!empty($regId)) {
            $query->andWhere(['registration_id' => (int)$regId]);
        }

        $dataProvider = new ActiveDataProvider([
            'query' => $query->orderBy(['id' => SORT_DESC]),
            'pagination' => ['pageSize' => 50],
        ]);

        return $this->successResponse($dataProvider->getModels(), 'Data asesmen nakes berhasil dimuat.');
    }

    public function actionView(int $id): array
    {
        $assessment = NurseAssessment::find()->where(['id' => $id])->with(['nurse', 'registration.patient'])->one();
        if ($assessment === null) {
            return $this->notFoundResponse('Data asesmen keperawatan tidak ditemukan.');
        }
        return $this->successResponse($assessment, 'Data asesmen keperawatan berhasil dimuat.');
    }

    public function actionCreate(): array
    {
        $assessment = new NurseAssessment();
        $assessment->load(Yii::$app->request->getBodyParams(), '');

        if (!$assessment->validate()) {
            return $this->validationErrorResponse($assessment->errors, 'Validasi asesmen nakes gagal.');
        }

        $transaction = Yii::$app->db->beginTransaction();
        try {
            if (!$assessment->save()) {
                throw new \Exception('Gagal menyimpan asesmen keperawatan.');
            }

            // Automatically advance registration queue to WAITING_DOCTOR
            $registration = Registration::findOne($assessment->registration_id);
            if ($registration !== null) {
                $registration->status = 'WAITING_DOCTOR';
                $registration->save(false);
            }

            $transaction->commit();
            return $this->successResponse($assessment, 'Asesmen awal keperawatan berhasil disimpan.', 201);
        } catch (\Throwable $e) {
            $transaction->rollBack();
            return $this->errorResponse($e->getMessage(), $assessment->errors, 500);
        }
    }
}
