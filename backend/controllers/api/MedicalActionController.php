<?php

declare(strict_types=1);

namespace app\controllers\api;

use Yii;
use app\models\MedicalAction;
use yii\data\ActiveDataProvider;
use yii\filters\auth\HttpBearerAuth;

class MedicalActionController extends BaseApiController
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
        $query = MedicalAction::find();
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

        return $this->successResponse($dataProvider->getModels(), 'Data tindakan medis berhasil dimuat.');
    }

    public function actionView(int $id): array
    {
        $action = MedicalAction::findOne($id);
        if ($action === null) {
            return $this->notFoundResponse('Data tindakan medis tidak ditemukan.');
        }
        return $this->successResponse($action, 'Data tindakan medis berhasil dimuat.');
    }

    public function actionCreate(): array
    {
        $action = new MedicalAction();
        $action->load(Yii::$app->request->getBodyParams(), '');

        if (!$action->validate()) {
            return $this->validationErrorResponse($action->errors, 'Validasi tindakan medis gagal.');
        }

        if (!$action->save()) {
            return $this->errorResponse('Gagal menyimpan tindakan medis.', $action->errors, 500);
        }

        return $this->successResponse($action, 'Data tindakan medis berhasil ditambahkan.', 201);
    }

    public function actionUpdate(int $id): array
    {
        $action = MedicalAction::findOne($id);
        if ($action === null) {
            return $this->notFoundResponse('Data tindakan medis tidak ditemukan.');
        }

        $action->load(Yii::$app->request->getBodyParams(), '');
        if (!$action->validate()) {
            return $this->validationErrorResponse($action->errors, 'Validasi tindakan medis gagal.');
        }

        if (!$action->save()) {
            return $this->errorResponse('Gagal memperbarui tindakan medis.', $action->errors, 500);
        }

        return $this->successResponse($action, 'Data tindakan medis berhasil diperbarui.');
    }
}
