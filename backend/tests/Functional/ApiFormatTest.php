<?php

declare(strict_types=1);

namespace app\tests\Functional;

use Codeception\Test\Unit;
use app\controllers\api\BaseApiController;
use app\tests\Support\FunctionalTester;
use Yii;
use yii\web\Response;

/**
 * ApiFormatTest verifies REST API response formatting, Indonesian error envelopes,
 * and CORS headers configured in Task 5.
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
     * Verifies that OPTIONS preflight request to /api/v1/ping returns appropriate CORS headers.
     */
    public function testCorsPreflightOptionsReturnsAllowedHeaders(): void
    {
        $this->tester->haveHttpHeader('Origin', 'http://localhost:5173');
        $this->tester->haveHttpHeader('Access-Control-Request-Method', 'GET');
        $this->tester->haveHttpHeader('Access-Control-Request-Headers', 'Authorization, Content-Type');
        $this->tester->sendAjaxRequest('OPTIONS', '/api/v1/ping');
        $this->tester->seeResponseCodeIs(200);

        $originHeader = Yii::$app->response->headers->get('Access-Control-Allow-Origin');
        $this->assertSame('http://localhost:5173', $originHeader, 'CORS must allow Vite origin http://localhost:5173');
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
        $this->assertArrayHasKey('data', $data);
        $this->assertNull($data['data']);
    }

    /**
     * Verifies BaseApiController helper response methods directly.
     */
    public function testBaseApiControllerHelperMethods(): void
    {
        $controller = new class('test', Yii::$app) extends BaseApiController {};

        $success = $controller->asSuccess(['id' => 1], 'Data berhasil disimpan', 201);
        $this->assertTrue($success['success']);
        $this->assertSame('Data berhasil disimpan', $success['message']);
        $this->assertSame(['id' => 1], $success['data']);
        $this->assertSame(201, Yii::$app->response->statusCode);

        $error = $controller->asError('Terjadi kegagalan proses', 400);
        $this->assertFalse($error['success']);
        $this->assertSame('Terjadi kegagalan proses', $error['message']);
        $this->assertNull($error['data']);
        $this->assertSame(400, Yii::$app->response->statusCode);

        $validation = $controller->asValidationError(['nik' => ['NIK harus 16 digit']]);
        $this->assertFalse($validation['success']);
        $this->assertSame('Validasi input gagal', $validation['message']);
        $this->assertSame(['nik' => ['NIK harus 16 digit']], $validation['errors']);
        $this->assertSame(422, Yii::$app->response->statusCode);
    }
}
