<?php

declare(strict_types=1);

namespace app\tests\Functional;

use app\tests\Support\FunctionalTester;

/**
 * ScheduleConflictCest tests doctors, polyclinics, and schedule overlap prevention.
 */
final class ScheduleConflictCest
{
    private string $adminToken = 'access_token_admin_00000000000001';

    public function getDoctorsList(FunctionalTester $I): void
    {
        $I->haveHttpHeader('Accept', 'application/json');
        $I->haveHttpHeader('Authorization', 'Bearer ' . $this->adminToken);
        $I->sendAjaxGetRequest('/api/v1/doctors');
        $I->seeResponseCodeIs(200);

        $json = json_decode($I->grabPageSource(), true);
        $I->assertTrue($json['success']);
        $I->assertNotEmpty($json['data']);
    }

    public function getPolyclinicsList(FunctionalTester $I): void
    {
        $I->haveHttpHeader('Accept', 'application/json');
        $I->haveHttpHeader('Authorization', 'Bearer ' . $this->adminToken);
        $I->sendAjaxGetRequest('/api/v1/polyclinics');
        $I->seeResponseCodeIs(200);

        $json = json_decode($I->grabPageSource(), true);
        $I->assertTrue($json['success']);
        $I->assertNotEmpty($json['data']);
    }

    public function createValidDoctorSchedule(FunctionalTester $I): void
    {
        $I->haveHttpHeader('Accept', 'application/json');
        $I->haveHttpHeader('Authorization', 'Bearer ' . $this->adminToken);
        $I->sendAjaxPostRequest('/api/v1/doctor-schedules', [
            'doctor_id' => 1,
            'polyclinic_id' => 1,
            'day_of_week' => 'Kamis',
            'start_time' => '13:00',
            'end_time' => '16:00',
            'quota' => 20,
        ]);
        $I->seeResponseCodeIs(201);

        $json = json_decode($I->grabPageSource(), true);
        $I->assertTrue($json['success']);
        $I->assertSame('Kamis', $json['data']['day_of_week']);
    }

    public function rejectConflictingDoctorSchedule(FunctionalTester $I): void
    {
        // Dokter 1 already has schedule on Senin 08:00 - 12:00 in seed
        $I->haveHttpHeader('Accept', 'application/json');
        $I->haveHttpHeader('Authorization', 'Bearer ' . $this->adminToken);
        $I->sendAjaxPostRequest('/api/v1/doctor-schedules', [
            'doctor_id' => 1,
            'polyclinic_id' => 2, // Even in another polyclinic
            'day_of_week' => 'Senin',
            'start_time' => '10:00', // Overlaps with 08:00 - 12:00
            'end_time' => '14:00',
            'quota' => 15,
        ]);
        $I->seeResponseCodeIs(422);

        $json = json_decode($I->grabPageSource(), true);
        $I->assertFalse($json['success']);
        $I->assertArrayHasKey('start_time', $json['errors']);
        $I->assertStringContainsString('bentrok', $json['errors']['start_time'][0]);
    }
}
