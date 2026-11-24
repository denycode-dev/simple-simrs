<?php

declare(strict_types=1);

namespace app\tests\Functional;

use app\tests\Support\FunctionalTester;

/**
 * QueueLifecycleCest verifies the lifecycle transition of registration status.
 */
final class QueueLifecycleCest
{
    private string $regToken = 'access_token_reg_000000000000002';

    public function testStatusTransitionsThroughLifecycle(FunctionalTester $I): void
    {
        $I->haveHttpHeader('Accept', 'application/json');
        $I->haveHttpHeader('Authorization', 'Bearer ' . $this->regToken);

        // 1. Create initial registration (status starts as WAITING_NURSE)
        $I->sendAjaxPostRequest('/api/v1/registrations', [
            'patient_id' => 1,
            'polyclinic_id' => 1,
            'doctor_id' => 1,
            'schedule_id' => 1,
            'insurance_type' => 'GENERAL',
        ]);
        $I->seeResponseCodeIs(201);
        $created = json_decode($I->grabPageSource(), true);
        $regId = $created['data']['id'];
        $I->assertSame('WAITING_NURSE', $created['data']['status']);

        // 2. Transition: WAITING_NURSE -> IN_NURSE
        $I->sendAjaxRequest('PATCH', "/api/v1/registrations/{$regId}/status", [
            'status' => 'IN_NURSE',
        ]);
        $I->seeResponseCodeIs(200);
        $json = json_decode($I->grabPageSource(), true);
        $I->assertSame('IN_NURSE', $json['data']['status']);

        // 3. Transition: IN_NURSE -> WAITING_DOCTOR
        $I->sendAjaxRequest('PATCH', "/api/v1/registrations/{$regId}/status", [
            'status' => 'WAITING_DOCTOR',
        ]);
        $I->seeResponseCodeIs(200);
        $json = json_decode($I->grabPageSource(), true);
        $I->assertSame('WAITING_DOCTOR', $json['data']['status']);

        // 4. Transition: WAITING_DOCTOR -> IN_DOCTOR
        $I->sendAjaxRequest('PATCH', "/api/v1/registrations/{$regId}/status", [
            'status' => 'IN_DOCTOR',
        ]);
        $I->seeResponseCodeIs(200);
        $json = json_decode($I->grabPageSource(), true);
        $I->assertSame('IN_DOCTOR', $json['data']['status']);

        // 5. Transition: IN_DOCTOR -> PHARMACY
        $I->sendAjaxRequest('PATCH', "/api/v1/registrations/{$regId}/status", [
            'status' => 'PHARMACY',
        ]);
        $I->seeResponseCodeIs(200);
        $json = json_decode($I->grabPageSource(), true);
        $I->assertSame('PHARMACY', $json['data']['status']);

        // 6. Transition: PHARMACY -> BILLING
        $I->sendAjaxRequest('PATCH', "/api/v1/registrations/{$regId}/status", [
            'status' => 'BILLING',
        ]);
        $I->seeResponseCodeIs(200);
        $json = json_decode($I->grabPageSource(), true);
        $I->assertSame('BILLING', $json['data']['status']);

        // 7. Transition: BILLING -> COMPLETED
        $I->sendAjaxRequest('PATCH', "/api/v1/registrations/{$regId}/status", [
            'status' => 'COMPLETED',
        ]);
        $I->seeResponseCodeIs(200);
        $json = json_decode($I->grabPageSource(), true);
        $I->assertSame('COMPLETED', $json['data']['status']);
    }

    public function testInvalidStatusTransitionRejected(FunctionalTester $I): void
    {
        $I->haveHttpHeader('Accept', 'application/json');
        $I->haveHttpHeader('Authorization', 'Bearer ' . $this->regToken);

        $I->sendAjaxPostRequest('/api/v1/registrations', [
            'patient_id' => 1,
            'polyclinic_id' => 1,
            'doctor_id' => 1,
            'schedule_id' => 1,
            'insurance_type' => 'GENERAL',
        ]);
        $I->seeResponseCodeIs(201);
        $created = json_decode($I->grabPageSource(), true);
        $regId = $created['data']['id'];

        $I->sendAjaxRequest('PATCH', "/api/v1/registrations/{$regId}/status", [
            'status' => 'BOGUS_STATUS',
        ]);
        $I->seeResponseCodeIs(422);

        $json = json_decode($I->grabPageSource(), true);
        $I->assertFalse($json['success']);
        $I->assertArrayHasKey('status', $json['errors']);
    }
}
