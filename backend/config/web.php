<?php

declare(strict_types=1);

use yii\web\JsonParser;
use yii\web\Response;

$params = require __DIR__ . '/params.php';
$db = require __DIR__ . '/db.php';

$config = [
    'id' => 'basic',
    'basePath' => dirname(__DIR__),
    'on beforeRequest' => function (): void {
        $request = Yii::$app->request;
        $url = $request->getUrl();
        $acceptHeader = $request->headers->get('Accept', '');
        if (str_starts_with($url, '/api') || str_contains($acceptHeader, 'application/json')) {
            Yii::$app->response->format = \yii\web\Response::FORMAT_JSON;
        }
    },
    'bootstrap' => ['log'],
    'container' => [
        'singletons' => [
            \yii\mail\MailerInterface::class => [
                'class' => \yii\symfonymailer\Mailer::class,
                'useFileTransport' => true,
                'viewPath' => '@app/mail',
            ],
        ],
    ],
    'aliases' => [
        '@bower' => '@vendor/bower-asset',
        '@npm'   => '@vendor/npm-asset',
    ],
    'components' => [
        'request' => [
            'cookieValidationKey' => getenv('COOKIE_VALIDATION_KEY') ?: 'simrs_cookie_validation_secret_key_2026',
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
        'cache' => [
            'class' => \yii\caching\FileCache::class,
        ],
        'user' => [
            'identityClass' => \app\models\User::class,
            'enableAutoLogin' => true,
        ],
        'errorHandler' => [
            'errorAction' => 'site/error',
        ],
        'mailer' => \yii\mail\MailerInterface::class,
        'log' => [
            'traceLevel' => YII_DEBUG ? 3 : 0,
            'targets' => [
                [
                    'class' => \yii\log\FileTarget::class,
                    'levels' => ['error', 'warning'],
                ],
            ],
        ],
        'db' => $db,
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

if (YII_ENV_DEV) {
    $config['bootstrap'][] = 'debug';
    $config['modules']['debug'] = [
        'class' => \yii\debug\Module::class,
    ];

    $config['bootstrap'][] = 'gii';
    $config['modules']['gii'] = [
        'class' => \yii\gii\Module::class,
    ];
}

return $config;
