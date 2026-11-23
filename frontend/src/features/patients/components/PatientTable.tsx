import React from 'react';
import { DataTable, type ColumnDef, Badge, Button, type BadgeVariant } from '@/components/ui';
import { formatDate } from '@/utils/formatters';
import type { Patient, PatientStatus } from '../types';

export interface PatientTableProps {
  patients: Patient[];
  isLoading: boolean;
  onSelectPatient: (patient: Patient) => void;
  onRefresh?: () => void;
  searchable?: boolean;
}

const getStatusBadgeVariant = (status: PatientStatus): BadgeVariant => {
  switch (status) {
    case 'Rawat Inap':
      return 'warning';
    case 'IGD':
      return 'danger';
    case 'Rawat Jalan':
      return 'info';
    case 'Selesai':
    default:
      return 'success';
  }
};

export const PatientTable: React.FC<PatientTableProps> = ({
  patients,
  isLoading,
  onSelectPatient,
  onRefresh,
}) => {
  const columns: ColumnDef<Patient>[] = [
    {
      key: 'medicalRecordNumber',
      header: 'No. Rekam Medis',
      width: '160px',
      sortable: true,
      render: (patient) => (
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
          {patient.medicalRecordNumber}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Nama Pasien',
      width: '220px',
      sortable: true,
      render: (patient) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--color-text-main)', fontSize: '0.9375rem' }}>
            {patient.name}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            {patient.gender === 'L' ? 'Laki-laki' : 'Perempuan'}, {patient.age} tahun
          </div>
        </div>
      ),
    },
    {
      key: 'diagnosis',
      header: 'Diagnosis Medis',
      width: '240px',
      sortable: true,
      render: (patient) => (
        <span style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>
          {patient.diagnosis}
        </span>
      ),
    },
    {
      key: 'doctorName',
      header: 'Dokter DPJP',
      width: '200px',
      sortable: true,
      render: (patient) => (
        <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>
          {patient.doctorName}
        </span>
      ),
    },
    {
      key: 'room',
      header: 'Ruang / Poli',
      width: '160px',
      sortable: true,
      render: (patient) => (
        <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>
          {patient.room || '-'}
        </span>
      ),
    },
    {
      key: 'admissionDate',
      header: 'Tanggal Masuk',
      width: '180px',
      sortable: true,
      sortValue: (p) => new Date(p.admissionDate).getTime(),
      render: (patient) => (
        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
          {formatDate(patient.admissionDate)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status Layanan',
      width: '140px',
      sortable: true,
      render: (patient) => (
        <Badge variant={getStatusBadgeVariant(patient.status)} label={patient.status} />
      ),
    },
  ];

  return (
    <DataTable<Patient>
      data={patients}
      columns={columns}
      keyExtractor={(p) => p.id}
      isLoading={isLoading}
      searchable={true}
      searchPlaceholder="Cari pasien (No. RM, nama, diagnosis, dokter)..."
      searchKeys={['medicalRecordNumber', 'name', 'diagnosis', 'doctorName', 'room', 'status']}
      initialPageSize={10}
      pageSizeOptions={[5, 10, 25, 50]}
      maxHeight="540px"
      actionColumn={{
        header: 'Aksi Medis',
        width: '150px',
        render: (patient) => (
          <Button
            variant="primary"
            size="sm"
            label="Lihat RME"
            onClick={() => onSelectPatient(patient)}
          >
            Lihat RME
          </Button>
        ),
      }}
      toolbarSlot={
        onRefresh && (
          <Button
            variant="secondary"
            size="sm"
            label="Segarkan"
            onClick={onRefresh}
            isLoading={isLoading}
          >
            Segarkan
          </Button>
        )
      }
    />
  );
};
