import React, { useState, useEffect } from 'react';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Badge } from '@astryxdesign/core/Badge';
import { TextInput } from '@astryxdesign/core/TextInput';
import { TextArea } from '@astryxdesign/core/TextArea';
import { HStack } from '@astryxdesign/core/HStack';
import { formatCurrency } from '../../../utils/formatters';
import { apiClient } from '../../../lib/api-client';

export interface BillingDetail {
  id: number;
  registration_id: number;
  invoice_number: string;
  insurance_type: 'GENERAL' | 'BPJS';
  total_registration_fee: number;
  total_actions_fee: number;
  total_medicines_fee: number;
  total_lab_fee: number;
  total_amount: number;
  covered_by_bpjs: number;
  patient_payable: number;
  payment_status: 'UNPAID' | 'PAID';
  registration?: {
    patient?: {
      name: string;
      medical_record_number: string;
      nik?: string;
    };
    polyclinic?: {
      name: string;
    };
    doctor?: {
      name: string;
    };
    queue_number?: string;
  };
  payments?: Array<{
    id: number;
    payment_number: string;
    payment_method: 'CASH' | 'BPJS';
    amount: number;
    amount_received: number;
    change_amount: number;
    payment_date: string;
  }>;
}

export interface PaymentModalProps {
  isOpen: boolean;
  billing: BillingDetail | null;
  onClose: () => void;
  onSuccess: (updatedBilling: BillingDetail) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  billing,
  onClose,
  onSuccess,
}) => {
  if (!isOpen || !billing) return null;

  const isBpjs = billing.insurance_type === 'BPJS';
  const patientPayable = Number(billing.patient_payable) || 0;

  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BPJS'>(isBpjs ? 'BPJS' : 'CASH');
  const [amountReceivedStr, setAmountReceivedStr] = useState<string>(isBpjs ? '0' : '');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (billing) {
      const isBpjsInsurance = billing.insurance_type === 'BPJS';
      setPaymentMethod(isBpjsInsurance ? 'BPJS' : 'CASH');
      setAmountReceivedStr(isBpjsInsurance ? '0' : '');
      setNotes('');
      setErrorMessage(null);
    }
  }, [billing]);

  const amountReceived = parseFloat(amountReceivedStr) || 0;
  const changeAmount = paymentMethod === 'CASH' ? Math.max(0, amountReceived - patientPayable) : 0;
  const isInsufficient = paymentMethod === 'CASH' && amountReceived < patientPayable;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (paymentMethod === 'CASH' && isInsufficient) {
      setErrorMessage('Nominal uang yang diterima kurang dari total yang harus dibayar.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        payment_method: paymentMethod,
        amount_received: paymentMethod === 'CASH' ? amountReceived : 0,
        notes: notes.trim() || undefined,
      };

      const res = await apiClient<{ success: boolean; data: { billing: BillingDetail } }>(
        `/billings/${billing.id}/pay`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );

      if (res && res.data && res.data.billing) {
        onSuccess(res.data.billing);
      } else {
        onSuccess({ ...billing, payment_status: 'PAID' });
      }
      onClose();
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || err.message || 'Gagal memproses transaksi kasir.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      width={720}
      purpose="form"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-modal-title"
    >
      <div className="p-6 bg-white rounded-xl shadow-2xl flex flex-col max-h-[92vh]">
        <DialogHeader
          title={
            <div>
              <HStack gap={2} align="center">
                <h2 id="payment-modal-title" className="text-xl font-bold text-slate-900">
                  Pembayaran Kasir Rawat Jalan
                </h2>
                <Badge
                  variant={billing.payment_status === 'PAID' ? 'success' : 'warning'}
                  label={billing.payment_status === 'PAID' ? 'LUNAS' : 'BELUM BAYAR'}
                />
              </HStack>
              <p className="text-sm text-slate-500 mt-1">
                Invoice: <span className="font-mono text-teal-700 font-semibold">{billing.invoice_number}</span> | Pasien:{' '}
                <span className="font-semibold text-slate-900">{billing.registration?.patient?.name || 'Pasien'}</span> (
                <span className="font-mono text-slate-500">{billing.registration?.patient?.medical_record_number}</span>)
              </p>
            </div>
          }
          onOpenChange={() => onClose()}
        />

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto mt-4 space-y-5">
          {errorMessage && (
            <Banner
              status="error"
              title="Kesalahan Pembayaran"
              description={errorMessage}
              container="card"
            />
          )}

          {/* Rincian Pos Biaya */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2.5 text-sm">
            <h3 className="font-bold text-xs uppercase tracking-wider mb-2 text-slate-600">
              Rincian Tagihan Layanan Pasien
            </h3>
            <div className="flex justify-between text-slate-600">
              <span>1. Biaya Administrasi & Pendaftaran</span>
              <span className="font-mono font-medium text-slate-900">
                {formatCurrency(Number(billing.total_registration_fee) || 0)}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>2. Tindakan Medis Poliklinik</span>
              <span className="font-mono font-medium text-slate-900">
                {formatCurrency(Number(billing.total_actions_fee) || 0)}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>3. Obat & Farmasi e-Resep</span>
              <span className="font-mono font-medium text-slate-900">
                {formatCurrency(Number(billing.total_medicines_fee) || 0)}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>4. Pemeriksaan Penunjang Laboratorium</span>
              <span className="font-mono font-medium text-slate-900">
                {formatCurrency(Number(billing.total_lab_fee) || 0)}
              </span>
            </div>
            <div className="border-t border-slate-200 pt-2.5 flex justify-between font-bold text-base text-slate-900">
              <span>Total Biaya Pelayanan:</span>
              <span className="font-mono text-teal-700">
                {formatCurrency(Number(billing.total_amount) || 0)}
              </span>
            </div>

            {isBpjs && (
              <div className="border-t border-emerald-200 bg-emerald-50/90 -mx-4 -mb-4 p-4 rounded-b-lg">
                <div className="flex justify-between items-center text-emerald-800 font-semibold text-sm">
                  <span>Ditanggung Penuh BPJS Kesehatan (Rp 0 Bebas Biaya):</span>
                  <span className="font-mono text-base">- {formatCurrency(Number(billing.covered_by_bpjs) || Number(billing.total_amount))}</span>
                </div>
                <div className="flex justify-between items-center text-emerald-950 font-bold text-base mt-1">
                  <span>Total Tagihan Pasien:</span>
                  <span className="font-mono text-lg text-emerald-700">Rp 0</span>
                </div>
              </div>
            )}
          </div>

          {/* Form Pembayaran Kasir */}
          <div className="space-y-4">
            <div>
              <span className="block text-sm font-semibold text-slate-900 mb-2">
                Metode Pembayaran
              </span>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="payment_method"
                    value="CASH"
                    checked={paymentMethod === 'CASH'}
                    onChange={() => setPaymentMethod('CASH')}
                    disabled={isBpjs}
                    className="text-teal-600 focus:ring-teal-500 h-4 w-4"
                  />
                  <span className="text-sm font-medium">Tunai (Cash Full Payment)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="payment_method"
                    value="BPJS"
                    checked={paymentMethod === 'BPJS'}
                    onChange={() => setPaymentMethod('BPJS')}
                    disabled={!isBpjs}
                    className="text-teal-600 focus:ring-teal-500 h-4 w-4"
                  />
                  <span className="text-sm font-medium">Klaim Penjamin BPJS Kesehatan</span>
                </label>
              </div>
            </div>

            {paymentMethod === 'CASH' && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-4">
                <div>
                  <label htmlFor="amount-received" className="block text-sm font-semibold text-slate-900 mb-1">
                    Uang Diterima (Rp) <span className="text-red-500">*</span>
                  </label>
                  <TextInput
                    id="amount-received"
                    label="Uang Diterima (Rp)"
                    isLabelHidden
                    type="text" inputMode="numeric"
                    placeholder="Masukkan nominal uang tunai yang diterima..."
                    value={amountReceivedStr}
                    onChange={(val) => setAmountReceivedStr(val)}
                    isRequired
                    width="100%"
                  />
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                  <span className="text-sm font-semibold text-slate-900">Uang Kembalian Pasien:</span>
                  <span
                    className={`font-mono text-lg font-bold ${
                      isInsufficient ? 'text-red-600' : 'text-emerald-600'
                    }`}
                  >
                    {formatCurrency(changeAmount)}
                  </span>
                </div>

                {isInsufficient && amountReceived > 0 && (
                  <p className="text-xs text-red-600 font-medium">
                    * Uang diterima kurang {formatCurrency(patientPayable - amountReceived)}
                  </p>
                )}
              </div>
            )}

            <div>
              <TextArea
                label="Catatan Transaksi Kasir (Opsional)"
                placeholder="Catatan tambahan pembayaran..."
                value={notes}
                onChange={(val) => setNotes(val)}
                rows={2}
                width="100%"
              />
            </div>
          </div>

          <HStack justify="end" gap={3} className="pt-4 border-t border-slate-200">
            <Button
              variant="secondary"
              label="Batal"
              onClick={onClose}
              isDisabled={isSubmitting}
            />
            <Button
              type="submit"
              variant="primary"
              label={isSubmitting ? 'Memproses Transaksi...' : 'Konfirmasi & Selesaikan Pembayaran'}
              isDisabled={isSubmitting || (paymentMethod === 'CASH' && isInsufficient)}
              isLoading={isSubmitting}
            />
          </HStack>
        </form>
      </div>
    </Dialog>
  );
};
