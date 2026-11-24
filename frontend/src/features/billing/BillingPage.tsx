import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../lib/api-client';
import { BillingQueueTable } from './components/BillingQueueTable';
import { PaymentModal, type BillingDetail } from './components/PaymentModal';
import { PrintableInvoice } from './components/PrintableInvoice';
import { Button } from '../../components/ui';

export const BillingPage: React.FC = () => {
  const [billings, setBillings] = useState<BillingDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [selectedBillingForPayment, setSelectedBillingForPayment] = useState<BillingDetail | null>(null);
  const [selectedBillingForInvoice, setSelectedBillingForInvoice] = useState<BillingDetail | null>(null);

  const fetchBillings = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await apiClient<{ success: boolean; data: BillingDetail[] }>('/billings');
      if (res && res.success && Array.isArray(res.data)) {
        setBillings(res.data);
      } else {
        setBillings([]);
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || err.message || 'Gagal memuat daftar tagihan kasir.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBillings();
  }, [fetchBillings]);

  const handlePaymentSuccess = (updatedBilling: BillingDetail) => {
    fetchBillings();
    setSelectedBillingForInvoice(updatedBilling);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main tracking-tight">
            Kasir & Pelunasan Tagihan Terpadu Rawat Jalan
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Penyelesaian tagihan tunai dengan hitung kembalian otomatis, verifikasi klaim BPJS, dan penerbitan kuitansi resmi
          </p>
        </div>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center justify-between"
        >
          <span>{errorMessage}</span>
          <Button variant="outline" size="sm" onClick={fetchBillings}>
            Coba Lagi
          </Button>
        </div>
      )}

      <BillingQueueTable
        billings={billings}
        isLoading={isLoading}
        onOpenPayment={(b) => setSelectedBillingForPayment(b)}
        onOpenInvoice={(b) => setSelectedBillingForInvoice(b)}
        onRefresh={fetchBillings}
      />

      {/* Payment Processing Modal */}
      <PaymentModal
        isOpen={Boolean(selectedBillingForPayment)}
        billing={selectedBillingForPayment}
        onClose={() => setSelectedBillingForPayment(null)}
        onSuccess={handlePaymentSuccess}
      />

      {/* Printable Invoice Modal */}
      <PrintableInvoice
        isOpen={Boolean(selectedBillingForInvoice)}
        billing={selectedBillingForInvoice}
        onClose={() => setSelectedBillingForInvoice(null)}
      />
    </div>
  );
};
