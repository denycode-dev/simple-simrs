import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, Button, Input, Alert, Badge } from '@/components/ui';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import { apiClient } from '@/lib/api-client';

export interface DoctorRecord {
  id: number;
  nip: string;
  name: string;
  specialization: string;
  phone?: string;
  sip_number?: string;
}

export interface PolyclinicRecord {
  id: number;
  code: string;
  name: string;
  description?: string;
  is_active: boolean;
}

export interface DoctorScheduleRecord {
  id: number;
  doctor_id: number;
  doctor_name?: string;
  polyclinic_id: number;
  polyclinic_name?: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  quota: number;
  is_active: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const MasterDoctorsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'doctors' | 'schedules'>('doctors');
  const [doctors, setDoctors] = useState<DoctorRecord[]>([]);
  const [polyclinics, setPolyclinics] = useState<PolyclinicRecord[]>([]);
  const [schedules, setSchedules] = useState<DoctorScheduleRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal Tambah Jadwal
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState<boolean>(false);
  const [scheduleDoctorId, setScheduleDoctorId] = useState<string>('');
  const [schedulePoliId, setSchedulePoliId] = useState<string>('');
  const [scheduleDay, setScheduleDay] = useState<string>('Senin');
  const [scheduleStart, setScheduleStart] = useState<string>('08:00');
  const [scheduleEnd, setScheduleEnd] = useState<string>('12:00');
  const [scheduleQuota, setScheduleQuota] = useState<number>(30);
  const [isSubmittingSchedule, setIsSubmittingSchedule] = useState<boolean>(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [scheduleSuccess, setScheduleSuccess] = useState<string | null>(null);

  // Parallel data loading (Zero Waterfall)
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [doctorsRes, polisRes, schedulesRes] = await Promise.all([
        apiClient<ApiResponse<DoctorRecord[]>>('/doctors'),
        apiClient<ApiResponse<PolyclinicRecord[]>>('/polyclinics'),
        apiClient<ApiResponse<DoctorScheduleRecord[]>>('/doctor-schedules'),
      ]);

      const docList = Array.isArray(doctorsRes.data) ? doctorsRes.data : [];
      const poliList = Array.isArray(polisRes.data) ? polisRes.data : [];
      const schedList = Array.isArray(schedulesRes.data) ? schedulesRes.data : [];

      setDoctors(docList);
      setPolyclinics(poliList);

      // Denormalisasi nama dokter & poli untuk jadwal jika belum ada
      const mappedSchedules = schedList.map((s) => ({
        ...s,
        doctor_name: s.doctor_name || docList.find((d) => d.id === s.doctor_id)?.name || `Dokter #${s.doctor_id}`,
        polyclinic_name: s.polyclinic_name || poliList.find((p) => p.id === s.polyclinic_id)?.name || `Poli #${s.polyclinic_id}`,
      }));
      setSchedules(mappedSchedules);

      if (docList.length > 0 && !scheduleDoctorId) {
        setScheduleDoctorId(String(docList[0].id));
      }
      if (poliList.length > 0 && !schedulePoliId) {
        setSchedulePoliId(String(poliList[0].id));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data dokter dan jadwal.');
    } finally {
      setIsLoading(false);
    }
  }, [scheduleDoctorId, schedulePoliId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setScheduleError(null);
    setScheduleSuccess(null);

    if (!scheduleDoctorId || !schedulePoliId) {
      setScheduleError('Silakan pilih dokter dan poliklinik.');
      return;
    }

    setIsSubmittingSchedule(true);
    try {
      await apiClient('/doctor-schedules', {
        method: 'POST',
        body: JSON.stringify({
          doctor_id: Number(scheduleDoctorId),
          polyclinic_id: Number(schedulePoliId),
          day_of_week: scheduleDay,
          start_time: scheduleStart,
          end_time: scheduleEnd,
          quota: scheduleQuota,
        }),
      });

      setScheduleSuccess('Jadwal dokter berhasil ditambahkan tanpa konflik.');
      await loadData();
      setTimeout(() => {
        setIsScheduleModalOpen(false);
        setScheduleSuccess(null);
      }, 1200);
    } catch (err) {
      setScheduleError(err instanceof Error ? err.message : 'Gagal menambahkan jadwal dokter.');
    } finally {
      setIsSubmittingSchedule(false);
    }
  };

