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
        try { $url = $request->getUrl(); } catch (\Throwable) { $url = ''; }
        try { $acceptHeader = $request->headers->get('Accept', ''); } catch (\Throwable) { $acceptHeader = ''; }

        // Determine if this is an API request (disable CSRF & default to JSON response)
        $isApi = str_starts_with($url, '/api') || (str_contains($acceptHeader, 'application/json') && !str_starts_with($url, '/debug') && !str_starts_with($url, '/gii'));
        if ($isApi) {
            Yii::$app->response->format = Response::FORMAT_JSON;
            $request->enableCsrfValidation = false;
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
                try { $url = $request->getUrl(); } catch (\Throwable) { $url = ''; }
                try { $acceptHeader = $request->headers->get('Accept', ''); } catch (\Throwable) { $acceptHeader = ''; }

                $isApi = str_starts_with($url, '/api') || (str_contains($acceptHeader, 'application/json') && !str_starts_with($url, '/debug') && !str_starts_with($url, '/gii'));
                if (!$isApi) {
                    return;
                }

                if ($response->format !== Response::FORMAT_RAW) {
                    $response->format = Response::FORMAT_JSON;
                }

                if ($response->format === Response::FORMAT_JSON) {
                    $data = $response->data;

                    // If already formatted with standard envelope, do not double-wrap
                    if (is_array($data) && isset($data['success'])) {
                        return;
                    }

                    if ($response->isSuccessful) {
                        $response->data = [
                            'success' => true,
                            'message' => 'Operasi berhasil.',
                            'data' => $data,
                        ];
                    } else {
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

                        $message = $defaultMessages[$status] ?? (is_array($data) && !empty($data['message']) ? $data['message'] : 'Terjadi kesalahan pada sistem.');

                        $errors = null;
                        if ($status === 422) {
                            $errors = is_array($data) ? ($data['errors'] ?? $data) : ['error' => (string) $data];
                        } elseif (is_array($data) && isset($data['errors'])) {
                            $errors = $data['errors'];
                        }

                        $response->data = [
                            'success' => false,
                            'message' => $message,
                            'errors' => $errors,
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
                // Ping & Healthcheck
                'GET api/v1/ping' => 'api/base-api/index',
                'POST api/v1/ping' => 'api/base-api/index',
                'OPTIONS api/v1/ping' => 'api/base-api/options',

                // Auth REST endpoints (Milestone 4 / Task 7)
                'POST api/v1/auth/login' => 'api/auth/login',
                'GET api/v1/auth/me' => 'api/auth/me',
                'POST api/v1/auth/logout' => 'api/auth/logout',
                'OPTIONS api/v1/auth/<action:(login|me|logout)>' => 'api/auth/options',

                // Patients Master REST endpoints (Task 8)
                'GET api/v1/patients' => 'api/patient/index',
                'POST api/v1/patients' => 'api/patient/create',
                'GET api/v1/patients/<id:\d+>' => 'api/patient/view',
                'PUT api/v1/patients/<id:\d+>' => 'api/patient/update',
                'PATCH api/v1/patients/<id:\d+>' => 'api/patient/update',
                'DELETE api/v1/patients/<id:\d+>' => 'api/patient/delete',
                'OPTIONS api/v1/patients/<id:\d+>' => 'api/patient/options',
                'OPTIONS api/v1/patients' => 'api/patient/options',

                // Doctors Master REST endpoints (Task 9)
                'GET api/v1/doctors' => 'api/doctor/index',
                'POST api/v1/doctors' => 'api/doctor/create',
                'GET api/v1/doctors/<id:\d+>' => 'api/doctor/view',
                'PUT api/v1/doctors/<id:\d+>' => 'api/doctor/update',
                'PATCH api/v1/doctors/<id:\d+>' => 'api/doctor/update',
                'OPTIONS api/v1/doctors/<id:\d+>' => 'api/doctor/options',
                'OPTIONS api/v1/doctors' => 'api/doctor/options',

                // Polyclinics Master REST endpoints (Task 9)
                'GET api/v1/polyclinics' => 'api/polyclinic/index',
                'POST api/v1/polyclinics' => 'api/polyclinic/create',
                'GET api/v1/polyclinics/<id:\d+>' => 'api/polyclinic/view',
                'PUT api/v1/polyclinics/<id:\d+>' => 'api/polyclinic/update',
                'PATCH api/v1/polyclinics/<id:\d+>' => 'api/polyclinic/update',
                'OPTIONS api/v1/polyclinics/<id:\d+>' => 'api/polyclinic/options',
                'OPTIONS api/v1/polyclinics' => 'api/polyclinic/options',

                // Doctor Schedules REST endpoints (Task 9)
                'GET api/v1/doctor-schedules' => 'api/doctor-schedule/index',
                'POST api/v1/doctor-schedules' => 'api/doctor-schedule/create',
                'GET api/v1/doctor-schedules/<id:\d+>' => 'api/doctor-schedule/view',
                'PUT api/v1/doctor-schedules/<id:\d+>' => 'api/doctor-schedule/update',
                'PATCH api/v1/doctor-schedules/<id:\d+>' => 'api/doctor-schedule/update',
                'DELETE api/v1/doctor-schedules/<id:\d+>' => 'api/doctor-schedule/delete',
                'OPTIONS api/v1/doctor-schedules/<id:\d+>' => 'api/doctor-schedule/options',
                'OPTIONS api/v1/doctor-schedules' => 'api/doctor-schedule/options',

                // Medical Actions REST endpoints (Task 10)
                'GET api/v1/medical-actions' => 'api/medical-action/index',
                'POST api/v1/medical-actions' => 'api/medical-action/create',
                'GET api/v1/medical-actions/<id:\d+>' => 'api/medical-action/view',
                'PUT api/v1/medical-actions/<id:\d+>' => 'api/medical-action/update',
                'PATCH api/v1/medical-actions/<id:\d+>' => 'api/medical-action/update',
                'OPTIONS api/v1/medical-actions/<id:\d+>' => 'api/medical-action/options',
                'OPTIONS api/v1/medical-actions' => 'api/medical-action/options',

                // Medicines & Stock Mutation REST endpoints (Task 10)
                'GET api/v1/medicines' => 'api/medicine/index',
                'POST api/v1/medicines' => 'api/medicine/create',
                'POST api/v1/medicines/<id:\d+>/adjust-stock' => 'api/medicine/adjust-stock',
                'GET api/v1/medicines/<id:\d+>' => 'api/medicine/view',
                'PUT api/v1/medicines/<id:\d+>' => 'api/medicine/update',
                'PATCH api/v1/medicines/<id:\d+>' => 'api/medicine/update',
                'OPTIONS api/v1/medicines/<id:\d+>/adjust-stock' => 'api/medicine/options',
                'OPTIONS api/v1/medicines/<id:\d+>' => 'api/medicine/options',
                'OPTIONS api/v1/medicines' => 'api/medicine/options',

                // Registrations & Queue REST endpoints (Task 12 & Task 14)
                'GET api/v1/registrations' => 'api/registration/index',
                'POST api/v1/registrations' => 'api/registration/create',
                'GET api/v1/registrations/<id:\d+>' => 'api/registration/view',
                'PATCH api/v1/registrations/<id:\d+>/status' => 'api/registration/update-status',
                'OPTIONS api/v1/registrations/<id:\d+>/status' => 'api/registration/options',
                'OPTIONS api/v1/registrations/<id:\d+>' => 'api/registration/options',
                'OPTIONS api/v1/registrations' => 'api/registration/options',

                // Nurse Assessments REST endpoints (Task 15)
                'GET api/v1/nurse-assessments' => 'api/nurse-assessment/index',
                'POST api/v1/nurse-assessments' => 'api/nurse-assessment/create',
                'GET api/v1/nurse-assessments/<id:\d+>' => 'api/nurse-assessment/view',
                'OPTIONS api/v1/nurse-assessments/<id:\d+>' => 'api/nurse-assessment/options',
                'OPTIONS api/v1/nurse-assessments' => 'api/nurse-assessment/options',

                // Doctor Examinations REST endpoints (Task 17)
                'GET api/v1/examinations' => 'api/examination/index',
                'POST api/v1/examinations' => 'api/examination/create',
                'GET api/v1/examinations/<id:\d+>' => 'api/examination/view',
                'PUT api/v1/examinations/<id:\d+>' => 'api/examination/update',
                'PATCH api/v1/examinations/<id:\d+>' => 'api/examination/update',
                'OPTIONS api/v1/examinations/<id:\d+>' => 'api/examination/options',
                'OPTIONS api/v1/examinations' => 'api/examination/options',

                // Examination Actions REST endpoints (Task 19)
                'POST api/v1/examinations/<id:\d+>/actions' => 'api/examination/add-action',
                'GET api/v1/examinations/<id:\d+>/actions' => 'api/examination/get-actions',
                'DELETE api/v1/examinations/<id:\d+>/actions/<actionId:\d+>' => 'api/examination/remove-action',
                'OPTIONS api/v1/examinations/<id:\d+>/actions' => 'api/examination/options',
                'OPTIONS api/v1/examinations/<id:\d+>/actions/<actionId:\d+>' => 'api/examination/options',

                // CORS Preflight routing for REST API
                'OPTIONS api/v1/<controller:[a-zA-Z0-9-]+>/<action:[a-zA-Z0-9-]+>' => 'api/<controller>/options',
                'OPTIONS api/v1/<controller:[a-zA-Z0-9-]+>' => 'api/<controller>/options',

                // Standard API routing
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
