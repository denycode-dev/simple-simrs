<?php

declare(strict_types=1);

use yii\web\JsonParser;
use yii\web\Response;

$params = require __DIR__ . '/params.php';
$db = require __DIR__ . '/test_db.php';

/**
 * Application configuration shared by all test types
 */
return [
    'id' => 'basic-tests',
    'basePath' => dirname(__DIR__),
    'on beforeRequest' => function (): void {
        $request = Yii::$app->request;
        $url = $request->getUrl();
        $acceptHeader = $request->headers->get('Accept', '');
        if (str_starts_with($url, '/api') || str_contains($acceptHeader, 'application/json')) {
            Yii::$app->response->format = \yii\web\Response::FORMAT_JSON;
        }
    },
    'bootstrap' => [
        \app\tests\Support\MailerBootstrap::class,
    ],
    'aliases' => [
        '@bower' => '@vendor/bower-asset',
        '@npm'   => '@vendor/npm-asset',
    ],
    'language' => 'en-US',
    'components' => [
        'db' => $db,
        'mailer' => [
            'class' => \yii\symfonymailer\Mailer::class,
            'messageClass' => \yii\symfonymailer\Message::class,
            'useFileTransport' => true,
            'viewPath' => '@app/mail',
        ],
        'assetManager' => [
            'basePath' => __DIR__ . '/../web/assets',
        ],
        'user' => [
            'identityClass' => \app\models\User::class,
        ],
        'request' => [
            'cookieValidationKey' => 'test',
            'enableCsrfValidation' => false,
            'parsers' => [
                'application/json' => JsonParser::class,
            ],
        ],
        'response' => [
            'class' => Response::class,
            'on beforeSend' => function ($event): void {
                /** @var Response $response */
                $response = $event->sender;
                $request = Yii::$app->request;
                $url = $request->getUrl();
                $acceptHeader = $request->headers->get('Accept', '');

                $isApi = str_starts_with($url, '/api') || str_contains($acceptHeader, 'application/json');
                if ($isApi && $response->format !== Response::FORMAT_RAW) {
                    $response->format = Response::FORMAT_JSON;
                }

                if ($response->format === Response::FORMAT_JSON && is_array($response->data)) {
                    if (isset($response->data['success'])) {
                        return;
                    }

                    if (!$response->isSuccessful) {
                        $status = $response->statusCode;
                        $defaultMessages = [
                            400 => 'Permintaan tidak valid.',
                            401 => 'Autentikasi gagal. Token Bearer diperlukan.',
                            403 => 'Akses ditolak. Anda tidak memiliki izin untuk tindakan ini.',
                            404 => 'Endpoint atau sumber daya tidak ditemukan.',
                            405 => 'Metode HTTP tidak diizinkan untuk endpoint ini.',
                            422 => 'Validasi data masukan gagal.',
                            429 => 'Batas kuota permintaan terlampaui. Silakan coba lagi nanti.',
                            500 => 'Terjadi kesalahan internal pada server.',
                        ];

                        $message = $defaultMessages[$status] ?? ($response->data['message'] ?? 'Terjadi kesalahan pada sistem.');
                        $response->data = [
                            'success' => false,
                            'message' => $message,
                            'data' => null,
                        ];
                    }
                }
            },
        ],
        'urlManager' => [
            'enablePrettyUrl' => true,
            'showScriptName' => false,
            'enableStrictParsing' => false,
            'rules' => [
                'GET api/v1/ping' => 'api/base-api/index',
                'OPTIONS api/v1/ping' => 'api/base-api/index',
                'api/v1/<controller:[a-zA-Z0-9-]+>/<action:[a-zA-Z0-9-]+>' => 'api/<controller>/<action>',
                'api/v1/<controller:[a-zA-Z0-9-]+>' => 'api/<controller>/index',
            ],
        ],
    ],
    'params' => $params,
];
