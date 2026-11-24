<?php

declare(strict_types=1);

namespace app\tests\Unit\Models;

use Codeception\Test\Unit;
use Yii;

final class AuditLogMigrationTest extends Unit
{
    public function testAuditLogsTableStructure(): void
    {
        $schema = Yii::$app->db->schema->getTableSchema('audit_logs');
        $this->assertNotNull($schema, 'Tabel audit_logs harus ada di database');
        $this->assertArrayHasKey('user_id', $schema->columns);
        $this->assertArrayHasKey('action', $schema->columns);
        $this->assertArrayHasKey('module', $schema->columns);
        $this->assertArrayHasKey('record_id', $schema->columns);
        $this->assertArrayHasKey('old_values', $schema->columns);
        $this->assertArrayHasKey('new_values', $schema->columns);
        $this->assertArrayHasKey('details', $schema->columns);
        $this->assertArrayHasKey('ip_address', $schema->columns);
        $this->assertArrayHasKey('user_agent', $schema->columns);
        $this->assertArrayHasKey('created_at', $schema->columns);
    }

    public function testAuditLogsCompositeIndexesExist(): void
    {
        $indexes = Yii::$app->db->createCommand("
            SELECT indexname
            FROM pg_indexes
            WHERE tablename = 'audit_logs'
        ")->queryColumn();

        $this->assertContains('idx_audit_logs_user_created', $indexes, 'Composite index idx_audit_logs_user_created must exist.');
        $this->assertContains('idx_audit_logs_module_action', $indexes, 'Composite index idx_audit_logs_module_action must exist.');
    }
}
