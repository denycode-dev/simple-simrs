<?php

declare(strict_types=1);

namespace app\tests\Unit\Models;

use Codeception\Test\Unit;
use Yii;
use yii\db\IntegrityException;

final class UserMigrationTest extends Unit
{
    private function cleanupTestData(): void
    {
        $db = Yii::$app->db;
        $db->createCommand("DELETE FROM {{%nurses}} WHERE nip LIKE 'TEST-NURSE%'")->execute();
        $db->createCommand("DELETE FROM {{%doctors}} WHERE nip LIKE 'TEST-DOC%'")->execute();
        $db->createCommand("DELETE FROM {{%users}} WHERE username LIKE 'test_user_%'")->execute();
    }

    protected function _before(): void
    {
        parent::_before();
        $this->cleanupTestData();
    }

    protected function _after(): void
    {
        $this->cleanupTestData();
        parent::_after();
    }

    public function testTablesExist(): void
    {
        $schema = Yii::$app->db->getSchema();
        $tables = $schema->getTableNames();

        $this->assertContains('users', $tables, 'Table `users` must exist.');
        $this->assertContains('doctors', $tables, 'Table `doctors` must exist.');
        $this->assertContains('nurses', $tables, 'Table `nurses` must exist.');
    }

    public function testUsersTableColumnsAndStructure(): void
    {
        $table = Yii::$app->db->getSchema()->getTableSchema('users');
        $this->assertNotNull($table, 'Table `users` schema must be retrievable.');

        $expectedColumns = [
            'id', 'username', 'password_hash', 'auth_key', 'access_token',
            'full_name', 'role', 'is_active', 'created_at', 'updated_at'
        ];

        foreach ($expectedColumns as $col) {
            $this->assertArrayHasKey($col, $table->columns, "Column `{$col}` must exist in `users`.");
        }

        $this->assertEquals(['id'], $table->primaryKey, 'Primary key of `users` must be `id`.');
        $this->assertFalse($table->columns['username']->allowNull, '`username` must NOT NULL.');
        $this->assertFalse($table->columns['password_hash']->allowNull, '`password_hash` must NOT NULL.');
        $this->assertFalse($table->columns['auth_key']->allowNull, '`auth_key` must NOT NULL.');
        $this->assertTrue($table->columns['access_token']->allowNull, '`access_token` must be nullable.');
        $this->assertFalse($table->columns['full_name']->allowNull, '`full_name` must NOT NULL.');
        $this->assertFalse($table->columns['role']->allowNull, '`role` must NOT NULL.');
        $this->assertFalse($table->columns['is_active']->allowNull, '`is_active` must NOT NULL.');
    }

    public function testDoctorsTableColumnsAndForeignKeys(): void
    {
        $table = Yii::$app->db->getSchema()->getTableSchema('doctors');
        $this->assertNotNull($table, 'Table `doctors` schema must be retrievable.');

        $expectedColumns = [
            'id', 'user_id', 'nip', 'name', 'specialization', 'phone', 'sip_number', 'created_at'
        ];

        foreach ($expectedColumns as $col) {
            $this->assertArrayHasKey($col, $table->columns, "Column `{$col}` must exist in `doctors`.");
        }

        $this->assertEquals(['id'], $table->primaryKey, 'Primary key of `doctors` must be `id`.');

        $fkFound = false;
        foreach ($table->foreignKeys as $fk) {
            if ($fk[0] === 'users' && isset($fk['user_id']) && $fk['user_id'] === 'id') {
                $fkFound = true;
                break;
            }
        }
        $this->assertTrue($fkFound, 'Foreign key `user_id` referencing `users(id)` must exist in `doctors`.');
    }

