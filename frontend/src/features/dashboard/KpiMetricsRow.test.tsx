import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KpiMetricsRow } from './components/KpiMetricsRow';

const mockKpiData = {
  visits: {
    total_visits: 125,
    general_visits: 45,
    bpjs_visits: 80,
    completed_visits: 110,
  },
  revenue: {
    total_revenue: 15450000,
    general_revenue: 6250000,
    bpjs_covered_revenue: 9200000,
  },
};

describe('KpiMetricsRow', () => {
  it('renders KPI metrics cards with visits, revenue in Rupiah format, and bpjs counts', () => {
    render(<KpiMetricsRow data={mockKpiData} isLoading={false} />);

    // Verify visits metric
    expect(screen.getByText('125')).toBeDefined();
    expect(screen.getByText(/Total Kunjungan/i)).toBeDefined();

    // Verify BPJS vs General breakdown
    expect(screen.getByText(/80 Pasien BPJS/i)).toBeDefined();
    expect(screen.getByText(/45 Pasien Umum/i)).toBeDefined();

    // Verify revenue formatted in Rupiah
    expect(screen.getAllByText(/15.450.000/i).length).toBeGreaterThan(0);
  });
});
