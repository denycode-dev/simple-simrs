<?php

return [
    'class' => \yii\db\Connection::class,
    'dsn' => sprintf(
        'pgsql:host=%s;port=%s;dbname=%s',
        getenv('DB_HOST') ?: 'postgres',
        getenv('DB_PORT') ?: '5432',
        getenv('DB_NAME') ?: 'simrs_db'
    ),
    'username' => getenv('DB_USER') ?: 'postgres',
    'password' => getenv('DB_PASSWORD') ?: '',
    'charset' => 'utf8',
];