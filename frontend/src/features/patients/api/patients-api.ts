import type { Patient } from '../types';

/**
 * Data mock awal untuk domain SIMRS (Sistem Informasi Manajemen Rumah Sakit).
 * Terstruktur agar siap dipetakan ke API Yii2 endpoint GET /patients.
 */
const INITIAL_PATIENTS: Patient[] = [
  {
    id: 'PT-001',
    medicalRecordNumber: 'RM-2026-0041',
    name: 'Budi Santoso',
    age: 45,
    gender: 'L',
    bpjsNumber: '0001234567890',
    status: 'Rawat Jalan',
    admissionDate: '2026-11-23T07:30:00Z',
    diagnosis: 'Hipertensi Primer Stage 2',
    doctorName: 'dr. Hendra Pratama, Sp.PD',
    room: 'Poli Dalam 1',
  },
  {
    id: 'PT-002',
    medicalRecordNumber: 'RM-2026-0042',
    name: 'Siti Aminah',
    age: 32,
    gender: 'P',
    bpjsNumber: '0009876543210',
    status: 'Rawat Inap',
    admissionDate: '2026-11-22T14:15:00Z',
    diagnosis: 'Demam Berdarah Dengue (DBD) Grade II',
    doctorName: 'dr. Hendra Pratama, Sp.PD',
    room: 'Ruang Melati No. 302',
  },
  {
    id: 'PT-003',
    medicalRecordNumber: 'RM-2026-0043',
    name: 'Ahmad Fauzi',
    age: 58,
    gender: 'L',
    status: 'IGD',
    admissionDate: '2026-11-23T06:10:00Z',
    diagnosis: 'Sindrom Koroner Akut (Observasi)',
    doctorName: 'dr. Ratna Kartika, Sp.JP',
    room: 'IGD Bed 04',
  },
  {
    id: 'PT-004',
    medicalRecordNumber: 'RM-2026-0044',
    name: 'Dewi Lestari',
    age: 27,
    gender: 'P',
    bpjsNumber: '0004561237890',
    status: 'Selesai',
    admissionDate: '2026-11-20T09:00:00Z',
    diagnosis: 'Faringitis Akut',
    doctorName: 'dr. Hendra Pratama, Sp.PD',
    room: 'Poli Umum',
  },
  {
    id: 'PT-005',
    medicalRecordNumber: 'RM-2026-0045',
    name: 'Rian Hidayat',
    age: 19,
    gender: 'L',
    status: 'Rawat Jalan',
    admissionDate: '2026-11-23T08:00:00Z',
    diagnosis: 'Gastritis Erosif',
    doctorName: 'dr. Hendra Pratama, Sp.PD',
    room: 'Poli Dalam 1',
  },
];

export async function getPatientsApi(): Promise<Patient[]> {
  // Simulasi fetch request
  await new Promise((resolve) => setTimeout(resolve, 350));
  return [...INITIAL_PATIENTS];
}

export async function getPatientByIdApi(id: string): Promise<Patient | undefined> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return INITIAL_PATIENTS.find((p) => p.id === id);
}
