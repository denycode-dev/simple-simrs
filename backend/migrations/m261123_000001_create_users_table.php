<?php

declare(strict_types=1);

use yii\db\Migration;

/**
 * Handles the creation of tables `users`, `doctors`, and `nurses`.
 */
class m261123_000001_create_users_table extends Migration
{
    /**
     * {@inheritdoc}
     */
    public function safeUp(): void
    {
        // 1. Table users
        $this->createTable('{{%users}}', [
            'id' => $this->primaryKey(),
            'username' => $this->string(50)->notNull()->unique(),
            'password_hash' => $this->string(255)->notNull(),
            'auth_key' => $this->string(64)->notNull(),
            'access_token' => $this->string(128)->null()->unique(),
            'full_name' => $this->string(100)->notNull(),
            'role' => $this->string(30)->notNull(),
            'is_active' => $this->boolean()->notNull()->defaultValue(true),
            'created_at' => $this->timestamp()->notNull()->defaultExpression('CURRENT_TIMESTAMP'),
            'updated_at' => $this->timestamp()->notNull()->defaultExpression('CURRENT_TIMESTAMP'),
        ]);

        $this->execute("ALTER TABLE {{%users}} ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'registration', 'nurse', 'doctor', 'pharmacist', 'lab', 'cashier'))");
        $this->createIndex('idx_users_role', '{{%users}}', 'role');

        // 2. Table doctors
        $this->createTable('{{%doctors}}', [
            'id' => $this->primaryKey(),
            'user_id' => $this->integer()->null(),
            'nip' => $this->string(50)->notNull()->unique(),
            'name' => $this->string(100)->notNull(),
            'specialization' => $this->string(100)->notNull(),
            'phone' => $this->string(20)->null(),
            'sip_number' => $this->string(50)->notNull()->unique(),
            'created_at' => $this->timestamp()->notNull()->defaultExpression('CURRENT_TIMESTAMP'),
        ]);

        $this->addForeignKey(
            'fk_doctors_user',
            '{{%doctors}}',
            'user_id',
            '{{%users}}',
            'id',
            'SET NULL',
            'CASCADE'
        );
        $this->createIndex('idx_doctors_user_id', '{{%doctors}}', 'user_id');

        // 3. Table nurses
        $this->createTable('{{%nurses}}', [
            'id' => $this->primaryKey(),
            'user_id' => $this->integer()->null(),
            'nip' => $this->string(50)->notNull()->unique(),
            'name' => $this->string(100)->notNull(),
            'phone' => $this->string(20)->null(),
            'created_at' => $this->timestamp()->notNull()->defaultExpression('CURRENT_TIMESTAMP'),
        ]);

        $this->addForeignKey(
            'fk_nurses_user',
            '{{%nurses}}',
            'user_id',
            '{{%users}}',
            'id',
            'SET NULL',
            'CASCADE'
        );
        $this->createIndex('idx_nurses_user_id', '{{%nurses}}', 'user_id');
    }

    /**
     * {@inheritdoc}
     */
    public function safeDown(): void
    {
        $this->dropForeignKey('fk_nurses_user', '{{%nurses}}');
        $this->dropTable('{{%nurses}}');

        $this->dropForeignKey('fk_doctors_user', '{{%doctors}}');
        $this->dropTable('{{%doctors}}');

        $this->dropTable('{{%users}}');
    }
}
