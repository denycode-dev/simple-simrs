<?php

declare(strict_types=1);

use yii\db\Migration;

/**
 * Handles the creation of table '{{%audit_logs}}'.
 * Append-only immutable audit trail compliant with UU No. 27 Tahun 2022 (UU PDP).
 */
class m261123_000005_create_audit_logs_table extends Migration
{
    /**
     * {@inheritdoc}
     */
    public function safeUp(): void
    {
        $this->createTable('{{%audit_logs}}', [
            'id' => $this->bigPrimaryKey(),
            'user_id' => $this->integer()->null(),
            'action' => $this->string(50)->notNull(),
            'module' => $this->string(50)->notNull(),
            'record_id' => $this->string(50)->null(),
            'old_values' => $this->text()->null(),
            'new_values' => $this->text()->null(),
            'details' => $this->text()->null(),
            'ip_address' => $this->string(45)->null(),
            'user_agent' => $this->string(255)->null(),
            'created_at' => $this->timestamp()->notNull()->defaultExpression('CURRENT_TIMESTAMP'),
        ]);

        $this->addForeignKey(
            'fk_audit_logs_user',
            '{{%audit_logs}}',
            'user_id',
            '{{%users}}',
            'id',
            'SET NULL',
            'CASCADE'
        );

        // Composite indexes as specified in Task 32
        $this->createIndex(
            'idx_audit_logs_user_created',
            '{{%audit_logs}}',
            ['user_id', 'created_at']
        );

        $this->createIndex(
            'idx_audit_logs_module_action',
            '{{%audit_logs}}',
            ['module', 'action']
        );
    }

    /**
     * {@inheritdoc}
     */
    public function safeDown(): void
    {
        $this->dropForeignKey('fk_audit_logs_user', '{{%audit_logs}}');
        $this->dropIndex('idx_audit_logs_user_created', '{{%audit_logs}}');
        $this->dropIndex('idx_audit_logs_module_action', '{{%audit_logs}}');
        $this->dropTable('{{%audit_logs}}');
    }
}
