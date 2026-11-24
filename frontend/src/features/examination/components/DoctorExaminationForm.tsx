import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Alert, Badge } from '@/components/ui';
import { apiClient } from '@/lib/api-client';
import { InitialAssessmentCard, type NurseAssessmentData } from './InitialAssessmentCard';

export interface DoctorQueuePatient {
  id: number;
  queue_number: string;
  insurance_type: 'GENERAL' | 'BPJS';
  registration_date: string;
  status: string;
  patient?: {
    id: number;
    name: string;
    medical_record_number: string;
    gender?: 'L' | 'P';
    birth_date?: string;
  };
  polyclinic?: {
    id: number;
    name: string;
  };
  doctor?: {
    id: number;
    name: string;
  };
}

export interface MedicalActionItem {
  id: number;
  code: string;
  name: string;
  category: string;
  tariff: number;
}

export const DoctorExaminationForm: React.FC = () => {
  const [queue, setQueue] = useState<DoctorQueuePatient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<DoctorQueuePatient | null>(null);
  const [assessment, setAssessment] = useState<NurseAssessmentData | null>(null);
  const [actionsList, setActionsList] = useState<MedicalActionItem[]>([]);
  const [isLoadingQueue, setIsLoadingQueue] = useState<boolean>(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Form SOAP State
  const [physicalExam, setPhysicalExam] = useState<string>('Kepala/Leher: DBN. Thorax: Cor/Pulmo DBN. Abdomen: Supel, BU normal.');
  const [primaryIcdCode, setPrimaryIcdCode] = useState<string>('I10');
  const [primaryIcdDesc, setPrimaryIcdDesc] = useState<string>('Essential (primary) hypertension');
  const [secondaryDiagnosis, setSecondaryDiagnosis] = useState<string>('');
  const [doctorNotes, setDoctorNotes] = useState<string>('');
  const [selectedActions, setSelectedActions] = useState<number[]>([]);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Load Queue for doctor
  const loadDoctorQueue = useCallback(async () => {
    setIsLoadingQueue(true);
    setError(null);
    try {
      const [regRes, actionsRes] = await Promise.all([
        apiClient<{ data: DoctorQueuePatient[] }>('/registrations'),
        apiClient<{ data: MedicalActionItem[] }>('/medical-actions'),
      ]);

      const docQueue = (Array.isArray(regRes.data) ? regRes.data : []).filter(
        (r) => r.status === 'WAITING_DOCTOR' || r.status === 'IN_DOCTOR'
      );
      setQueue(docQueue);
      setActionsList(Array.isArray(actionsRes.data) ? actionsRes.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat antrean konsultasi dokter.');
    } finally {
      setIsLoadingQueue(false);
    }
  }, []);

  useEffect(() => {
    loadDoctorQueue();
  }, [loadDoctorQueue]);

  const handleSelectPatient = async (patient: DoctorQueuePatient) => {
    setSelectedPatient(patient);
    setIsLoadingDetails(true);
    setSubmitError(null);
    setSubmitSuccess(null);
    setSelectedActions([]);

    try {
      // Ambil asesmen nakes untuk registrasi ini
      const res = await apiClient<{ data: NurseAssessmentData[] }>('/nurse-assessments', {
        params: { registration_id: patient.id },
      });
      const item = Array.isArray(res.data) && res.data.length > 0 ? res.data[0] : null;
      setAssessment(item);
    } catch {
      setAssessment(null);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleActionToggle = (actionId: number) => {
    setSelectedActions((prev) =>
      prev.includes(actionId) ? prev.filter((id) => id !== actionId) : [...prev, actionId]
    );
  };

  const handleSubmitExamination = async (nextDestination: 'PHARMACY' | 'BILLING') => {
    if (!selectedPatient) return;

    if (!primaryIcdCode.trim() || !primaryIcdDesc.trim()) {
      setSubmitError('Diagnosis ICD-10 utama dan deskripsi wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      // 1. Simpan Pemeriksaan RME
      const examRes = await apiClient<{ data: { id: number } }>('/examinations', {
        method: 'POST',
        body: JSON.stringify({
          registration_id: selectedPatient.id,
          doctor_id: 1, // ID dokter praktik
          physical_exam: physicalExam.trim(),
          primary_diagnosis_code: primaryIcdCode.trim(),
          primary_diagnosis_desc: primaryIcdDesc.trim(),
          secondary_diagnosis: secondaryDiagnosis.trim(),
          doctor_notes: doctorNotes.trim(),
        }),
      });

      const examId = examRes.data.id;

      // 2. Tambahkan tindakan medis jika ada yang dipilih
      if (selectedActions.length > 0 && examId) {
        for (const actionId of selectedActions) {
          try {
            await apiClient(`/examinations/${examId}/actions`, {
              method: 'POST',
              body: JSON.stringify({ action_id: actionId }),
            });
          } catch {
            // Biarkan lanjut jika salah satu tindakan gagal
          }
        }
      }

      // 3. Alihkan status antrean ke tujuan berikutnya (Farmasi / Kasir)
      await apiClient(`/registrations/${selectedPatient.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextDestination }),
      });

      setSubmitSuccess(
        `Pemeriksaan RME berhasil disimpan. Pasien diteruskan ke ${nextDestination === 'PHARMACY' ? 'Farmasi e-Resep' : 'Kasir Billing'}.`
      );

      setTimeout(() => {
        setSelectedPatient(null);
        setAssessment(null);
        loadDoctorQueue();
      }, 1200);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Gagal menyimpan data rekam medis dokter.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section aria-labelledby="doctor-exam-heading">
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
            id="doctor-exam-heading"
            style={{
              fontSize: '1.375rem',
              fontWeight: 700,
              color: 'var(--color-text-main)',
              letterSpacing: '-0.01em',
            }}
          >
            Konsultasi & Rekam Medis Elektronik (RME) Dokter
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            Pemeriksaan fisik SOAP, penegakan diagnosis ICD-10, tindakan medis, dan e-resep farmasi.
          </p>
        </div>

        <Button
          variant="secondary"
          size="md"
          label="Segarkan Antrean"
          onClick={loadDoctorQueue}
          isLoading={isLoadingQueue}
        >
          Segarkan Antrean
        </Button>
      </div>

      {error && (
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <Alert variant="danger" title="Gagal Memuat Antrean">{error}</Alert>
        </div>
      )}

      {/* Grid: Antrean Pasien di Kiri / Form di Kanan */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedPatient ? '320px 1fr' : '1fr', gap: 'var(--space-5)' }}>
        {/* Kolom Daftar Antrean Pasien Dokter */}
        <Card elevation="low" padding={4} style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', height: 'fit-content' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: 'var(--space-3)' }}>
            Pasien Menunggu Konsultasi ({queue.length})
          </h3>

          {isLoadingQueue ? (
            <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              Memuat antrean dokter...
            </div>
          ) : queue.length === 0 ? (
            <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              <div style={{ fontSize: '1.75rem', marginBottom: 'var(--space-1)' }}>👨‍⚕️</div>
              <div style={{ fontWeight: 600 }}>Tidak ada pasien antre</div>
              <div style={{ fontSize: '0.75rem', marginTop: '2px' }}>Pasien yang selesai skrining nakes akan masuk ke sini.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {queue.map((p) => {
                const isSelected = selectedPatient?.id === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => handleSelectPatient(p)}
                    style={{
                      padding: 'var(--space-3)',
                      borderRadius: 'var(--radius-md)',
                      border: `1px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      backgroundColor: isSelected ? 'var(--color-primary-light)' : 'var(--color-surface)',
                      cursor: 'pointer',
                      transition: 'all 150ms ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--color-primary)', fontSize: '0.875rem' }}>
                        {p.queue_number}
                      </span>
                      <Badge variant={p.insurance_type === 'BPJS' ? 'success' : 'info'} label={p.insurance_type} />
                    </div>
                    <div style={{ fontWeight: 700, color: 'var(--color-text-main)', marginTop: '2px' }}>
                      {p.patient?.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                      RM: {p.patient?.medical_record_number}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Kolom Lembar Pemeriksaan SOAP */}
        {selectedPatient ? (
          <div>
            {isLoadingDetails ? (
              <Card elevation="low" padding={8} style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
                Memuat data riwayat skrining nakes...
              </Card>
            ) : (
              <div>
                {/* 1. Ringkasan Skrining Awal Nakes (Komponen Wajib Task 18) */}
                {assessment ? (
                  <InitialAssessmentCard assessment={assessment} />
                ) : (
                  <div style={{ marginBottom: 'var(--space-4)' }}>
                    <Alert variant="warning" title="Informasi Nakes Belum Ada">
                      Pasien ini belum memiliki catatan skrining tanda-tanda vital dari perawat.
                    </Alert>
                  </div>
                )}

                {/* 2. Form Input SOAP Pemeriksaan Dokter */}
                <Card elevation="med" padding={6} style={{ backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                  <CardHeader style={{ paddingBottom: 'var(--space-3)', marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--color-border-subtle)' }}>
                    <CardTitle style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                      Formulir Rekam Medis SOAP Dokter
                    </CardTitle>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                      {selectedPatient.patient?.name} • No. Antrean: <strong>{selectedPatient.queue_number}</strong>
                    </div>
                  </CardHeader>

                  <CardContent style={{ padding: 0 }}>
                    {submitError && <div style={{ marginBottom: 'var(--space-4)' }}><Alert variant="danger">{submitError}</Alert></div>}
                    {submitSuccess && <div style={{ marginBottom: 'var(--space-4)' }}><Alert variant="success">{submitSuccess}</Alert></div>}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                      {/* O - Objective: Pemeriksaan Fisik */}
                      <div>
                        <label
                          htmlFor="physical_exam"
                          style={{
                            display: 'block',
                            fontSize: '0.875rem',
                            fontWeight: 700,
                            color: 'var(--color-text-main)',
                            marginBottom: 'var(--space-1)',
                          }}
                        >
                          Objective: Pemeriksaan Fisik Spesifik *
                        </label>
                        <textarea
                          id="physical_exam"
                          rows={3}
                          value={physicalExam}
                          onChange={(e) => setPhysicalExam(e.target.value)}
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

                      {/* A - Assessment: ICD-10 */}
                      <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 'var(--space-3)' }}>
                        <div>
                          <Input
                            id="primary_icd_code"
                            label="Kode ICD-10 *"
                            value={primaryIcdCode}
                            onChange={(e) => setPrimaryIcdCode(e.target.value)}
                            placeholder="misal: I10"
                            required
                          />
                        </div>
                        <div>
                          <Input
                            id="primary_icd_desc"
                            label="Diagnosis Utama ICD-10 *"
                            value={primaryIcdDesc}
                            onChange={(e) => setPrimaryIcdDesc(e.target.value)}
                            placeholder="Deskripsi diagnosis klinis..."
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <Input
                          id="secondary_diagnosis"
                          label="Diagnosis Sekunder (Komorbiditas)"
                          value={secondaryDiagnosis}
                          onChange={(e) => setSecondaryDiagnosis(e.target.value)}
                          placeholder="misal: E11.9 - Type 2 diabetes mellitus without complications"
                        />
                      </div>

                      {/* P - Plan: Catatan Dokter */}
                      <div>
                        <label
                          htmlFor="doctor_notes"
                          style={{
                            display: 'block',
                            fontSize: '0.875rem',
                            fontWeight: 700,
                            color: 'var(--color-text-main)',
                            marginBottom: 'var(--space-1)',
                          }}
                        >
                          Plan: Terapi & Edukasi Dokter
                        </label>
                        <textarea
                          id="doctor_notes"
                          rows={2}
                          value={doctorNotes}
                          onChange={(e) => setDoctorNotes(e.target.value)}
                          placeholder="Rencana terapi, diet rendah garam, kontrol ulang 2 minggu..."
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

                      {/* Tindakan Medis */}
                      <div style={{ paddingTop: 'var(--space-3)', borderTop: '1px solid var(--color-border-subtle)' }}>
                        <strong style={{ fontSize: '0.875rem', color: 'var(--color-text-main)', display: 'block', marginBottom: 'var(--space-2)' }}>
                          Pilih Tindakan Medis (Tarif Otomatis Terkunci ke Billing):
                        </strong>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-2)' }}>
                          {actionsList.map((act) => {
                            const isChecked = selectedActions.includes(act.id);
                            return (
                              <label
                                key={act.id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 'var(--space-2)',
                                  padding: 'var(--space-2) var(--space-3)',
                                  borderRadius: 'var(--radius-md)',
                                  border: `1px solid ${isChecked ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                  backgroundColor: isChecked ? 'var(--color-primary-light)' : 'var(--color-surface)',
                                  cursor: 'pointer',
                                  fontSize: '0.8125rem',
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleActionToggle(act.id)}
                                />
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontWeight: 600 }}>{act.name}</div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                    Rp {act.tariff.toLocaleString('id-ID')}
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'flex-end',
                          gap: 'var(--space-3)',
                          paddingTop: 'var(--space-4)',
                          borderTop: '1px solid var(--color-border-subtle)',
                          flexWrap: 'wrap',
                        }}
                      >
                        <Button
                          type="button"
                          variant="secondary"
                          size="md"
                          label="Batal"
                          onClick={() => setSelectedPatient(null)}
                          disabled={isSubmitting}
                        >
                          Batal
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="md"
                          label="Simpan & Langsung Kasir (Tanpa Resep)"
                          onClick={() => handleSubmitExamination('BILLING')}
                          isLoading={isSubmitting}
                        >
                          Simpan & Langsung Kasir
                        </Button>
                        <Button
                          type="button"
                          variant="primary"
                          size="md"
                          label="Simpan & Teruskan ke Farmasi e-Resep"
                          onClick={() => handleSubmitExamination('PHARMACY')}
                          isLoading={isSubmitting}
                        >
                          Simpan & Teruskan ke Farmasi e-Resep
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        ) : (
          <Card elevation="low" padding={8} style={{ textAlign: 'center', backgroundColor: 'var(--color-surface)', border: '1px dashed var(--color-border)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-2)' }}>🩺</div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
              Pilih Pasien Dari Antrean di Sebelah Kiri
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', maxWidth: '420px', margin: '4px auto 0 auto' }}>
              Klik salah satu pasien untuk membuka lembar rekam medis SOAP dan informasi skrining awal perawat.
            </p>
          </Card>
        )}
      </div>
    </section>
  );
};
