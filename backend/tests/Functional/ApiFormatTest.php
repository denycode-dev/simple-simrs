<?php

declare(strict_types=1);

namespace app\tests\Functional;

use Codeception\Test\Unit;
use app\controllers\api\BaseApiController;
use app\tests\Support\FunctionalTester;
use Yii;
use yii\web\Request;

/**
 * ApiFormatTest verifies REST API response formatting, Indonesian error envelopes,
 * JSON body parsing, CORS headers, and BaseApiController helpers configured in Task 5.
 */
final class ApiFormatTest extends Unit
{
    protected FunctionalTester $tester;

    /**
     * Verifies that GET /api/v1/ping returns the standard success envelope in JSON.
     */
    public function testPingEndpointReturnsStandardSuccessEnvelope(): void
    {
        $this->tester->haveHttpHeader('Accept', 'application/json');
        $this->tester->sendAjaxGetRequest('/api/v1/ping');
        $this->tester->seeResponseCodeIs(200);

        $rawResponse = $this->tester->grabPageSource();
        $data = json_decode($rawResponse, true);

        $this->assertIsArray($data, 'Response must be valid JSON');
        $this->assertArrayHasKey('success', $data, 'JSON response must contain `success` key');
        $this->assertTrue($data['success'], '`success` must be true');
        $this->assertArrayHasKey('message', $data, 'JSON response must contain `message` key');
        $this->assertSame('SIMRS API Gateway Aktif', $data['message']);
        $this->assertArrayHasKey('data', $data, 'JSON response must contain `data` key');
        $this->assertSame(['status' => 'online'], $data['data']);
    }

    /**
     * Verifies that JSON body parser is properly configured and parses JSON payloads.
     */
    public function testJsonBodyParserParsesPayload(): void
    {
        $request = Yii::$app->request;
        $request->getHeaders()->set('Content-Type', 'application/json');
        $request->setRawBody(json_encode([
            'test_param' => 'simrs_value_123',
            'nested' => ['role' => 'admin'],
        ]));
        $request->setBodyParams(null);

        $parsed = $request->getBodyParams();
        $this->assertIsArray($parsed, 'Request body params must be parsed as array');
        $this->assertSame('simrs_value_123', $parsed['test_param']);
        $this->assertSame('admin', $parsed['nested']['role']);
    }

    /**
     * Verifies that POST requests to API endpoints succeed without CSRF tokens (CSRF exemption).
     */
    public function testPostRequestCsrfExemptionAndEnvelope(): void
    {
        $this->tester->haveHttpHeader('Accept', 'application/json');
        $this->tester->sendAjaxPostRequest('/api/v1/ping', [
            'test_param' => 'simrs_value_123',
        ]);
        $this->tester->seeResponseCodeIs(200);

        $rawResponse = $this->tester->grabPageSource();
        $data = json_decode($rawResponse, true);

        $this->assertIsArray($data, 'Response must be valid JSON');
        $this->assertTrue($data['success']);
        $this->assertSame('SIMRS API Gateway Aktif', $data['message']);
        $this->assertArrayHasKey('received', $data['data']);
        $this->assertSame('simrs_value_123', $data['data']['received']['test_param']);
    }

    /**
     * Verifies that OPTIONS preflight request to /api/v1/ping returns Access-Control-Allow-Origin: *.
     */
    public function testCorsPreflightOptionsReturnsAllowedHeaders(): void
    {
        $this->tester->haveHttpHeader('Origin', 'http://localhost:5173');
        $this->tester->haveHttpHeader('Access-Control-Request-Method', 'GET');
        $this->tester->haveHttpHeader('Access-Control-Request-Headers', 'Authorization, Content-Type');
        $this->tester->sendAjaxRequest('OPTIONS', '/api/v1/ping');
        $this->tester->seeResponseCodeIs(200);

        $originHeader = Yii::$app->response->headers->get('Access-Control-Allow-Origin');
        $this->assertSame('*', $originHeader, 'CORS must allow wildcard origin *');

        $methodsHeader = Yii::$app->response->headers->get('Access-Control-Allow-Methods');
        $this->assertNotEmpty($methodsHeader, 'Access-Control-Allow-Methods must not be empty');
        $this->assertStringContainsString('GET', $methodsHeader);
        $this->assertStringContainsString('POST', $methodsHeader);
        $this->assertStringContainsString('OPTIONS', $methodsHeader);
    }

    /**
     * Verifies that requesting a non-existent API route returns standardized Indonesian 404 envelope.
     */
    public function testNotFoundEndpointReturnsStandardIndonesianErrorEnvelope(): void
    {
        $this->tester->haveHttpHeader('Accept', 'application/json');
        $this->tester->sendAjaxGetRequest('/api/v1/non-existent-endpoint');
        $this->tester->seeResponseCodeIs(404);

        $rawResponse = $this->tester->grabPageSource();
        $data = json_decode($rawResponse, true);

        $this->assertIsArray($data, 'Error response must be valid JSON');
        $this->assertArrayHasKey('success', $data);
        $this->assertFalse($data['success'], '`success` must be false for error response');
        $this->assertArrayHasKey('message', $data);
        $this->assertSame('Endpoint atau sumber daya tidak ditemukan.', $data['message']);
        $this->assertArrayHasKey('errors', $data);
        $this->assertNull($data['errors']);
        $this->assertArrayHasKey('data', $data);
        $this->assertNull($data['data']);
    }

