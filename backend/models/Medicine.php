<?php

declare(strict_types=1);

namespace app\models;

use Yii;
use yii\db\ActiveQuery;
use yii\db\ActiveRecord;
use yii\web\UnprocessableEntityHttpException;

/**
 * Medicine model representing the 'medicines' table.
 *
 * @property int $id
 * @property string $code
 * @property string $name
 * @property string $category
 * @property string $unit
 * @property int $stock
 * @property int $min_stock
 * @property float $unit_price
 * @property bool $is_active
 *
 * @property MedicineStockLog[] $stockLogs
 */
class Medicine extends ActiveRecord
{
    public static function tableName(): string
    {
        return '{{%medicines}}';
    }

    public function rules(): array
    {
        return [
            [['code', 'name', 'category', 'unit', 'stock', 'unit_price'], 'required', 'message' => '{attribute} wajib diisi.'],
            [['code'], 'unique', 'message' => 'Kode obat sudah digunakan.'],
            [['code', 'unit'], 'string', 'max' => 20],
            [['name'], 'string', 'max' => 100],
            [['category'], 'string', 'max' => 50],
            [['stock', 'min_stock'], 'integer', 'min' => 0],
            [['min_stock'], 'default', 'value' => 10],
            [['unit_price'], 'number', 'min' => 0],
            [['is_active'], 'boolean'],
            [['is_active'], 'default', 'value' => true],
        ];
    }

    public function getStockLogs(): ActiveQuery
    {
        return $this->hasMany(MedicineStockLog::class, ['medicine_id' => 'id'])->orderBy(['id' => SORT_DESC]);
    }

    /**
     * Atomically adjusts stock with row-level locking (SELECT ... FOR UPDATE) and stock log audit.
     */
    public function adjustStock(string $type, int $quantity, ?string $notes = null, ?string $referenceType = null, ?int $referenceId = null): MedicineStockLog
    {
        $transaction = Yii::$app->db->beginTransaction();
        try {
            /** @var self $lockedMedicine */
            $lockedMedicine = self::findBySql('SELECT * FROM ' . self::tableName() . ' WHERE id = :id FOR UPDATE', [':id' => $this->id])->one();
            if ($lockedMedicine === null) {
                throw new UnprocessableEntityHttpException('Data obat tidak ditemukan saat mengunci stok.');
            }

            if ($type === 'IN') {
                $newStock = $lockedMedicine->stock + $quantity;
            } elseif ($type === 'OUT') {
                if ($lockedMedicine->stock < $quantity) {
                    throw new UnprocessableEntityHttpException(
                        "Stok obat {$lockedMedicine->name} tidak mencukupi (Tersisa: {$lockedMedicine->stock}, Diminta: {$quantity})."
                    );
                }
                $newStock = $lockedMedicine->stock - $quantity;
            } elseif ($type === 'ADJUSTMENT') {
                $newStock = $quantity;
            } else {
                throw new UnprocessableEntityHttpException('Jenis transaksi mutasi stok tidak valid.');
            }

            $lockedMedicine->stock = $newStock;
            if (!$lockedMedicine->save(false)) {
                throw new UnprocessableEntityHttpException('Gagal memperbarui saldo stok obat.');
            }

            $log = new MedicineStockLog([
                'medicine_id' => $lockedMedicine->id,
                'transaction_type' => $type,
                'quantity' => $quantity,
                'balance_after' => $newStock,
                'reference_type' => $referenceType ?? 'STOCK_ADJUSTMENT',
                'reference_id' => $referenceId,
                'notes' => $notes,
            ]);

            if (!$log->save(false)) {
                throw new UnprocessableEntityHttpException('Gagal menyimpan log mutasi stok obat.');
            }

            $transaction->commit();
            $this->stock = $newStock;

            return $log;
        } catch (\Throwable $e) {
            $transaction->rollBack();
            throw $e;
        }
    }
}
