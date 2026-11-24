import React, { useState } from 'react';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import { Banner } from '@astryxdesign/core/Banner';
import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHeaderCell } from '@astryxdesign/core/Table';
import { TextInput } from '@astryxdesign/core/TextInput';
import { Selector } from '@astryxdesign/core/Selector';
import { HStack } from '@astryxdesign/core/HStack';

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

    const emptyItems = itemsData.filter((i) => !i.result_value.trim());
    if (emptyItems.length > 0) {
      setErrorMessage(`Harap isi hasil untuk semua parameter (${emptyItems.length} belum diisi).`);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        completed_by: 1,
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
    <Dialog
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      width={980}
      purpose="form"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lab-result-title"
    >
      <div className="p-6 bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
        <DialogHeader
          title={
            <div>
              <HStack gap={3} align="center">
                <h2 id="lab-result-title" className="text-xl font-bold text-slate-900">
                  {isReadOnly ? 'Lembar Hasil Pemeriksaan Laboratorium' : 'Input Hasil Pemeriksaan Laboratorium'}
                </h2>
                <Badge
                  variant={order.status === 'COMPLETED' ? 'success' : 'warning'}
                  label={order.status}
                />
              </HStack>
              <p className="text-sm text-slate-500 mt-1">
                Order: <span className="font-mono text-teal-700 font-semibold">{order.order_number}</span> | Pasien:{' '}
                <span className="font-semibold text-slate-900">{order.patient_name}</span> (
                <span className="font-mono text-slate-500">{order.medical_record_number}</span>) | DPJP:{' '}
                <span>{order.doctor_name}</span> ({order.polyclinic_name})
              </p>
              {order.clinical_notes && (
                <p className="text-xs text-slate-500 mt-1 italic">
                  Catatan Klinis: "{order.clinical_notes}"
                </p>
              )}
            </div>
          }
          onOpenChange={() => onClose()}
        />

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto mt-4 space-y-4">
          {errorMessage && (
            <Banner
              status="error"
              title="Kesalahan Formulir"
              description={errorMessage}
              container="card"
            />
          )}

          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <Table density="balanced" dividers="rows" hasHover>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>Parameter Uji</TableHeaderCell>
                  <TableHeaderCell>Nilai Rujukan</TableHeaderCell>
                  <TableHeaderCell>Satuan</TableHeaderCell>
                  <TableHeaderCell style={{ width: '180px' }}>Hasil Pemeriksaan</TableHeaderCell>
                  <TableHeaderCell style={{ width: '160px' }}>Status Hasil</TableHeaderCell>
                  <TableHeaderCell>Keterangan</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itemsData.map((item, index) => (
                  <TableRow
                    key={item.id}
                    style={{
                      backgroundColor: item.status_flag === 'ABNORMAL' ? 'rgba(254, 242, 242, 0.6)' : undefined,
                    }}
                  >
                    <TableCell>
                      <span className="font-semibold text-slate-900 text-sm">{item.test_name}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs text-slate-600">{item.reference_range}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs text-slate-600">{item.unit}</span>
                    </TableCell>
                    <TableCell>
                      {isReadOnly ? (
                        <span
                          className={`font-mono font-bold text-sm ${
                            item.status_flag === 'ABNORMAL' ? 'text-red-600' : 'text-slate-900'
                          }`}
                        >
                          {item.result_value || '-'}
                        </span>
                      ) : (
                        <TextInput
                          label="Hasil"
                          isLabelHidden
                          value={item.result_value}
                          onChange={(val) => handleItemChange(index, 'result_value', val)}
                          placeholder="Nilai..."
                          size="sm"
                          isRequired
                          width="100%"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {isReadOnly ? (
                        <Badge
                          variant={item.status_flag === 'ABNORMAL' ? 'error' : 'success'}
                          label={item.status_flag}
                        />
                      ) : (
                        <Selector
                          label="Status"
                          isLabelHidden
                          size="sm"
                          value={item.status_flag}
                          onChange={(val) => handleItemChange(index, 'status_flag', val)}
                          options={[
                            { value: 'NORMAL', label: 'NORMAL' },
                            { value: 'ABNORMAL', label: 'ABNORMAL' },
                          ]}
                          width="100%"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {isReadOnly ? (
                        <span className="text-xs text-slate-500">{item.notes || '-'}</span>
                      ) : (
                        <TextInput
                          label="Catatan"
                          isLabelHidden
                          value={item.notes}
                          onChange={(val) => handleItemChange(index, 'notes', val)}
                          placeholder="Catatan..."
                          size="sm"
                          width="100%"
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <HStack justify="end" gap={3} className="pt-4 border-t border-slate-200">
            <Button
              variant="secondary"
              label={isReadOnly ? 'Tutup' : 'Batal'}
              onClick={onClose}
              isDisabled={isSubmitting}
            />
            {!isReadOnly && (
              <Button
                type="submit"
                variant="primary"
                label={isSubmitting ? 'Menyimpan...' : 'Simpan & Verifikasi Hasil'}
                isDisabled={isSubmitting}
                isLoading={isSubmitting}
              />
            )}
          </HStack>
        </form>
      </div>
    </Dialog>
  );
};
