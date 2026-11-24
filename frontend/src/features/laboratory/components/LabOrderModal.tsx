import React, { useState } from 'react';
import { Card, CardHeader, CardContent, CardFooter, Button } from '../../../components/ui';

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
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="lab-order-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
    >
      <Card className="w-full max-w-2xl bg-white shadow-xl max-h-[90vh] flex flex-col">
        <CardHeader className="flex items-center justify-between border-b border-border-default pb-4">
          <div>
            <h2 id="lab-order-title" className="text-xl font-bold text-text-main">
              Permintaan Pemeriksaan Laboratorium
            </h2>
            <p className="text-sm text-text-muted mt-1">
              Pasien: <span className="font-semibold text-text-main">{patientName}</span> ({' '}
              <span className="font-mono text-primary font-medium">{medicalRecordNumber}</span> )
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup modal order lab"
            className="text-text-muted hover:text-text-main text-2xl font-bold leading-none p-1 rounded focus:outline-none focus:ring-2 focus:ring-primary"
          >
            &times;
          </button>
        </CardHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <CardContent className="space-y-5">
            {errorMessage && (
              <div
                role="alert"
                className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm"
              >
                {errorMessage}
              </div>
            )}

            <div>
              <label htmlFor="clinical-notes" className="block text-sm font-semibold text-text-main mb-1">
                Indikasi Klinis / Catatan Dokter
              </label>
              <textarea
                id="clinical-notes"
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                placeholder="Contoh: Suspek DM Tipe 2, lemas, polidipsia"
                rows={2}
                className="w-full px-3 py-2 text-sm rounded-md border border-border-default focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-text-main">
                  Pilih Parameter Pemeriksaan ({selectedTests.length} dipilih)
                </span>
                <span className="text-sm font-medium text-primary">
                  Estimasi Biaya: Rp {totalTariff.toLocaleString('id-ID')}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1 border border-border-light rounded-md">
                {AVAILABLE_LAB_TESTS.map((test) => {
                  const isChecked = selectedTests.some((t) => t.test_code === test.test_code);
                  return (
                    <label
                      key={test.test_code}
                      className={`flex items-start p-2.5 rounded border cursor-pointer transition-colors ${
                        isChecked
                          ? 'border-primary bg-primary-light/40 text-primary-dark'
                          : 'border-border-default hover:bg-slate-50 text-text-main'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleTest(test)}
                        className="mt-0.5 mr-2.5 h-4 w-4 text-primary rounded border-border-default focus:ring-primary"
                      />
                      <div className="text-xs">
                        <div className="font-semibold">{test.test_name}</div>
                        <div className="text-text-muted">
                          Rujukan: {test.reference_range} {test.unit}
                        </div>
                        <div className="text-slate-600 font-medium mt-0.5">
                          Rp {test.tariff.toLocaleString('id-ID')}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-end gap-3 border-t border-border-default pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || selectedTests.length === 0}
            >
              {isSubmitting ? 'Mengirim...' : 'Kirim Permintaan Lab'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};
