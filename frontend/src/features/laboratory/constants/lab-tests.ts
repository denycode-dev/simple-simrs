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
