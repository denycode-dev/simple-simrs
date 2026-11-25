<?php

declare(strict_types=1);

namespace app\models;

use Yii;
use app\behaviors\AuditTrailBehavior;
use yii\db\ActiveQuery;
use yii\db\ActiveRecord;

/**
 * ExaminationAction model representing the 'examination_actions' table.
 *
 * @property int $id
 * @property int $examination_id
 * @property int $action_id
 * @property float $tariff
 * @property string|null $notes
 * @property string $created_at
 *
 * @property MedicalExamination $examination
 * @property MedicalAction $action
 */
class ExaminationAction extends ActiveRecord
{
    /**
     * When true, skips automatic billing recalculation on save/delete (used by batch transactions).
     */
    public bool $skipBillingRecalculate = false;

    public static function tableName(): string
    {
        return '{{%examination_actions}}';
    }

    public function behaviors(): array
    {
        return [
            'auditTrail' => [
                'class' => AuditTrailBehavior::class,
                'module' => 'EXAMINATION',
            ],
        ];
    }

    public function rules(): array
    {
        return [
            [['examination_id', 'action_id'], 'required', 'message' => '{attribute} wajib diisi.'],
            [['examination_id', 'action_id'], 'integer'],
            [['tariff'], 'number', 'min' => 0, 'message' => 'Tarif tindakan harus bernilai positif.'],
            [['notes'], 'string'],
            [['examination_id'], 'exist', 'skipOnError' => true, 'targetClass' => MedicalExamination::class, 'targetAttribute' => ['examination_id' => 'id']],
            [['action_id'], 'exist', 'skipOnError' => true, 'targetClass' => MedicalAction::class, 'targetAttribute' => ['action_id' => 'id']],
        ];
    }

    public function getExamination(): ActiveQuery
    {
        return $this->hasOne(MedicalExamination::class, ['id' => 'examination_id']);
    }

    public function getAction(): ActiveQuery
    {
        return $this->hasOne(MedicalAction::class, ['id' => 'action_id']);
    }

    public function beforeSave($insert): bool
    {
        if (!parent::beforeSave($insert)) {
            return false;
        }

        if ($insert) {
            // Lock tariff from MedicalAction master if not set
            if ($this->tariff === null || $this->tariff === '') {
                $action = MedicalAction::findOne($this->action_id);
                if ($action !== null) {
                    $this->tariff = (float)$action->tariff;
                } else {
                    $this->tariff = 0.00;
                }
            }

            if (empty($this->created_at)) {
                $this->created_at = date('Y-m-d H:i:s');
            }
        }

        return true;
    }

    public function afterSave($insert, $changedAttributes): void
    {
        parent::afterSave($insert, $changedAttributes);
        if (!$this->skipBillingRecalculate) {
            $this->recalculateRegistrationBilling();
        }
    }

    public function afterDelete(): void
    {
        parent::afterDelete();
        if (!$this->skipBillingRecalculate) {
            $this->recalculateRegistrationBilling();
        }
    }

    private function recalculateRegistrationBilling(): void
    {
        if ($this->examination !== null) {
            Billing::recalculate($this->examination->registration_id);
        }
    }
}
