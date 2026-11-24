<?php

declare(strict_types=1);

namespace app\controllers\api;

use Yii;
use app\models\DoctorSchedule;
use yii\data\ActiveDataProvider;
use yii\filters\auth\HttpBearerAuth;

class DoctorScheduleController extends BaseApiController
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
        $query = DoctorSchedule::find()->with(['doctor', 'polyclinic']);

        $doctorId = Yii::$app->request->get('doctor_id');
        if (!empty($doctorId)) {
            $query->andWhere(['doctor_id' => (int)$doctorId]);
        }

        $polyId = Yii::$app->request->get('polyclinic_id');
        if (!empty($polyId)) {
            $query->andWhere(['polyclinic_id' => (int)$polyId]);
        }

        $day = Yii::$app->request->get('day_of_week');
        if (!empty($day)) {
            $query->andWhere(['day_of_week' => $day]);
        }

        $dataProvider = new ActiveDataProvider([
            'query' => $query->orderBy(['day_of_week' => SORT_ASC, 'start_time' => SORT_ASC]),
            'pagination' => ['pageSize' => 50],
        ]);

        return $this->successResponse($dataProvider->getModels(), 'Jadwal dokter berhasil dimuat.');
    }

    public function actionView(int $id): array
    {
        $schedule = DoctorSchedule::find()->where(['id' => $id])->with(['doctor', 'polyclinic'])->one();
        if ($schedule === null) {
            return $this->notFoundResponse('Jadwal dokter tidak ditemukan.');
        }
        return $this->successResponse($schedule, 'Jadwal dokter berhasil dimuat.');
    }

    public function actionCreate(): array
    {
        $schedule = new DoctorSchedule();
        $schedule->load(Yii::$app->request->getBodyParams(), '');

        if (!$schedule->validate()) {
            return $this->validationErrorResponse($schedule->errors, 'Validasi jadwal dokter gagal.');
        }

        if (!$schedule->save()) {
            return $this->errorResponse('Gagal menyimpan jadwal dokter.', $schedule->errors, 500);
        }

        return $this->successResponse($schedule, 'Jadwal dokter berhasil ditambahkan.', 201);
    }

    public function actionUpdate(int $id): array
    {
        $schedule = DoctorSchedule::findOne($id);
        if ($schedule === null) {
            return $this->notFoundResponse('Jadwal dokter tidak ditemukan.');
        }

        $schedule->load(Yii::$app->request->getBodyParams(), '');
        if (!$schedule->validate()) {
            return $this->validationErrorResponse($schedule->errors, 'Validasi jadwal dokter gagal.');
        }

        if (!$schedule->save()) {
            return $this->errorResponse('Gagal memperbarui jadwal dokter.', $schedule->errors, 500);
        }

        return $this->successResponse($schedule, 'Jadwal dokter berhasil diperbarui.');
    }

    public function actionDelete(int $id): array
    {
        $schedule = DoctorSchedule::findOne($id);
        if ($schedule === null) {
            return $this->notFoundResponse('Jadwal dokter tidak ditemukan.');
        }

        $schedule->delete();
        return $this->successResponse(null, 'Jadwal dokter berhasil dihapus.');
    }
}
