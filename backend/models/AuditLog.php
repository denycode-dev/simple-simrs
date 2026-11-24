<?php

declare(strict_types=1);

namespace app\models;

use Yii;
use yii\db\ActiveQuery;
use yii\db\ActiveRecord;

/**
 * AuditLog model representing the append-only 'audit_logs' table.
 *
 * @property int $id
 * @property int|null $user_id
 * @property string $action
 * @property string $module
 * @property string|null $record_id
 * @property string|null $old_values
 * @property string|null $new_values
 * @property string|null $details
 * @property string|null $ip_address
 * @property string|null $user_agent
 * @property string $created_at
 *
 * @property User|null $user
 */
class AuditLog extends ActiveRecord
{
    public const REDACTED_KEYS = [
        'password',
        'password_hash',
        'auth_key',
        'access_token',
        'token',
        'secret',
    ];

    public static function tableName(): string
    {
        return '{{%audit_logs}}';
    }

    public function rules(): array
    {
        return [
            [['action', 'module'], 'required'],
            [['user_id'], 'integer'],
            [['action', 'module', 'record_id'], 'string', 'max' => 50],
            [['ip_address'], 'string', 'max' => 45],
            [['user_agent'], 'string', 'max' => 255],
            [['old_values', 'new_values', 'details'], 'string'],
            [['created_at'], 'safe'],
            [['user_id'], 'exist', 'skipOnError' => true, 'targetClass' => User::class, 'targetAttribute' => ['user_id' => 'id']],
        ];
    }

    public function getUser(): ActiveQuery
    {
        return $this->hasOne(User::class, ['id' => 'user_id']);
    }

    public function beforeSave($insert): bool
    {
        if (!$insert) {
            // Append-only immutability: record updates are rejected
            return false;
        }

        if (empty($this->created_at)) {
            $this->created_at = date('Y-m-d H:i:s');
        }

        return parent::beforeSave($insert);
    }

    public function beforeDelete(): bool
    {
        // Append-only immutability: record deletions are rejected
        return false;
    }

    public static function sanitizeData(?array $data): ?array
    {
        if ($data === null) {
            return null;
        }

        $sanitized = [];
        foreach ($data as $key => $val) {
            if (in_array(strtolower((string)$key), self::REDACTED_KEYS, true)) {
                $sanitized[$key] = '[REDACTED]';
            } elseif (is_array($val)) {
                $sanitized[$key] = self::sanitizeData($val);
            } else {
                $sanitized[$key] = $val;
            }
        }

        return $sanitized;
    }

    public static function log(
        string $module,
        string $action,
        ?string $recordId = null,
        $details = null,
        ?array $oldValues = null,
        ?array $newValues = null
    ): self {
        $log = new self();
        $log->module = $module;
        $log->action = $action;
        $log->record_id = $recordId !== null ? (string)$recordId : null;

        $userId = null;
        $ip = '127.0.0.1';
        $ua = 'CLI';

        if (Yii::$app instanceof \yii\web\Application) {
            if (!Yii::$app->user->isGuest) {
                $userId = Yii::$app->user->id;
            }
            $ip = Yii::$app->request->userIP ?: '127.0.0.1';
            $ua = substr((string)Yii::$app->request->userAgent, 0, 255);
        }

        $log->user_id = $userId ? (int)$userId : null;
        $log->ip_address = $ip;
        $log->user_agent = $ua;

        $log->old_values = $oldValues !== null ? json_encode(self::sanitizeData($oldValues)) : null;
        $log->new_values = $newValues !== null ? json_encode(self::sanitizeData($newValues)) : null;
        $log->details = is_array($details) ? json_encode(self::sanitizeData($details)) : ($details !== null ? (string)$details : null);

        $log->save(false);
        return $log;
    }
}
