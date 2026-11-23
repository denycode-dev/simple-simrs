export type PatientStatus = 'Rawat Jalan' | 'Rawat Inap' | 'IGD' | 'Selesai';

export interface Patient {
  id: string;
  medicalRecordNumber: string; // No. Rekam Medis (RM)
  name: string;
  age: number;
  gender: 'L' | 'P';
  bpjsNumber?: string;
  status: PatientStatus;
  admissionDate: string;
  diagnosis: string;
  doctorName: string;
  room?: string;
}

export interface PatientFilter {
  search: string;
  status: string;
}
