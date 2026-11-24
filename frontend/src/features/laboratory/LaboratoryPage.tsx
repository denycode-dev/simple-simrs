import React, { useState, useEffect, useCallback } from 'react';
import { LabWorklistTable } from './components/LabWorklistTable';
import { LabResultModal } from './components/LabResultModal';
import type { LabOrderDetail } from './components/LabResultModal';
import { LabOrderModal } from './components/LabOrderModal';
import { Button } from '../../components/ui';

export const LaboratoryPage: React.FC = () => {
  const [orders, setOrders] = useState<LabOrderDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [selectedOrderForResult, setSelectedOrderForResult] = useState<LabOrderDetail | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetch('http://localhost:4000/api/v1/laboratory/orders');
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setOrders(data.data);
      } else {
        setOrders([]);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal terhubung ke layanan laboratorium (Fastify).');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main tracking-tight">
            Pelayanan Laboratorium Klinis Rawat Jalan
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Pengelolaan permintaan uji laboratorium, entry hasil analisis kuantitatif, dan flag abnormalitas
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsOrderModalOpen(true)}
        >
          + Buat Permintaan Lab Baru
        </Button>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center justify-between"
        >
          <span>{errorMessage}</span>
          <Button variant="outline" size="sm" onClick={fetchOrders}>
            Coba Lagi
          </Button>
        </div>
      )}

      <LabWorklistTable
        orders={orders}
        isLoading={isLoading}
        onOpenResultModal={(order) => setSelectedOrderForResult(order)}
        onRefresh={fetchOrders}
      />

      {/* Result Entry / View Modal */}
      <LabResultModal
        isOpen={Boolean(selectedOrderForResult)}
        onClose={() => setSelectedOrderForResult(null)}
        order={selectedOrderForResult}
        onSuccess={fetchOrders}
      />

      {/* New Lab Order Modal (Demo / Doctor Trigger) */}
      <LabOrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        registrationId={1}
        examinationId={1}
        patientName="Pasien Rawat Jalan"
        medicalRecordNumber="RM-2026-0001"
        onSuccess={fetchOrders}
      />
    </div>
  );
};
