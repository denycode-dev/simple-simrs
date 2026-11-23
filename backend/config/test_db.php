<?php

$db = require __DIR__ . '/db.php';
// test database! Important not to run tests on production or development databases
$db['dsn'] = sprintf(
    'pgsql:host=%s;port=%s;dbname=%s',
    getenv('DB_HOST') ?: 'postgres',
    getenv('DB_PORT') ?: '5432',
    getenv('DB_NAME') ?: 'simrs_db'
);

return $db;