  return (
    <section aria-labelledby="master-doctors-heading">
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
            id="master-doctors-heading"
            style={{
              fontSize: '1.375rem',
              fontWeight: 700,
              color: 'var(--color-text-main)',
              letterSpacing: '-0.01em',
            }}
          >
            Master Data Dokter & Jadwal Poliklinik
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            Manajemen dokter spesialis, poliklinik rawat jalan, dan jadwal praktik harian anti-bentrok.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button
            variant="secondary"
            size="md"
            label="Segarkan"
            onClick={loadData}
            isLoading={isLoading}
          >
            Segarkan
          </Button>
          <Button
            variant="primary"
            size="md"
            label="+ Tambah Jadwal Praktik"
            onClick={() => setIsScheduleModalOpen(true)}
          >
            + Tambah Jadwal Praktik
          </Button>
        </div>
      </div>

      {/* Tab Navigasi */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
        <button
          type="button"
          onClick={() => setActiveTab('doctors')}
          style={{
            padding: '0.5rem 1.25rem',
            fontSize: '0.875rem',
            fontWeight: activeTab === 'doctors' ? 600 : 500,
            borderRadius: 'var(--radius-full)',
            border: `1px solid ${activeTab === 'doctors' ? 'var(--color-primary)' : 'var(--color-border)'}`,
            backgroundColor: activeTab === 'doctors' ? 'var(--color-primary-light)' : 'var(--color-surface)',
            color: activeTab === 'doctors' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            cursor: 'pointer',
            transition: 'all 150ms ease',
          }}
        >
          👨‍⚕️ Direktori Dokter DPJP ({doctors.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('schedules')}
          style={{
            padding: '0.5rem 1.25rem',
            fontSize: '0.875rem',
            fontWeight: activeTab === 'schedules' ? 600 : 500,
            borderRadius: 'var(--radius-full)',
            border: `1px solid ${activeTab === 'schedules' ? 'var(--color-primary)' : 'var(--color-border)'}`,
            backgroundColor: activeTab === 'schedules' ? 'var(--color-primary-light)' : 'var(--color-surface)',
            color: activeTab === 'schedules' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            cursor: 'pointer',
            transition: 'all 150ms ease',
          }}
        >
          📅 Jadwal Praktik Poliklinik ({schedules.length})
        </button>
      </div>

      {/* Error alert */}
      {error && (
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <Alert variant="danger" title="Gagal Memuat Data">{error}</Alert>
        </div>
      )}

      {/* Konten Tab Aktif */}
      {activeTab === 'doctors' ? (
        <Card elevation="low" padding={0} style={{ overflow: 'hidden', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-surface-hover)', borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--color-text-secondary)', width: '140px' }}>NIP</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--color-text-secondary)', minWidth: '220px' }}>Nama Dokter DPJP</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--color-text-secondary)', width: '200px' }}>Spesialisasi</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--color-text-secondary)', width: '160px' }}>No. SIP</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--color-text-secondary)', width: '160px' }}>Kontak Telepon</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                      Memuat data dokter...
                    </td>
                  </tr>
                ) : doctors.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                      Belum ada data dokter terdaftar.
                    </td>
                  </tr>
                ) : (
                  doctors.map((doc) => (
                    <tr key={doc.id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-primary)' }}>
                        {doc.nip}
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700, color: 'var(--color-text-main)' }}>
                        {doc.name}
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)' }}>
                        <Badge variant="info" label={doc.specialization} />
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'monospace', color: 'var(--color-text-secondary)' }}>
                        {doc.sip_number || '-'}
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)' }}>
                        {doc.phone || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card elevation="low" padding={0} style={{ overflow: 'hidden', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-surface-hover)', borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--color-text-secondary)', minWidth: '220px' }}>Dokter DPJP</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--color-text-secondary)', width: '180px' }}>Poliklinik</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--color-text-secondary)', width: '120px' }}>Hari Praktik</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--color-text-secondary)', width: '160px' }}>Jam Praktik</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--color-text-secondary)', width: '130px' }}>Kuota Pasien</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--color-text-secondary)', width: '120px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                      Memuat jadwal praktik...
                    </td>
                  </tr>
                ) : schedules.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                      Belum ada jadwal praktik terdaftar.
                    </td>
                  </tr>
                ) : (
                  schedules.map((sch) => (
                    <tr key={sch.id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700, color: 'var(--color-text-main)' }}>
                        {sch.doctor_name}
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)' }}>
                        <span style={{ fontWeight: 600 }}>{sch.polyclinic_name}</span>
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--color-primary)' }}>
                        {sch.day_of_week}
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'monospace', color: 'var(--color-text-secondary)' }}>
                        {sch.start_time} - {sch.end_time} WIB
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>
                        {sch.quota} pasien
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <Badge variant={sch.is_active ? 'success' : 'neutral'} label={sch.is_active ? 'Aktif' : 'Non-aktif'} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal Tambah Jadwal Praktik */}
      {isScheduleModalOpen && (
        <Dialog
          isOpen={isScheduleModalOpen}
          onOpenChange={(open) => {
            if (!open && !isSubmittingSchedule) setIsScheduleModalOpen(false);
          }}
          width={560}
          purpose="form"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-add-schedule-title"
        >
          <div className="p-6 bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
            <DialogHeader
              title={
                <div>
                  <h2 id="modal-add-schedule-title" className="text-xl font-bold text-slate-900">
                    Tambah Jadwal Praktik Dokter
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Sistem otomatis menolak jadwal jika bertabrakan jamnya dengan jadwal lain dokter pada hari yang sama.
                  </p>
                </div>
              }
              onOpenChange={() => !isSubmittingSchedule && setIsScheduleModalOpen(false)}
            />

              <CardContent style={{ padding: 0 }}>
                {scheduleError && <div style={{ marginBottom: 'var(--space-4)' }}><Alert variant="danger">{scheduleError}</Alert></div>}
                {scheduleSuccess && <div style={{ marginBottom: 'var(--space-4)' }}><Alert variant="success">{scheduleSuccess}</Alert></div>}

                <form onSubmit={handleCreateSchedule} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <div>
                    <label
                      htmlFor="sched_doctor"
                      style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: 'var(--color-text-main)',
                        marginBottom: 'var(--space-1)',
                      }}
                    >
                      Dokter DPJP *
                    </label>
                    <select
                      id="sched_doctor"
                      value={scheduleDoctorId}
                      onChange={(e) => setScheduleDoctorId(e.target.value)}
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
                      {doctors.map((doc) => (
                        <option key={doc.id} value={doc.id}>
                          {doc.name} ({doc.specialization})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="sched_poli"
                      style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: 'var(--color-text-main)',
                        marginBottom: 'var(--space-1)',
                      }}
                    >
                      Poliklinik Tujuan *
                    </label>
                    <select
                      id="sched_poli"
                      value={schedulePoliId}
                      onChange={(e) => setSchedulePoliId(e.target.value)}
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
                      {polyclinics.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                    <div>
                      <label
                        htmlFor="sched_day"
                        style={{
                          display: 'block',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: 'var(--color-text-main)',
                          marginBottom: 'var(--space-1)',
                        }}
                      >
                        Hari Praktik *
                      </label>
                      <select
                        id="sched_day"
                        value={scheduleDay}
                        onChange={(e) => setScheduleDay(e.target.value)}
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
                        {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Input
                        id="sched_quota"
                        label="Kuota Pasien *"
                        type="number"
                        min={1}
                        value={String(scheduleQuota)}
                        onChange={(e) => setScheduleQuota(Number(e.target.value) || 1)}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                    <div>
                      <Input
                        id="sched_start"
                        label="Jam Mulai *"
                        type="time"
                        value={scheduleStart}
                        onChange={(e) => setScheduleStart(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Input
                        id="sched_end"
                        label="Jam Selesai *"
                        type="time"
                        value={scheduleEnd}
                        onChange={(e) => setScheduleEnd(e.target.value)}
                        required
                      />
                    </div>
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
                      onClick={() => setIsScheduleModalOpen(false)}
                      disabled={isSubmittingSchedule}
                    >
                      Batal
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      label="Simpan Jadwal"
                      isLoading={isSubmittingSchedule}
                    >
                      Simpan Jadwal
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
