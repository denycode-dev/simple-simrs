import React, { useState } from 'react';
import { Card, CardHeader, CardContent, CardFooter, Button, Badge } from '../../../components/ui';

export interface LabOrderItem {
  id: number;
  test_name: string;
  test_code: string;
  result_value: string | null;
  reference_range: string;
  unit: string;
  status_flag: 'NORMAL' | 'ABNORMAL' | 'HIGH' | 'LOW' | null;
  tariff: number;
  notes: string | null;
}

export interface LabOrderDetail {
  id: number;
  order_number: string;
  patient_name: string;
  medical_record_number: string;
  doctor_name: string;
  polyclinic_name: string;
  clinical_notes: string | null;
  status: 'REQUESTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  items: LabOrderItem[];
}

export interface LabResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: LabOrderDetail | null;
  onSuccess: () => void;
}

export const LabResultModal: React.FC<LabResultModalProps> = ({
  isOpen,
  onClose,
  order,
  onSuccess,
}) => {
  if (!isOpen || !order) return null;

  const [itemsData, setItemsData] = useState<
    Array<{
      id: number;
      test_name: string;
      result_value: string;
      reference_range: string;
      unit: string;
      status_flag: 'NORMAL' | 'ABNORMAL';
      notes: string;
    }>
  >(
    order.items.map((item) => ({
      id: item.id,
      test_name: item.test_name,
      result_value: item.result_value || '',
      reference_range: item.reference_range || '',
      unit: item.unit || '',
      status_flag: item.status_flag === 'ABNORMAL' ? 'ABNORMAL' : 'NORMAL',
      notes: item.notes || '',
    }))
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleItemChange = (index: number, field: string, value: any) => {
    setItemsData((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check that all items have a result value
    const emptyItems = itemsData.filter((i) => !i.result_value.trim());
    if (emptyItems.length > 0) {
      setErrorMessage(`Harap isi hasil untuk semua parameter (${emptyItems.length} belum diisi).`);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        completed_by: 1, // Petugas lab
        items: itemsData.map((item) => ({
          id: item.id,
          result_value: item.result_value,
          reference_range: item.reference_range,
          unit: item.unit,
          status_flag: item.status_flag,
          notes: item.notes,
        })),
      };

      const response = await fetch(`http://localhost:4000/api/v1/laboratory/orders/${order.id}/results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Gagal menyimpan hasil laboratorium');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan sistem saat menyimpan hasil lab');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isReadOnly = order.status === 'COMPLETED';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="lab-result-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
    >
      <Card className="w-full max-w-4xl bg-white shadow-xl max-h-[90vh] flex flex-col">
        <CardHeader className="flex items-center justify-between border-b border-border-default pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 id="lab-result-title" className="text-xl font-bold text-text-main">
                {isReadOnly ? 'Lembar Hasil Pemeriksaan Laboratorium' : 'Input Hasil Pemeriksaan Laboratorium'}
              </h2>
              <Badge variant={order.status === 'COMPLETED' ? 'success' : 'warning'}>
                {order.status}
              </Badge>
            </div>
            <p className="text-sm text-text-muted mt-1">
              Order: <span className="font-mono text-primary font-semibold">{order.order_number}</span> | Pasien:{' '}
              <span className="font-semibold text-text-main">{order.patient_name}</span> (
              <span className="font-mono text-text-muted">{order.medical_record_number}</span>) | DPJP:{' '}
              <span>{order.doctor_name}</span> ({order.polyclinic_name})
            </p>
            {order.clinical_notes && (
              <p className="text-xs text-text-muted mt-1 italic">
                Catatan Klinis: "{order.clinical_notes}"
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup modal hasil lab"
            className="text-text-muted hover:text-text-main text-2xl font-bold leading-none p-1 rounded focus:outline-none focus:ring-2 focus:ring-primary"
          >
            &times;
          </button>
        </CardHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <CardContent className="space-y-4">
            {errorMessage && (
              <div
                role="alert"
                className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm"
              >
                {errorMessage}
              </div>
            )}

            <div className="overflow-x-auto border border-border-default rounded-md">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-text-muted border-b border-border-default font-semibold text-xs">
                  <tr>
                    <th className="py-2.5 px-3">Parameter Uji</th>
                    <th className="py-2.5 px-3">Nilai Rujukan</th>
                    <th className="py-2.5 px-3">Satuan</th>
                    <th className="py-2.5 px-3 w-40">Hasil Pemeriksaan</th>
                    <th className="py-2.5 px-3 w-36">Status Hasil</th>
                    <th className="py-2.5 px-3">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light">
                  {itemsData.map((item, index) => (
                    <tr
                      key={item.id}
                      className={item.status_flag === 'ABNORMAL' ? 'bg-red-50/40' : 'hover:bg-slate-50/50'}
                    >
                      <td className="py-2.5 px-3 font-medium text-text-main">
                        {item.test_name}
                      </td>
                      <td className="py-2.5 px-3 text-text-muted font-mono text-xs">
                        {item.reference_range}
                      </td>
                      <td className="py-2.5 px-3 text-text-muted font-mono text-xs">
                        {item.unit}
                      </td>
                      <td className="py-2.5 px-3">
                        {isReadOnly ? (
                          <span
                            className={`font-mono font-semibold ${
                              item.status_flag === 'ABNORMAL' ? 'text-red-600' : 'text-text-main'
                            }`}
                          >
                            {item.result_value || '-'}
                          </span>
                        ) : (
                          <input
                            type="text"
                            value={item.result_value}
                            onChange={(e) => handleItemChange(index, 'result_value', e.target.value)}
                            placeholder="Nilai..."
                            className="w-full px-2 py-1 text-sm border border-border-default rounded focus:ring-1 focus:ring-primary focus:outline-none"
                            required
                          />
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        {isReadOnly ? (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                              item.status_flag === 'ABNORMAL'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {item.status_flag}
                          </span>
                        ) : (
                          <select
                            value={item.status_flag}
                            onChange={(e) => handleItemChange(index, 'status_flag', e.target.value)}
                            className={`w-full px-2 py-1 text-xs font-semibold rounded border focus:outline-none ${
                              item.status_flag === 'ABNORMAL'
                                ? 'border-red-300 bg-red-50 text-red-700'
                                : 'border-emerald-300 bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            <option value="NORMAL">NORMAL</option>
                            <option value="ABNORMAL">ABNORMAL</option>
                          </select>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        {isReadOnly ? (
                          <span className="text-xs text-text-muted">{item.notes || '-'}</span>
                        ) : (
                          <input
                            type="text"
                            value={item.notes}
                            onChange={(e) => handleItemChange(index, 'notes', e.target.value)}
                            placeholder="Catatan..."
                            className="w-full px-2 py-1 text-xs border border-border-default rounded focus:ring-1 focus:ring-primary focus:outline-none"
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>

          <CardFooter className="flex justify-end gap-3 border-t border-border-default pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              {isReadOnly ? 'Tutup' : 'Batal'}
            </Button>
            {!isReadOnly && (
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Menyimpan...' : 'Simpan & Verifikasi Hasil'}
              </Button>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};
