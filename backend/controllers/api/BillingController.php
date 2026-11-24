<?php

declare(strict_types=1);

namespace app\controllers\api;

use Yii;
use app\models\Billing;
use app\models\ExaminationAction;
use app\models\PrescriptionItem;
use yii\data\ActiveDataProvider;
use yii\db\Query;
use yii\filters\auth\HttpBearerAuth;

class BillingController extends BaseApiController
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
        $query = Billing::find()->with([
            'registration.patient',
            'registration.polyclinic',
            'registration.doctor',
        ]);

        $status = Yii::$app->request->get('payment_status');
        if (!empty($status)) {
            $query->andWhere(['payment_status' => $status]);
        }

        $insurance = Yii::$app->request->get('insurance_type');
        if (!empty($insurance)) {
            $query->andWhere(['insurance_type' => $insurance]);
        }

        $regId = Yii::$app->request->get('registration_id');
        if (!empty($regId)) {
            $query->andWhere(['registration_id' => (int)$regId]);
        }

        $dataProvider = new ActiveDataProvider([
            'query' => $query->orderBy(['id' => SORT_DESC]),
            'pagination' => ['pageSize' => 50],
        ]);

        $items = array_map(function (Billing $b) {
            return $this->formatBillingData($b);
        }, $dataProvider->getModels());

        return $this->successResponse($items, 'Daftar tagihan billing berhasil dimuat.');
    }

    public function actionView(int $id): array
    {
        $billing = Billing::find()
            ->where(['id' => $id])
            ->with([
                'registration.patient',
                'registration.polyclinic',
                'registration.doctor',
                'payments',
            ])
            ->one();

        if ($billing === null) {
            return $this->notFoundResponse('Data tagihan billing tidak ditemukan.');
        }

        return $this->successResponse($this->formatBillingData($billing), 'Data tagihan berhasil dimuat.');
    }

    public function actionSummary(int $id): array
    {
        $billing = Billing::findOne($id);
        if ($billing === null) {
            return $this->notFoundResponse('Data tagihan billing tidak ditemukan.');
        }

        // Recalculate to ensure up-to-date numbers
        $billing = Billing::recalculate($billing->registration_id) ?? $billing;

        // Fetch action breakdown
        $actions = (new Query())
            ->select([
                'ea.id',
                'ea.action_id',
                'ma.code as action_code',
                'ma.name as action_name',
                'ea.tariff',
                'ea.notes',
                'ea.created_at'
            ])
            ->from('{{%examination_actions}} ea')
            ->innerJoin('{{%medical_examinations}} me', 'me.id = ea.examination_id')
            ->leftJoin('{{%medical_actions}} ma', 'ma.id = ea.action_id')
            ->where(['me.registration_id' => $billing->registration_id])
            ->all();

        // Fetch prescription medicines breakdown
        $medicines = (new Query())
            ->select([
                'pi.id',
                'pi.medicine_id',
                'm.code as medicine_code',
                'm.name as medicine_name',
                'pi.quantity',
                'pi.dosage',
                'pi.frequency',
                'pi.unit_price',
                'pi.subtotal',
                'p.prescription_number',
                'p.status as prescription_status'
            ])
            ->from('{{%prescription_items}} pi')
            ->innerJoin('{{%prescriptions}} p', 'p.id = pi.prescription_id')
            ->leftJoin('{{%medicines}} m', 'm.id = pi.medicine_id')
            ->where(['p.registration_id' => $billing->registration_id])
            ->all();

        // Fetch lab orders breakdown
        $labItems = (new Query())
            ->select([
                'loi.id',
                'loi.test_name',
                'loi.tariff',
                'loi.result_value',
                'loi.reference_range',
                'lo.order_number',
                'lo.status as order_status'
            ])
            ->from('{{%lab_order_items}} loi')
            ->innerJoin('{{%lab_orders}} lo', 'lo.id = loi.lab_order_id')
            ->where(['lo.registration_id' => $billing->registration_id])
            ->all();

        $data = $billing->toArray();
        if ($billing->registration) {
            $reg = $billing->registration->toArray();
            if ($billing->registration->patient) {
                $reg['patient'] = $billing->registration->patient->toArray();
            }
            if ($billing->registration->polyclinic) {
                $reg['polyclinic'] = $billing->registration->polyclinic->toArray();
            }
            if ($billing->registration->doctor) {
                $reg['doctor'] = $billing->registration->doctor->toArray();
            }
            $data['registration'] = $reg;
        }

        $data['breakdown'] = [
            'registration' => [
                'fee' => (float)$billing->total_registration_fee,
            ],
            'actions' => $actions,
            'medicines' => $medicines,
            'lab' => $labItems,
        ];

        return $this->successResponse($data, 'Ringkasan rincian tagihan terpadu berhasil dimuat.');
    }

    private function formatBillingData(Billing $b): array
    {
        $data = $b->toArray();
        if ($b->registration) {
            $reg = $b->registration->toArray();
            if ($b->registration->patient) {
                $reg['patient'] = $b->registration->patient->toArray();
            }
            if ($b->registration->polyclinic) {
                $reg['polyclinic'] = $b->registration->polyclinic->toArray();
            }
            if ($b->registration->doctor) {
                $reg['doctor'] = $b->registration->doctor->toArray();
            }
            $data['registration'] = $reg;
        }
        if (!empty($b->payments)) {
            $data['payments'] = array_map(function ($p) {
                return $p->toArray();
            }, $b->payments);
        } else {
            $data['payments'] = [];
        }
        return $data;
    }
}