    public function testNursesTableColumnsAndForeignKeys(): void
    {
        $table = Yii::$app->db->getSchema()->getTableSchema('nurses');
        $this->assertNotNull($table, 'Table `nurses` schema must be retrievable.');

        $expectedColumns = ['id', 'user_id', 'nip', 'name', 'phone', 'created_at'];

        foreach ($expectedColumns as $col) {
            $this->assertArrayHasKey($col, $table->columns, "Column `{$col}` must exist in `nurses`.");
        }

        $this->assertEquals(['id'], $table->primaryKey, 'Primary key of `nurses` must be `id`.');

        $fkFound = false;
        foreach ($table->foreignKeys as $fk) {
            if ($fk[0] === 'users' && isset($fk['user_id']) && $fk['user_id'] === 'id') {
                $fkFound = true;
                break;
            }
        }
        $this->assertTrue($fkFound, 'Foreign key `user_id` referencing `users(id)` must exist in `nurses`.');
    }

    public function testRoleCheckConstraintAllowsValidRoles(): void
    {
        $validRoles = ['admin', 'registration', 'nurse', 'doctor', 'pharmacist', 'lab', 'cashier'];
        $db = Yii::$app->db;

        foreach ($validRoles as $i => $role) {
            $inserted = $db->createCommand()->insert('{{%users}}', [
                'username' => "test_user_{$role}_{$i}",
                'password_hash' => 'hash_test',
                'auth_key' => "auth_key_{$role}_{$i}",
                'full_name' => "Test User {$role}",
                'role' => $role,
            ])->execute();

            $this->assertEquals(1, $inserted, "Inserting user with valid role `{$role}` must succeed.");
        }
    }

    public function testRoleCheckConstraintRejectsInvalidRole(): void
    {
        $transaction = Yii::$app->db->beginTransaction();
        try {
            Yii::$app->db->createCommand()->insert('{{%users}}', [
                'username' => 'test_user_invalid',
                'password_hash' => 'hash_test',
                'auth_key' => 'auth_key_invalid',
                'full_name' => 'Invalid Role User',
                'role' => 'invalid_role_superadmin',
            ])->execute();
            $transaction->commit();
            $this->fail('Expected IntegrityException for invalid role');
        } catch (IntegrityException $e) {
            $transaction->rollBack();
            $this->assertStringContainsString('users_role_check', $e->getMessage());
        }
    }

    public function testUsernameUniqueConstraintEnforced(): void
    {
        $db = Yii::$app->db;
        $db->createCommand()->insert('{{%users}}', [
            'username' => 'test_user_unique_1',
            'password_hash' => 'hash_test',
            'auth_key' => 'auth_key_1',
            'full_name' => 'Unique User 1',
            'role' => 'admin',
        ])->execute();

        $transaction = $db->beginTransaction();
        try {
            $db->createCommand()->insert('{{%users}}', [
                'username' => 'test_user_unique_1',
                'password_hash' => 'hash_test',
                'auth_key' => 'auth_key_2',
                'full_name' => 'Unique User Duplicate',
                'role' => 'doctor',
            ])->execute();
            $transaction->commit();
            $this->fail('Expected IntegrityException for duplicate username');
        } catch (IntegrityException $e) {
            $transaction->rollBack();
            $this->assertTrue(true);
        }
    }

    public function testDoctorUniqueConstraintsEnforced(): void
    {
        $db = Yii::$app->db;
        $db->createCommand()->insert('{{%doctors}}', [
            'nip' => 'TEST-DOC-001',
            'name' => 'dr. Test Doctor',
            'specialization' => 'Umum',
            'sip_number' => 'SIP-TEST-001',
        ])->execute();

        $transaction = $db->beginTransaction();
        try {
            // Attempt duplicate NIP
            $db->createCommand()->insert('{{%doctors}}', [
                'nip' => 'TEST-DOC-001',
                'name' => 'dr. Duplicate Doctor',
                'specialization' => 'Anak',
                'sip_number' => 'SIP-TEST-002',
            ])->execute();
            $transaction->commit();
            $this->fail('Expected IntegrityException for duplicate doctor NIP');
        } catch (IntegrityException $e) {
            $transaction->rollBack();
            $this->assertTrue(true);
        }
    }
}
