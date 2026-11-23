<?php

declare(strict_types=1);

namespace app\controllers\api;

use Yii;
use yii\filters\ContentNegotiator;
use yii\filters\Cors;
use yii\rest\Controller;
use yii\web\Response;

/**
 * BaseApiController serves as the foundational abstract controller for all REST API endpoints.
 * It configures CORS, JSON content negotiation, and unified Indonesian response formatting.
 */
class BaseApiController extends Controller
{
    /**
     * {@inheritdoc}
     */
    public function behaviors(): array
    {
        $behaviors = parent::behaviors();

        // 1. CORS filter must be placed before authentication filters
        $behaviors['corsFilter'] = [
            'class' => Cors::class,
            'cors' => [
                'Origin' => [
                    'http://localhost:5173',
                    'http://127.0.0.1:5173',
                    'http://localhost:3000',
                ],
                'Access-Control-Request-Method' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
                'Access-Control-Request-Headers' => ['Authorization', 'Content-Type', 'X-Requested-With', 'Accept', 'Origin', '*'],
                'Access-Control-Allow-Credentials' => false,
                'Access-Control-Max-Age' => 86400,
                'Access-Control-Expose-Headers' => [
                    'X-Pagination-Current-Page',
                    'X-Pagination-Page-Count',
                    'X-Pagination-Per-Page',
                    'X-Pagination-Total-Count',
                    'Link',
                ],
            ],
        ];

        // 2. Enforce JSON content negotiation for all API endpoints
        $behaviors['contentNegotiator'] = [
            'class' => ContentNegotiator::class,
            'formats' => [
                'application/json' => Response::FORMAT_JSON,
            ],
        ];

        return $behaviors;
    }

    /**
     * Health check and gateway verification action.
     * Route: GET /api/v1/ping
     */
    public function actionIndex(): array
    {
        return $this->asSuccess(['status' => 'online'], 'SIMRS API Gateway Aktif');
    }

    /**
     * Returns a standardized success JSON response.
     *
     * @param mixed $data Payload data
     * @param string $message Descriptive Indonesian message
     * @param int $statusCode HTTP status code (default 200)
     * @return array Standardized envelope [success, message, data]
     */
    public function asSuccess(mixed $data = null, string $message = 'Operasi berhasil', int $statusCode = 200): array
    {
        Yii::$app->response->statusCode = $statusCode;
        return [
            'success' => true,
            'message' => $message,
            'data' => $data,
        ];
    }

    /**
     * Returns a standardized error JSON response.
     *
     * @param string $message Descriptive Indonesian error message
     * @param int $statusCode HTTP status code (default 400)
     * @param mixed $errors Optional error details
     * @return array Standardized envelope [success, message, data/errors]
     */
    public function asError(string $message = 'Terjadi kesalahan pada sistem', int $statusCode = 400, mixed $errors = null): array
    {
        Yii::$app->response->statusCode = $statusCode;
        $response = [
            'success' => false,
            'message' => $message,
        ];
        if ($errors !== null) {
            $response['errors'] = $errors;
        } else {
            $response['data'] = null;
        }
        return $response;
    }

    /**
     * Returns a standardized 422 HTTP validation error response.
     *
     * @param array $errors Field validation errors
     * @param string $message Validation summary message in Indonesian
     * @return array Standardized envelope [success, message, errors]
     */
    public function asValidationError(array $errors, string $message = 'Validasi input gagal'): array
    {
        return $this->asError($message, 422, $errors);
    }
}
