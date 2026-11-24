import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, Button, Input, Alert, Badge } from '@/components/ui';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import { apiClient } from '@/lib/api-client';
import { formatCurrency } from '@/utils/formatters';

export interface MedicineRecord {
  id: number;
  code: string;
  name: string;
  category: string;
  unit: string;
  stock: number;
  min_stock: number;
  unit_price: number;
  is_active: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const MasterMedicinesPage: React.FC = () => {
  const [medicines, setMedicines] = useState<MedicineRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal Penyesuaian Stok
  const [selectedMedicine, setSelectedMedicine] = useState<MedicineRecord | null>(null);
  const [adjustType, setAdjustType] = useState<'IN' | 'OUT' | 'ADJUSTMENT'>('IN');
  const [adjustQuantity, setAdjustQuantity] = useState<number>(10);
  const [adjustNotes, setAdjustNotes] = useState<string>('');
  const [isAdjusting, setIsAdjusting] = useState<boolean>(false);
  const [adjustError, setAdjustError] = useState<string | null>(null);
  const [adjustSuccess, setAdjustSuccess] = useState<string | null>(null);

  const loadMedicines = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient<ApiResponse<MedicineRecord[]>>('/medicines', {
        params: searchQuery.trim() ? { q: searchQuery.trim() } : undefined,
      });
      setMedicines(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat master data obat.');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    loadMedicines();
  }, [loadMedicines]);

  const handleOpenAdjustModal = (med: MedicineRecord) => {
    setSelectedMedicine(med);
    setAdjustType('IN');
    setAdjustQuantity(10);
    setAdjustNotes('');
    setAdjustError(null);
    setAdjustSuccess(null);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMedicine) return;

    if (adjustQuantity <= 0) {
      setAdjustError('Jumlah mutasi stok harus lebih besar dari 0.');
      return;
    }

    setIsAdjusting(true);
    setAdjustError(null);
    setAdjustSuccess(null);

