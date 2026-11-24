import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, Button, Input, Alert, Badge } from '@/components/ui';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import { apiClient } from '@/lib/api-client';

export interface PatientRecord {
  id: number;
  medical_record_number: string;
  nik: string;
  name: string;
  birth_date: string;
  gender: 'L' | 'P';
  address?: string;
  phone?: string;
  bpjs_number?: string;
  created_at?: string;
  is_masked?: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const MasterPatientsPage: React.FC = () => {
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Modal Tambah Pasien
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    nik: '',
    name: '',
    birth_date: '',
    gender: 'L' as 'L' | 'P',
    address: '',
    phone: '',
    bpjs_number: '',
  });

  const loadPatients = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient<ApiResponse<PatientRecord[]>>('/patients', {
        params: searchQuery.trim() ? { q: searchQuery.trim() } : undefined,
      });
      setPatients(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data master pasien');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    // Validasi NIK 16 digit
    if (!/^\d{16}$/.test(formData.nik.trim())) {
      setFormError('Nomor Induk Kependudukan (NIK) harus tepat 16 digit angka.');
      return;
    }
    if (!formData.name.trim()) {
      setFormError('Nama lengkap pasien wajib diisi.');
      return;
    }
    if (!formData.birth_date) {
      setFormError('Tanggal lahir pasien wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient<ApiResponse<PatientRecord>>('/patients', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setFormSuccess('Pasien baru berhasil didaftarkan ke Master Data.');
      setFormData({
        nik: '',
        name: '',
        birth_date: '',
        gender: 'L',
        address: '',
        phone: '',
        bpjs_number: '',
      });
      await loadPatients();
      setTimeout(() => {
        setIsModalOpen(false);
        setFormSuccess(null);
      }, 1200);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Gagal mendaftarkan pasien baru.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section aria-labelledby="master-patients-heading">
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
            id="master-patients-heading"
            style={{
              fontSize: '1.375rem',
              fontWeight: 700,
              color: 'var(--color-text-main)',
              letterSpacing: '-0.01em',
            }}
          >
            Master Data Pasien
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            Pengelolaan direktori pasien terpadu, validasi NIK 16-digit, dan penomoran Rekam Medis otomatis.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button
            variant="secondary"
            size="md"
            label="Segarkan"
            onClick={loadPatients}
            isLoading={isLoading}
          >
            Segarkan
          </Button>
          <Button
            variant="primary"
            size="md"
            label="+ Tambah Pasien Baru"
            onClick={() => setIsModalOpen(true)}
          >
            + Tambah Pasien Baru
          </Button>
        </div>
      </div>

      {/* Toolbar Pencarian & Filter */}
      <Card elevation="low" padding={4} style={{ marginBottom: 'var(--space-4)', backgroundColor: 'var(--color-surface)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 300px' }}>
            <Input
              id="search-patients"
              label="Cari Pasien"
              placeholder="Cari berdasarkan No. RM, NIK, atau Nama Pasien..."
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
          <Alert variant="danger" title="Gagal Memuat Data">
            {error}
          </Alert>
        </div>
      )}

      {/* Tabel Data Pasien */}
      <Card elevation="low" padding={0} style={{ overflow: 'hidden', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left',
              fontSize: '0.875rem',
            }}
          >
            <thead>
              <tr
                style={{
                  backgroundColor: 'var(--color-surface-hover)',
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--color-text-secondary)', width: '160px' }}>No. RM</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--color-text-secondary)', width: '180px' }}>NIK</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--color-text-secondary)', minWidth: '200px' }}>Nama Pasien</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--color-text-secondary)', width: '130px' }}>Tgl Lahir</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--color-text-secondary)', width: '100px' }}>L/P</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--color-text-secondary)', width: '150px' }}>Telepon</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--color-text-secondary)', width: '160px' }}>No. BPJS</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    <div style={{ display: 'inline-block', width: '20px', height: '20px', border: '2px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    <div style={{ marginTop: 'var(--space-2)' }}>Memuat direktori master pasien...</div>
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    <div style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>📁</div>
                    <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>Belum ada data pasien</div>
                    <div style={{ fontSize: '0.8125rem', marginTop: 'var(--space-1)' }}>
                      {searchQuery ? 'Tidak ada hasil yang sesuai dengan kriteria pencarian.' : 'Klik tombol "+ Tambah Pasien Baru" untuk mendaftarkan pasien.'}
                    </div>
                  </td>
                </tr>
              ) : (
                patients.map((p) => (
                  <tr
                    key={p.id}
                    style={{
                      borderBottom: '1px solid var(--color-border-subtle)',
                      transition: 'background-color 150ms ease',
                    }}
                  >
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
                        {p.medical_record_number}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'monospace', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                      {p.nik}
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{p.name}</div>
                      {p.address && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>{p.address}</div>}
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)' }}>
                      {p.birth_date}
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <Badge variant={p.gender === 'L' ? 'info' : 'warning'} label={p.gender === 'L' ? 'Laki-laki' : 'Perempuan'} />
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)' }}>
                      {p.phone || '-'}
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'monospace', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                      {p.bpjs_number || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Tambah Pasien Baru */}
      {isModalOpen && (
        <Dialog
          isOpen={isModalOpen}
          onOpenChange={(open) => {
            if (!open && !isSubmitting) setIsModalOpen(false);
          }}
          width={600}
          purpose="form"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-add-patient-title"
        >
          <div className="p-6 bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
            <DialogHeader
              title={
                <div>
                  <h2 id="modal-add-patient-title" className="text-xl font-bold text-slate-900">
                    Pendaftaran Master Pasien Baru
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    No. Rekam Medis (RM) akan diterbitkan otomatis secara sekuensial oleh sistem.
                  </p>
                </div>
              }
              onOpenChange={() => !isSubmitting && setIsModalOpen(false)}
            />

              <CardContent style={{ padding: 0 }}>
                {formError && <div style={{ marginBottom: 'var(--space-4)' }}><Alert variant="danger">{formError}</Alert></div>}
                {formSuccess && <div style={{ marginBottom: 'var(--space-4)' }}><Alert variant="success">{formSuccess}</Alert></div>}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <div>
                    <Input
                      id="nik"
                      label="Nomor Induk Kependudukan (NIK) *"
                      placeholder="16 digit NIK sesuai e-KTP"
                      value={formData.nik}
                      onChange={(e) => handleInputChange('nik', e.target.value)}
                      maxLength={16}
                      required
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px', display: 'block' }}>
                      Wajib 16 digit angka unik untuk mencegah rekam medis ganda.
                    </span>
                  </div>

                  <div>
                    <Input
                      id="name"
                      label="Nama Lengkap Pasien *"
                      placeholder="Nama lengkap sesuai identitas"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                    <div>
                      <Input
                        id="birth_date"
                        label="Tanggal Lahir *"
                        type="date"
                        value={formData.birth_date}
                        onChange={(e) => handleInputChange('birth_date', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="gender"
                        style={{
                          display: 'block',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: 'var(--color-text-main)',
                          marginBottom: 'var(--space-1)',
                        }}
                      >
                        Jenis Kelamin *
                      </label>
                      <select
                        id="gender"
                        value={formData.gender}
                        onChange={(e) => handleInputChange('gender', e.target.value as 'L' | 'P')}
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
                        required
                      >
                        <option value="L">Laki-laki</option>
                        <option value="P">Perempuan</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <Input
                      id="phone"
                      label="Nomor Telepon / WhatsApp"
                      placeholder="misal: 081234567890"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                    />
                  </div>

                  <div>
                    <Input
                      id="bpjs_number"
                      label="Nomor Kartu BPJS Kesehatan (Opsional)"
                      placeholder="13 digit nomor kartu BPJS jika ada"
                      value={formData.bpjs_number}
                      onChange={(e) => handleInputChange('bpjs_number', e.target.value)}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="address"
                      style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: 'var(--color-text-main)',
                        marginBottom: 'var(--space-1)',
                      }}
                    >
                      Alamat Domisili
                    </label>
                    <textarea
                      id="address"
                      rows={2}
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Alamat domisili lengkap pasien..."
                      style={{
                        width: '100%',
                        padding: 'var(--space-2) var(--space-3)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        backgroundColor: 'var(--color-surface)',
                        color: 'var(--color-text-main)',
                        fontSize: '0.875rem',
                        fontFamily: 'inherit',
                      }}
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
                      onClick={() => setIsModalOpen(false)}
                      disabled={isSubmitting}
                    >
                      Batal
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      label="Simpan Pasien"
                      isLoading={isSubmitting}
                    >
                      Simpan Pasien
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
