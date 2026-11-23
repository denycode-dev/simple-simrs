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
 * It configures CORS, JSON content negotiation, CSRF exemption, and unified Indonesian response formatting.
 */
class BaseApiController extends Controller
{
    /**
     * Disable CSRF validation for stateless REST API controllers.
     * @var bool
     */
    public $enableCsrfValidation = false;

    /**
     * {@inheritdoc}
     */
    public function behaviors(): array
    {
        $behaviors = parent::behaviors();

        // 1. CORS filter must be placed before authentication and content negotiation filters
        $behaviors['corsFilter'] = [
            'class' => Cors::class,
            'cors' => [
                'Origin' => ['*'],
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
     * Route: GET/POST /api/v1/ping
     */
    public function actionIndex(): array
    {
        $body = Yii::$app->request->getBodyParams();
        $data = ['status' => 'online'];
        if (!empty($body)) {
            $data['received'] = $body;
        }

        return $this->successResponse($data, 'SIMRS API Gateway Aktif');
    }

    /**
     * Handle preflight OPTIONS requests cleanly.
     */
    public function actionOptions(): array
    {
        Yii::$app->response->statusCode = 200;
        return [];
    }

    /**
     * Standard success JSON response in Indonesian format.
     *
     * @param mixed $data Payload data
     * @param string $message Descriptive Indonesian message
     * @param int $statusCode HTTP status code (default 200)
     * @return array Standardized envelope [success, message, data]
     */
    public function successResponse(mixed $data = null, string $message = 'Operasi berhasil.', int $statusCode = 200): array
    {
        Yii::$app->response->statusCode = $statusCode;
        return [
            'success' => true,
            'message' => $message,
            'data' => $data,
        ];
    }

    /**
     * Standard error JSON response in Indonesian format.
     *
     * @param string $message Descriptive Indonesian error message
     * @param mixed $errors Optional error details/validation errors
     * @param int $statusCode HTTP status code (default 400)
     * @return array Standardized envelope [success, message, errors, data]
     */
    public function errorResponse(string $message = 'Terjadi kesalahan.', mixed $errors = null, int $statusCode = 400): array
    {
        Yii::$app->response->statusCode = $statusCode;
        return [
            'success' => false,
            'message' => $message,
            'errors' => $errors,
            'data' => null,
        ];
    }

    /**
     * Standardized 422 HTTP validation error response.
     *
     * @param mixed $errors Field validation errors
     * @param string $message Validation summary message in Indonesian
     * @return array Standardized envelope [success, message, errors, data]
     */
    public function validationErrorResponse(mixed $errors = null, string $message = 'Validasi data masukan gagal.'): array
    {
        return $this->errorResponse($message, $errors, 422);
    }

    /**
     * Standardized 401 HTTP unauthorized error response.
     */
    public function unauthorizedResponse(string $message = 'Autentikasi gagal. Token Bearer diperlukan.'): array
    {
        return $this->errorResponse($message, null, 401);
    }

    /**
     * Standardized 403 HTTP forbidden error response.
     */
    public function forbiddenResponse(string $message = 'Akses ditolak. Anda tidak memiliki izin untuk tindakan ini.'): array
    {
        return $this->errorResponse($message, null, 403);
    }

    /**
     * Standardized 404 HTTP not found error response.
     */
    public function notFoundResponse(string $message = 'Endpoint atau sumber daya tidak ditemukan.'): array
    {
        return $this->errorResponse($message, null, 404);
    }

    /**
     * Standardized 500 HTTP server error response.
     */
    public function serverErrorResponse(string $message = 'Terjadi kesalahan internal pada server.'): array
    {
        return $this->errorResponse($message, null, 500);
    }

    // Backwards-compatibility aliases
    public function asSuccess(mixed $data = null, string $message = 'Operasi berhasil.', int $statusCode = 200): array
    {
        return $this->successResponse($data, $message, $statusCode);
    }

    public function asError(string $message = 'Terjadi kesalahan.', int $statusCode = 400, mixed $errors = null): array
    {
        return $this->errorResponse($message, $errors, $statusCode);
    }

    public function asValidationError(array $errors, string $message = 'Validasi data masukan gagal.'): array
    {
        return $this->validationErrorResponse($errors, $message);
    }
}
