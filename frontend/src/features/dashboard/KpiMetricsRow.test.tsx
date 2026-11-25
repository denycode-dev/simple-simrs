import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { KpiMetricsRow } from './components/KpiMetricsRow';
import { DashboardAnalyticsPage } from './DashboardAnalyticsPage';
import * as apiModule from '@/lib/api-client';

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

    expect(screen.getByText('125')).toBeDefined();
    expect(screen.getByText(/Total Kunjungan/i)).toBeDefined();
    expect(screen.getByText(/80 Pasien BPJS/i)).toBeDefined();
    expect(screen.getByText(/45 Pasien Umum/i)).toBeDefined();
    expect(screen.getAllByText(/15\.450\.000/i).length).toBeGreaterThan(0);
  });
});

describe('DashboardAnalyticsPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches analytics via apiClient and opens scrollable unit detail modal', async () => {
    vi.spyOn(apiModule, 'apiClient').mockImplementation((async (url: string) => {
      if (String(url).includes('/analytics/summary')) {
        return {
          success: true,
          data: {
            ...mockKpiData,
            polyclinics: [{ polyclinic_name: 'Poli Penyakit Dalam', visit_count: 80 }],
            top_medicines: [
              { medicine_name: 'Paracetamol 500 mg', unit: 'tablet', total_prescribed: 120 },
            ],
          },
        };
      }
      if (String(url).includes('/analytics/queue-status')) {
        return {
          success: true,
          data: {
            total_active_queue: 12,
            statuses: [{ status: 'WAITING_DOCTOR', count: 5 }],
          },
        };
      }
      if (String(url).includes('/analytics/laboratory')) {
        return {
          success: true,
          data: {
            total_orders: 14,
            requested_orders: 3,
            in_progress_orders: 2,
            completed_orders: 9,
            total_test_items: 28,
            abnormal_items: 4,
            total_lab_tariff: 1200000,
          },
        };
      }
      if (String(url).includes('/analytics/pharmacy')) {
        return {
          success: true,
          data: {
            total_active_medicines: 40,
            low_stock_count: 2,
            out_of_stock_count: 1,
            pending_prescriptions: 3,
            dispensed_prescriptions: 22,
            low_stock_medicines: [
              { id: 1, code: 'OBT-001', name: 'Amoxicillin 500 mg', unit: 'kaplet', stock: 0, min_stock: 10 },
            ],
          },
        };
      }
      return { success: true, data: null };
    }) as typeof apiModule.apiClient);

    render(<DashboardAnalyticsPage />);

    await waitFor(() => {
      expect(screen.getByText('125')).toBeDefined();
      expect(screen.getAllByText('Poli Penyakit Dalam').length).toBeGreaterThan(0);
      expect(screen.getByText('Paracetamol 500 mg')).toBeDefined();
    });

    fireEvent.click(screen.getByRole('button', { name: /Detail Unit/i }));

    expect(screen.getByText(/Ringkasan Unit Antrean, Lab & Farmasi/i)).toBeDefined();
    expect(screen.getByText('Amoxicillin 500 mg')).toBeDefined();
  });
});
