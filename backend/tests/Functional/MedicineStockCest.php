<?php

declare(strict_types=1);

namespace app\tests\Functional;

use app\tests\Support\FunctionalTester;

/**
 * MedicineStockCest verifies medical actions, medicines, and stock mutation logging.
 */
final class MedicineStockCest
{
    private string $adminToken = 'access_token_admin_00000000000001';
    private string $pharmaToken = 'access_token_pharma_0000000000005';

    public function getMedicalActionsList(FunctionalTester $I): void
    {
        $I->haveHttpHeader('Accept', 'application/json');
        $I->haveHttpHeader('Authorization', 'Bearer ' . $this->adminToken);
        $I->sendAjaxGetRequest('/api/v1/medical-actions');
        $I->seeResponseCodeIs(200);

        $json = json_decode($I->grabPageSource(), true);
        $I->assertTrue($json['success']);
        $I->assertNotEmpty($json['data']);
    }

    public function getMedicinesList(FunctionalTester $I): void
    {
        $I->haveHttpHeader('Accept', 'application/json');
        $I->haveHttpHeader('Authorization', 'Bearer ' . $this->pharmaToken);
        $I->sendAjaxGetRequest('/api/v1/medicines');
        $I->seeResponseCodeIs(200);

        $json = json_decode($I->grabPageSource(), true);
        $I->assertTrue($json['success']);
        $I->assertNotEmpty($json['data']);
    }

    public function adjustMedicineStockSuccessfully(FunctionalTester $I): void
    {
        $I->haveHttpHeader('Accept', 'application/json');
        $I->haveHttpHeader('Authorization', 'Bearer ' . $this->pharmaToken);
        // Medicine 1 is Paracetamol 500mg (initial seed stock 100)
        $I->sendAjaxPostRequest('/api/v1/medicines/1/adjust-stock', [
            'transaction_type' => 'IN',
            'quantity' => 50,
            'notes' => 'Penerimaan stok tambahan dari gudang farmasi',
        ]);
        $I->seeResponseCodeIs(200);

        $json = json_decode($I->grabPageSource(), true);
        $I->assertTrue($json['success']);
        $I->assertSame(550, (int)$json['data']['medicine']['stock']);
        $I->assertSame('IN', $json['data']['log']['transaction_type']);
        $I->assertSame(50, (int)$json['data']['log']['quantity']);
        $I->assertSame(550, (int)$json['data']['log']['balance_after']);
    }

    public function adjustMedicineStockFailsWhenStockInsufficient(FunctionalTester $I): void
    {
        $I->haveHttpHeader('Accept', 'application/json');
        $I->haveHttpHeader('Authorization', 'Bearer ' . $this->pharmaToken);
        $I->sendAjaxPostRequest('/api/v1/medicines/1/adjust-stock', [
            'transaction_type' => 'OUT',
            'quantity' => 9999, // Exceeds current stock
            'notes' => 'Pengeluaran melebihi batas',
        ]);
        $I->seeResponseCodeIs(422);

        $json = json_decode($I->grabPageSource(), true);
        $I->assertFalse($json['success']);
        $I->assertStringContainsString('tidak mencukupi', $json['message']);
    }
}