    try {
      await apiClient<ApiResponse<MedicineRecord>>(`/medicines/${selectedMedicine.id}/adjust-stock`, {
        method: 'POST',
        body: JSON.stringify({
          type: adjustType,
          quantity: adjustQuantity,
          notes: adjustNotes.trim() || 'Penyesuaian stok manual master data',
        }),
      });

      setAdjustSuccess(`Stok obat ${selectedMedicine.name} berhasil diperbarui.`);
      await loadMedicines();
      setTimeout(() => {
        setSelectedMedicine(null);
        setAdjustSuccess(null);
      }, 1200);
    } catch (err) {
      setAdjustError(err instanceof Error ? err.message : 'Gagal melakukan mutasi stok obat.');
    } finally {
      setIsAdjusting(false);
    }
  };

  return (
    <section aria-labelledby="master-medicines-heading">
      {/* Header Halaman */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--space-5)',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
        }}
      >
        <div>
          <h2
            id="master-medicines-heading"
            style={{
              fontSize: '1.375rem',
              fontWeight: 700,
              color: 'var(--color-text-main)',
              letterSpacing: '-0.01em',
            }}
          >
            Master Data Obat & Inventori Farmasi
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            Katalog obat-obatan, batas stok minimum, tarif harga, dan mutasi audit log inventori.
          </p>
        </div>

        <Button
          variant="secondary"
          size="md"
          label="Segarkan"
          onClick={loadMedicines}
          isLoading={isLoading}
        >
          Segarkan
        </Button>
      </div>

      {/* Toolbar Pencarian */}
      <Card elevation="low" padding={4} style={{ marginBottom: 'var(--space-4)', backgroundColor: 'var(--color-surface)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 300px' }}>
            <Input
              id="search-medicines"
              label="Cari Obat"
              placeholder="Cari berdasarkan kode, nama obat, atau kategori..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', paddingTop: '18px' }}>
            <Button
              variant="secondary"
              size="md"
              label="Reset"
              onClick={() => setSearchQuery('')}
              disabled={!searchQuery}
            >
              Reset
            </Button>
          </div>
        </div>
      </Card>

      {/* Pesan Kesalahan */}
      {error && (
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <Alert variant="danger" title="Gagal Memuat Data">{error}</Alert>
        </div>
      )}

      {/* Tabel Data Obat */}
      <Card elevation="low" padding={0} style={{ overflow: 'hidden', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-surface-hover)', borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--color-text-secondary)', width: '140px' }}>Kode Obat</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--color-text-secondary)', minWidth: '220px' }}>Nama Obat</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--color-text-secondary)', width: '160px' }}>Kategori</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--color-text-secondary)', width: '100px' }}>Satuan</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--color-text-secondary)', width: '120px' }}>Stok Fisik</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--color-text-secondary)', width: '130px' }}>Status Stok</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--color-text-secondary)', width: '140px' }}>Harga Satuan</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--color-text-secondary)', width: '140px', textAlign: 'center' }}>Aksi Mutasi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    <div style={{ display: 'inline-block', width: '20px', height: '20px', border: '2px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    <div style={{ marginTop: 'var(--space-2)' }}>Memuat inventori obat farmasi...</div>
                  </td>
                </tr>
              ) : medicines.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    <div style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>💊</div>
                    <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>Belum ada data obat</div>
                  </td>
                </tr>
              ) : (
                medicines.map((med) => {
                  const isLow = med.stock <= med.min_stock;
                  return (
                    <tr key={med.id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            fontSize: '0.8125rem',
                            color: 'var(--color-primary)',
                            backgroundColor: 'var(--color-primary-light)',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--color-primary-border)',
                            display: 'inline-block',
                          }}
                        >
                          {med.code}
                        </span>
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{med.name}</div>
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)' }}>
                        {med.category}
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)' }}>
                        {med.unit}
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700, fontSize: '0.9375rem' }}>
                        <span style={{ color: isLow ? 'var(--color-danger-text)' : 'var(--color-text-main)' }}>
                          {med.stock}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginLeft: '4px' }}>
                          (Min: {med.min_stock})
                        </span>
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <Badge
                          variant={isLow ? 'danger' : 'success'}
                          label={isLow ? 'Stok Kritis' : 'Stok Aman'}
                        />
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-text-main)' }}>
                        {formatCurrency(med.unit_price)}
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'center' }}>
                        <Button
                          variant="secondary"
                          size="sm"
                          label="Mutasi Stok"
                          onClick={() => handleOpenAdjustModal(med)}
                        >
                          Mutasi Stok
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Mutasi Stok */}
      {selectedMedicine && (
        <Dialog
          isOpen={Boolean(selectedMedicine)}
          onOpenChange={(open) => {
            if (!open && !isAdjusting) setSelectedMedicine(null);
          }}
          width={520}
          purpose="form"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-adjust-stock-title"
        >
          <div className="p-6 bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
            <DialogHeader
              title={
                <div>
                  <h2 id="modal-adjust-stock-title" className="text-xl font-bold text-slate-900">
                    Penyesuaian Mutasi Stok Obat
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedMedicine.name} ({selectedMedicine.code}) — Stok saat ini: <strong>{selectedMedicine.stock} {selectedMedicine.unit}</strong>
                  </p>
                </div>
              }
              onOpenChange={() => !isAdjusting && setSelectedMedicine(null)}
            />

              <CardContent style={{ padding: 0 }}>
                {adjustError && <div style={{ marginBottom: 'var(--space-4)' }}><Alert variant="danger">{adjustError}</Alert></div>}
                {adjustSuccess && <div style={{ marginBottom: 'var(--space-4)' }}><Alert variant="success">{adjustSuccess}</Alert></div>}

                <form onSubmit={handleAdjustSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <div>
                    <label
                      htmlFor="adjust_type"
                      style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: 'var(--color-text-main)',
                        marginBottom: 'var(--space-1)',
                      }}
                    >
                      Jenis Mutasi Stok *
                    </label>
                    <select
                      id="adjust_type"
                      value={adjustType}
                      onChange={(e) => setAdjustType(e.target.value as 'IN' | 'OUT' | 'ADJUSTMENT')}
                      style={{
                        width: '100%',
                        height: '40px',
                        padding: '0 var(--space-3)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        backgroundColor: 'var(--color-surface)',
                        color: 'var(--color-text-main)',
                        fontSize: '0.875rem',
                      }}
                    >
                      <option value="IN">Stok Masuk (+ IN)</option>
                      <option value="OUT">Stok Keluar (- OUT)</option>
                      <option value="ADJUSTMENT">Koreksi / Penyesuaian Saldo Fisik (ADJUSTMENT)</option>
                    </select>
                  </div>

                  <div>
                    <Input
                      id="adjust_qty"
                      label="Jumlah Obat *"
                      type="number"
                      min={1}
                      value={String(adjustQuantity)}
                      onChange={(e) => setAdjustQuantity(Number(e.target.value) || 0)}
                      required
                    />
                  </div>

                  <div>
                    <Input
                      id="adjust_notes"
                      label="Catatan / Referensi Mutasi"
                      placeholder="misal: Penerimaan faktur supplier No. 1234"
                      value={adjustNotes}
                      onChange={(e) => setAdjustNotes(e.target.value)}
                    />
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      gap: 'var(--space-3)',
                      marginTop: 'var(--space-3)',
                      paddingTop: 'var(--space-4)',
                      borderTop: '1px solid var(--color-border-subtle)',
                    }}
                  >
                    <Button
                      type="button"
                      variant="secondary"
                      size="md"
                      label="Batal"
                      onClick={() => setSelectedMedicine(null)}
                      disabled={isAdjusting}
                    >
                      Batal
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      label="Simpan Mutasi"
                      isLoading={isAdjusting}
                    >
                      Simpan Mutasi
                    </Button>
                  </div>
                </form>
              </CardContent>
          </div>
        </Dialog>
      )}
    </section>
  );
};