    /**
     * Verifies BaseApiController helper response methods and Indonesian envelopes directly.
     */
    public function testBaseApiControllerHelperMethods(): void
    {
        $controller = new class('test', Yii::$app) extends BaseApiController {};

        // 1. Success response
        $success = $controller->successResponse(['id' => 1], 'Data berhasil disimpan.', 201);
        $this->assertTrue($success['success']);
        $this->assertSame('Data berhasil disimpan.', $success['message']);
        $this->assertSame(['id' => 1], $success['data']);
        $this->assertSame(201, Yii::$app->response->statusCode);

        // 2. Generic error response
        $error = $controller->errorResponse('Terjadi kesalahan pada sistem.', ['field' => 'Nilai tidak valid'], 400);
        $this->assertFalse($error['success']);
        $this->assertSame('Terjadi kesalahan pada sistem.', $error['message']);
        $this->assertSame(['field' => 'Nilai tidak valid'], $error['errors']);
        $this->assertNull($error['data']);
        $this->assertSame(400, Yii::$app->response->statusCode);

        // 3. Validation error (422)
        $validation = $controller->validationErrorResponse(['nik' => ['NIK harus 16 digit']]);
        $this->assertFalse($validation['success']);
        $this->assertSame('Validasi data masukan gagal.', $validation['message']);
        $this->assertSame(['nik' => ['NIK harus 16 digit']], $validation['errors']);
        $this->assertNull($validation['data']);
        $this->assertSame(422, Yii::$app->response->statusCode);

        // 4. Unauthorized (401)
        $unauth = $controller->unauthorizedResponse();
        $this->assertFalse($unauth['success']);
        $this->assertSame('Autentikasi gagal. Token Bearer diperlukan.', $unauth['message']);
        $this->assertSame(401, Yii::$app->response->statusCode);

        // 5. Forbidden (403)
        $forbidden = $controller->forbiddenResponse();
        $this->assertFalse($forbidden['success']);
        $this->assertSame('Akses ditolak. Anda tidak memiliki izin untuk tindakan ini.', $forbidden['message']);
        $this->assertSame(403, Yii::$app->response->statusCode);

        // 6. Not Found (404)
        $notFound = $controller->notFoundResponse();
        $this->assertFalse($notFound['success']);
        $this->assertSame('Endpoint atau sumber daya tidak ditemukan.', $notFound['message']);
        $this->assertSame(404, Yii::$app->response->statusCode);

        // 7. Server Error (500)
        $serverErr = $controller->serverErrorResponse();
        $this->assertFalse($serverErr['success']);
        $this->assertSame('Terjadi kesalahan internal pada server.', $serverErr['message']);
        $this->assertSame(500, Yii::$app->response->statusCode);

        // 8. Backwards compatibility aliases
        $asSucc = $controller->asSuccess(['ok' => true]);
        $this->assertTrue($asSucc['success']);
        $asErr = $controller->asError('Gagal');
        $this->assertFalse($asErr['success']);
        $asVal = $controller->asValidationError(['field' => ['Wajib diisi']]);
        $this->assertSame(422, Yii::$app->response->statusCode);
        $this->assertSame(['field' => ['Wajib diisi']], $asVal['errors']);
    }

    /**
     * Verifies that UrlManager REST rules for auth endpoints are configured.
     */
    public function testUrlManagerRestAuthRules(): void
    {
        $urlManager = Yii::$app->urlManager;

        // Login route (POST)
        $loginRequest = new Request(['url' => '/api/v1/auth/login']);
        $loginRequest->headers->set('X-Http-Method-Override', 'POST');
        $result = $urlManager->parseRequest($loginRequest);
        $this->assertNotFalse($result, 'POST /api/v1/auth/login should match a rule');
        $this->assertSame('api/auth/login', $result[0]);

        // Me route (GET)
        $meRequest = new Request(['url' => '/api/v1/auth/me']);
        $meRequest->headers->set('X-Http-Method-Override', 'GET');
        $result = $urlManager->parseRequest($meRequest);
        $this->assertNotFalse($result, 'GET /api/v1/auth/me should match a rule');
        $this->assertSame('api/auth/me', $result[0]);

        // Logout route (POST)
        $logoutRequest = new Request(['url' => '/api/v1/auth/logout']);
        $logoutRequest->headers->set('X-Http-Method-Override', 'POST');
        $result = $urlManager->parseRequest($logoutRequest);
        $this->assertNotFalse($result, 'POST /api/v1/auth/logout should match a rule');
        $this->assertSame('api/auth/logout', $result[0]);
    }
}
