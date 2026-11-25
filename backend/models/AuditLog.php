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

    public static function sanitizeData(?array $data, ?array $redactedKeys = null): ?array
    {
        if ($data === null) {
            return null;
        }

        $keysToRedact = self::REDACTED_KEYS;
        if ($redactedKeys !== null) {
            $keysToRedact = array_unique(array_merge($keysToRedact, $redactedKeys));
        }

        $normalizedKeys = array_map(
            static fn($key): string => strtolower((string)$key),
            $keysToRedact
        );

        return self::sanitizeArray($data, $normalizedKeys);
    }

    private static function sanitizeArray(array $data, array $normalizedKeys): array
    {
        $sanitized = [];
        foreach ($data as $key => $val) {
            if (in_array(strtolower((string)$key), $normalizedKeys, true)) {
                $sanitized[$key] = '[REDACTED]';
            } elseif (is_array($val)) {
                $sanitized[$key] = self::sanitizeArray($val, $normalizedKeys);
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
        ?array $newValues = null,
        ?int $overrideUserId = null,
        ?array $redactedKeys = null
    ): self {
        $log = new self();
        $log->module = mb_substr($module, 0, 50);
        $log->action = mb_substr($action, 0, 50);
        $log->record_id = $recordId !== null ? mb_substr((string)$recordId, 0, 50) : null;

        $userId = $overrideUserId;
        $ip = '127.0.0.1';
        $ua = 'CLI';

        if (Yii::$app instanceof \yii\web\Application) {
            if ($userId === null && !Yii::$app->user->isGuest) {
                $userId = Yii::$app->user->id;
            }
            $ip = Yii::$app->request->userIP ?: '127.0.0.1';
            $ua = (string)Yii::$app->request->userAgent;
        }

        $log->user_id = $userId !== null ? (int)$userId : null;
        $log->ip_address = mb_substr($ip, 0, 45);
        $log->user_agent = mb_substr($ua, 0, 255);

        $log->old_values = $oldValues !== null ? json_encode(self::sanitizeData($oldValues, $redactedKeys)) : null;
        $log->new_values = $newValues !== null ? json_encode(self::sanitizeData($newValues, $redactedKeys)) : null;
        $log->details = is_array($details)
            ? json_encode(self::sanitizeData($details, $redactedKeys))
            : ($details !== null ? (string)$details : null);

        $log->save(false);
        return $log;
    }

    /**
     * Formats the audit log record for API responses with decoded JSON payloads
     * and safe user relation summary.
     */
    public function toApiArray(): array
    {
        return [
            'id' => (int)$this->id,
            'user_id' => $this->user_id !== null ? (int)$this->user_id : null,
            'action' => $this->action,
            'module' => $this->module,
            'record_id' => $this->record_id,
            'old_values' => self::decodeJsonField($this->old_values),
            'new_values' => self::decodeJsonField($this->new_values),
            'details' => self::decodeJsonField($this->details),
            'ip_address' => $this->ip_address,
            'user_agent' => $this->user_agent,
            'created_at' => $this->created_at,
            'user' => $this->user !== null ? [
                'id' => (int)$this->user->id,
                'username' => $this->user->username,
                'name' => $this->user->full_name,
                'role' => $this->user->role,
            ] : null,
        ];
    }

    private static function decodeJsonField(?string $value): mixed
    {
        if ($value === null || $value === '') {
            return null;
        }

        $decoded = json_decode($value, true);
        if (json_last_error() === JSON_ERROR_NONE) {
            return $decoded;
        }

        return $value;
    }
}
