import React, { useState } from 'react';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { TextArea } from '@astryxdesign/core/TextArea';
import { HStack } from '@astryxdesign/core/HStack';
import { Badge } from '@astryxdesign/core/Badge';

export interface LabTestOption {
  test_code: string;
  test_name: string;
  reference_range: string;
  unit: string;
  tariff: number;
}

export const AVAILABLE_LAB_TESTS: LabTestOption[] = [
  { test_code: 'HB01', test_name: 'Hemoglobin (Hb)', reference_range: '13.0 - 17.0', unit: 'g/dL', tariff: 45000 },
  { test_code: 'LEUKO01', test_name: 'Leukosit Total', reference_range: '4.000 - 10.000', unit: '/uL', tariff: 45000 },
  { test_code: 'TROMBO01', test_name: 'Trombosit', reference_range: '150.000 - 450.000', unit: '/uL', tariff: 45000 },
  { test_code: 'GLU01', test_name: 'Glukosa Puasa', reference_range: '70 - 100', unit: 'mg/dL', tariff: 35000 },
  { test_code: 'CHOL01', test_name: 'Kolesterol Total', reference_range: '< 200', unit: 'mg/dL', tariff: 45000 },
  { test_code: 'UA01', test_name: 'Asam Urat', reference_range: '3.4 - 7.0', unit: 'mg/dL', tariff: 40000 },
  { test_code: 'SGOT01', test_name: 'SGOT / AST', reference_range: '< 37', unit: 'U/L', tariff: 50000 },
  { test_code: 'SGPT01', test_name: 'SGPT / ALT', reference_range: '< 42', unit: 'U/L', tariff: 50000 },
  { test_code: 'CREAT01', test_name: 'Kreatinin Serum', reference_range: '0.6 - 1.2', unit: 'mg/dL', tariff: 50000 },
  { test_code: 'URN01', test_name: 'Urin Lengkap Rutin', reference_range: 'Normal/Negatif', unit: 'kualitatif', tariff: 35000 },
];

export interface LabOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  registrationId: number;
  examinationId: number;
  patientName: string;
  medicalRecordNumber: string;
  onSuccess: () => void;
}

export const LabOrderModal: React.FC<LabOrderModalProps> = ({
  isOpen,
  onClose,
  registrationId,
  examinationId,
  patientName,
  medicalRecordNumber,
  onSuccess,
}) => {
  const [selectedTests, setSelectedTests] = useState<LabTestOption[]>([]);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleTest = (test: LabTestOption) => {
    if (selectedTests.some((t) => t.test_code === test.test_code)) {
      setSelectedTests(selectedTests.filter((t) => t.test_code !== test.test_code));
    } else {
      setSelectedTests([...selectedTests, test]);
    }
  };

  const totalTariff = selectedTests.reduce((acc, t) => acc + t.tariff, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTests.length === 0) {
      setErrorMessage('Pilih minimal satu pemeriksaan laboratorium.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        registration_id: registrationId,
        examination_id: examinationId,
        clinical_notes: clinicalNotes,
        items: selectedTests.map((t) => ({
          test_name: t.test_name,
          test_code: t.test_code,
          reference_range: t.reference_range,
          unit: t.unit,
          tariff: t.tariff,
        })),
      };

      const response = await fetch('http://localhost:4000/api/v1/laboratory/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Gagal mengirim permintaan laboratorium');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat menyimpan order lab');
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
      aria-labelledby="lab-order-title"
    >
      <div className="p-6 bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
        <DialogHeader
          title={
            <div>
              <h2 id="lab-order-title" className="text-xl font-bold text-slate-900">
                Permintaan Pemeriksaan Laboratorium
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Pasien: <span className="font-semibold text-slate-800">{patientName}</span> (
                <span className="font-mono text-teal-700 font-medium">{medicalRecordNumber}</span>)
              </p>
            </div>
          }
          onOpenChange={() => onClose()}
        />

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto mt-4 space-y-5">
          {errorMessage && (
            <Banner
              status="error"
              title="Validasi Gagal"
              description={errorMessage}
              container="card"
            />
          )}

          <div>
            <TextArea
              label="Indikasi Klinis / Catatan Dokter"
              placeholder="Contoh: Suspek DM Tipe 2, lemas, polidipsia"
              value={clinicalNotes}
              onChange={(val) => setClinicalNotes(val)}
              rows={2}
              width="100%"
            />
          </div>

          <div>
            <HStack justify="between" align="center" className="mb-2">
              <span className="text-sm font-semibold text-slate-900">
                Pilih Parameter Pemeriksaan ({selectedTests.length} dipilih)
              </span>
              <Badge
                variant="teal"
                label={`Estimasi: Rp ${totalTariff.toLocaleString('id-ID')}`}
              />
            </HStack>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto p-2 border border-slate-200 rounded-lg bg-slate-50/50">
              {AVAILABLE_LAB_TESTS.map((test) => {
                const isChecked = selectedTests.some((t) => t.test_code === test.test_code);
                return (
                  <label
                    key={test.test_code}
                    className={`flex items-start p-3 rounded-lg border cursor-pointer transition-all ${
                      isChecked
                        ? 'border-teal-500 bg-teal-50/70 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleTest(test)}
                      className="mt-0.5 mr-3 h-4 w-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                    />
                    <div className="text-xs">
                      <div className="font-semibold text-slate-900">{test.test_name}</div>
                      <div className="text-slate-500">
                        Rujukan: {test.reference_range} {test.unit}
                      </div>
                      <div className="text-teal-700 font-medium mt-0.5">
                        Rp {test.tariff.toLocaleString('id-ID')}
                      </div>
                    </div>
                  </label>
                );
              })}
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
              label={isSubmitting ? 'Mengirim...' : 'Kirim Permintaan Lab'}
              isDisabled={isSubmitting || selectedTests.length === 0}
              isLoading={isSubmitting}
            />
          </HStack>
        </form>
      </div>
    </Dialog>
  );
};
