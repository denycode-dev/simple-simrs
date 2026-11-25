<?php

declare(strict_types=1);

namespace app\behaviors;

use app\models\AuditLog;
use yii\base\Behavior;
use yii\db\ActiveRecord;

/**
 * AuditTrailBehavior automatically records audit trail logs for ActiveRecord lifecycle events.
 */
class AuditTrailBehavior extends Behavior
{
    public string $module = 'GENERAL';
    public array $sensitiveAttributes = AuditLog::REDACTED_KEYS;

    public function events(): array
    {
        return [
            ActiveRecord::EVENT_AFTER_INSERT => 'afterInsert',
            ActiveRecord::EVENT_AFTER_UPDATE => 'afterUpdate',
            ActiveRecord::EVENT_AFTER_DELETE => 'afterDelete',
        ];
    }

    public function afterInsert($event): void
    {
        /** @var ActiveRecord $owner */
        $owner = $this->owner;
        $pk = $owner->getPrimaryKey();
        $recordId = is_array($pk) ? json_encode($pk) : (string)$pk;

        AuditLog::log(
            $this->module,
            'CREATE',
            $recordId,
            ['event' => 'insert'],
            null,
            $owner->getAttributes(),
            null,
            $this->sensitiveAttributes
        );
    }

    public function afterUpdate($event): void
    {
        /** @var ActiveRecord $owner */
        $owner = $this->owner;
        $pk = $owner->getPrimaryKey();
        $recordId = is_array($pk) ? json_encode($pk) : (string)$pk;

        $changed = $event->changedAttributes;
        if (empty($changed)) {
            return;
        }

        $newValues = array_intersect_key($owner->getAttributes(), $changed);

        AuditLog::log(
            $this->module,
            'UPDATE',
            $recordId,
            ['event' => 'update', 'fields' => array_keys($changed)],
            $changed,
            $newValues,
            null,
            $this->sensitiveAttributes
        );
    }

    public function afterDelete($event): void
    {
        /** @var ActiveRecord $owner */
        $owner = $this->owner;
        $pk = $owner->getPrimaryKey();
        $recordId = is_array($pk) ? json_encode($pk) : (string)$pk;

        AuditLog::log(
            $this->module,
            'DELETE',
            $recordId,
            ['event' => 'delete'],
            $owner->getAttributes(),
            null,
            null,
            $this->sensitiveAttributes
        );
    }
}
