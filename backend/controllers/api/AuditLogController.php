<?php

declare(strict_types=1);

namespace app\controllers\api;

use Yii;
use app\models\AuditLog;
use yii\data\ActiveDataProvider;
use yii\filters\AccessControl;
use yii\filters\auth\HttpBearerAuth;

/**
 * AuditLogController provides endpoints for administrators to view immutable audit trails.
 */
class AuditLogController extends BaseApiController
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
                    'matchCallback' => function () {
                        $user = Yii::$app->user->identity;
                        return $user !== null && $user->role === 'admin';
                    },
                ],
            ],
        ];

        return $behaviors;
    }

    public function actionIndex(): array
    {
        $query = AuditLog::find()->with('user');

        $module = Yii::$app->request->get('module');
        if (!empty($module)) {
            $query->andWhere(['module' => $module]);
        }

        $action = Yii::$app->request->get('action');
        if (!empty($action)) {
            $query->andWhere(['action' => $action]);
        }

        $userId = Yii::$app->request->get('user_id');
        if (!empty($userId)) {
            $query->andWhere(['user_id' => (int)$userId]);
        }

        $dataProvider = new ActiveDataProvider([
            'query' => $query->orderBy(['id' => SORT_DESC]),
            'pagination' => ['pageSize' => 50],
        ]);

        $items = array_map(
            static fn(AuditLog $log): array => $log->toApiArray(),
            $dataProvider->getModels()
        );

        return $this->successResponse($items, 'Data audit log berhasil dimuat.');
    }

    public function actionView(int $id): array
    {
        $log = AuditLog::find()->where(['id' => $id])->with('user')->one();
        if ($log === null) {
            return $this->notFoundResponse('Data audit log tidak ditemukan.');
        }

        return $this->successResponse($log->toApiArray(), 'Detail audit log berhasil dimuat.');
    }
}
