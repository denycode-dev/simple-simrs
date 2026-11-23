import React from 'react';
import { Input } from '@/components/ui';

export interface PatientFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (status: string) => void;
  totalFiltered: number;
}

export const PatientFilterBar: React.FC<PatientFilterBarProps> = ({
  search,
  onSearchChange,
  status,
  onStatusChange,
  totalFiltered,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 'var(--space-4)',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        backgroundColor: 'var(--color-surface)',
        padding: 'var(--space-5)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: 'var(--space-6)',
      }}
    >
      <div style={{ display: 'flex', flex: '1 1 320px', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 240px' }}>
          <Input
            id="filter-patient-search"
            label="Cari Pasien (Nama, No. RM, Diagnosis)"
            type="search"
            placeholder="Ketik nama, RM, atau diagnosis..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', minWidth: '180px' }}>
          <label
            htmlFor="filter-patient-status"
            style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--color-text-main)',
            }}
          >
            Status Layanan
          </label>
          <select
            id="filter-patient-status"
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            style={{
              padding: '0.625rem 0.875rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text-main)',
              outline: 'none',
              cursor: 'pointer',
              height: '40px',
            }}
          >
            <option value="all">Semua Status</option>
            <option value="Rawat Jalan">Rawat Jalan</option>
            <option value="Rawat Inap">Rawat Inap</option>
            <option value="IGD">IGD (Gawat Darurat)</option>
            <option value="Selesai">Selesai</option>
          </select>
        </div>
      </div>

      <div
        style={{
          fontSize: '0.875rem',
          color: 'var(--color-text-secondary)',
          backgroundColor: 'var(--color-surface-hover)',
          padding: 'var(--space-2) var(--space-4)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border-subtle)',
        }}
      >
        Menampilkan <strong>{totalFiltered}</strong> pasien
      </div>
    </div>
  );
};
