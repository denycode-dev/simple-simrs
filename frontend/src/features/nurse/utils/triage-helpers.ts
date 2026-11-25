export type ClinicalSeverity = 'normal' | 'warning' | 'critical';

export interface ClinicalStatusEvaluation {
  severity: ClinicalSeverity;
  statusVariant: 'success' | 'warning' | 'error';
  tokenColor: 'green' | 'orange' | 'red';
  iconName: 'success' | 'warning' | 'error';
  shortLabel: string;
  message: string;
}

export interface BmiEvaluationResult {
  bmiValue: number | null;
  bmiFormatted: string;
  categoryLabel: string;
  evaluation: ClinicalStatusEvaluation;
}

export interface TriageFormValues {
  weightKg: number | null | undefined;
  heightCm: number | null | undefined;
  systolic: number | null | undefined;
  diastolic: number | null | undefined;
  pulseRate: number | null | undefined;
  bodyTemp: number | null | undefined;
  respiratoryRate: number | null | undefined;
  chiefComplaint: string;
  allergyHistory: string;
}

export interface TriageValidationResult {
  isValid: boolean;
  bpOrderError?: string;
  complaintError?: string;
  allergyError?: string;
  firstErrorMessage: string;
}

export const DEFAULT_NO_ALLERGY_TEXT = 'Tidak ada riwayat alergi obat/makanan';

export function calculatePatientAge(birthDate?: string, referenceYear = new Date().getFullYear()): number {
  if (!birthDate) return 30;
  const parsedYear = new Date(birthDate).getFullYear();
  if (Number.isNaN(parsedYear)) return 30;
  return Math.max(1, referenceYear - parsedYear);
}

export function detectActiveAllergy(allergyText?: string | null): boolean {
  if (!allergyText) return false;
  const normalized = allergyText.trim().toLowerCase();
  if (!normalized || normalized === '-') return false;
  if (
    normalized.includes('tidak ada') ||
    normalized.includes('tidak memiliki') ||
    normalized.includes('nihil') ||
    normalized === 'tidak' ||
    normalized === 'none'
  ) {
    return false;
  }
  return true;
}

export function evaluateBmi(
  weightKg: number | null | undefined,
  heightCm: number | null | undefined
): BmiEvaluationResult {
  if (
    weightKg === null ||
    weightKg === undefined ||
    heightCm === null ||
    heightCm === undefined ||
    weightKg <= 0 ||
    heightCm <= 0
  ) {
    return {
      bmiValue: null,
      bmiFormatted: '-',
      categoryLabel: 'Belum Terhitung',
      evaluation: {
        severity: 'warning',
        statusVariant: 'warning',
        tokenColor: 'orange',
        iconName: 'warning',
        shortLabel: 'Belum Lengkap',
        message: 'Masukkan berat dan tinggi badan valid untuk menghitung BMI.',
      },
    };
  }

  const bmiValue = weightKg / Math.pow(heightCm / 100, 2);
  const bmiFormatted = bmiValue.toFixed(1);

  if (bmiValue < 18.5) {
    return {
      bmiValue,
      bmiFormatted,
      categoryLabel: 'Berat Kurang (Underweight)',
      evaluation: {
        severity: 'warning',
        statusVariant: 'warning',
        tokenColor: 'orange',
        iconName: 'warning',
        shortLabel: 'Underweight',
        message: 'BMI di bawah 18,5 kg/m² (berat badan kurang).',
      },
    };
  }

  if (bmiValue <= 24.9) {
    return {
      bmiValue,
      bmiFormatted,
      categoryLabel: 'Normal (Ideal)',
      evaluation: {
        severity: 'normal',
        statusVariant: 'success',
        tokenColor: 'green',
        iconName: 'success',
        shortLabel: 'Normal',
        message: 'BMI berada dalam rentang ideal (18,5–24,9 kg/m²).',
      },
    };
  }

  if (bmiValue <= 29.9) {
    return {
      bmiValue,
      bmiFormatted,
      categoryLabel: 'Berat Lebih (Overweight)',
      evaluation: {
        severity: 'warning',
        statusVariant: 'warning',
        tokenColor: 'orange',
        iconName: 'warning',
        shortLabel: 'Overweight',
        message: 'BMI di atas rentang ideal (25,0–29,9 kg/m²).',
      },
    };
  }

  return {
    bmiValue,
    bmiFormatted,
    categoryLabel: 'Obesitas',
    evaluation: {
      severity: 'critical',
      statusVariant: 'error',
      tokenColor: 'red',
      iconName: 'error',
      shortLabel: 'Obesitas',
      message: 'BMI >= 30,0 kg/m² (kategori obesitas klinis).',
    },
  };
}

export type VitalSignKind = 'systolic' | 'diastolic' | 'pulse' | 'temp' | 'respiratory';

export function evaluateVitalSign(
  kind: VitalSignKind,
  value: number | null | undefined
): ClinicalStatusEvaluation {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return {
      severity: 'warning',
      statusVariant: 'warning',
      tokenColor: 'orange',
      iconName: 'warning',
      shortLabel: 'Belum Diisi',
      message: 'Nilai pengukuran wajib diisi.',
    };
  }

  switch (kind) {
    case 'systolic': {
      if (value < 90) {
        return {
          severity: 'critical',
          statusVariant: 'error',
          tokenColor: 'red',
          iconName: 'error',
          shortLabel: 'Rendah (Hipotensi)',
          message: 'Sistolik < 90 mmHg — waspadai hipotensi.',
        };
      }
      if (value <= 129) {
        return {
          severity: 'normal',
          statusVariant: 'success',
          tokenColor: 'green',
          iconName: 'success',
          shortLabel: 'Normal',
          message: 'Tekanan darah sistolik dalam batas normal.',
        };
      }
      if (value <= 139) {
        return {
          severity: 'warning',
          statusVariant: 'warning',
          tokenColor: 'orange',
          iconName: 'warning',
          shortLabel: 'Pra-Hipertensi',
          message: 'Sistolik 130–139 mmHg — perlu pemantauan.',
        };
      }
      return {
        severity: 'critical',
        statusVariant: 'error',
        tokenColor: 'red',
        iconName: 'error',
        shortLabel: 'Tinggi (Hipertensi)',
        message: 'Sistolik >= 140 mmHg — indikasi hipertensi.',
      };
    }

    case 'diastolic': {
      if (value < 60) {
        return {
          severity: 'warning',
          statusVariant: 'warning',
          tokenColor: 'orange',
          iconName: 'warning',
          shortLabel: 'Rendah',
          message: 'Diastolik < 60 mmHg — di bawah rentang normal.',
        };
      }
      if (value <= 84) {
        return {
          severity: 'normal',
          statusVariant: 'success',
          tokenColor: 'green',
          iconName: 'success',
          shortLabel: 'Normal',
          message: 'Tekanan darah diastolik dalam batas normal.',
        };
      }
      if (value <= 89) {
        return {
          severity: 'warning',
          statusVariant: 'warning',
          tokenColor: 'orange',
          iconName: 'warning',
          shortLabel: 'Batas Atas',
          message: 'Diastolik 85–89 mmHg — mendekati ambang hipertensi.',
        };
      }
      return {
        severity: 'critical',
        statusVariant: 'error',
        tokenColor: 'red',
        iconName: 'error',
        shortLabel: 'Tinggi (Hipertensi)',
        message: 'Diastolik >= 90 mmHg — indikasi hipertensi.',
      };
    }

    case 'pulse': {
      if (value < 60) {
        return {
          severity: 'warning',
          statusVariant: 'warning',
          tokenColor: 'orange',
          iconName: 'warning',
          shortLabel: 'Bradikardia',
          message: 'Nadi < 60 x/mnt (bradikardia).',
        };
      }
      if (value <= 100) {
        return {
          severity: 'normal',
          statusVariant: 'success',
          tokenColor: 'green',
          iconName: 'success',
          shortLabel: 'Normal',
          message: 'Frekuensi nadi dewasa normal.',
        };
      }
      return {
        severity: value > 120 ? 'critical' : 'warning',
        statusVariant: value > 120 ? 'error' : 'warning',
        tokenColor: value > 120 ? 'red' : 'orange',
        iconName: value > 120 ? 'error' : 'warning',
        shortLabel: 'Takikardia',
        message: 'Nadi > 100 x/mnt (takikardia).',
      };
    }

    case 'temp': {
      if (value < 36.1) {
        return {
          severity: 'warning',
          statusVariant: 'warning',
          tokenColor: 'orange',
          iconName: 'warning',
          shortLabel: 'Rendah (< 36,1 °C)',
          message: 'Suhu tubuh di bawah 36,1 °C.',
        };
      }
      if (value <= 37.4) {
        return {
          severity: 'normal',
          statusVariant: 'success',
          tokenColor: 'green',
          iconName: 'success',
          shortLabel: 'Normal',
          message: 'Suhu tubuh afebris (normal).',
        };
      }
      if (value <= 38.4) {
        return {
          severity: 'warning',
          statusVariant: 'warning',
          tokenColor: 'orange',
          iconName: 'warning',
          shortLabel: 'Demam / Subfebris',
          message: 'Suhu 37,5–38,4 °C — peningkatan suhu tubuh.',
        };
      }
      return {
        severity: 'critical',
        statusVariant: 'error',
        tokenColor: 'red',
        iconName: 'error',
        shortLabel: 'Demam Tinggi',
        message: 'Suhu >= 38,5 °C — demam tinggi (pireksia).',
      };
    }

    case 'respiratory': {
      if (value < 12) {
        return {
          severity: 'critical',
          statusVariant: 'error',
          tokenColor: 'red',
          iconName: 'error',
          shortLabel: 'Bradipnea',
          message: 'Laju napas < 12 x/mnt — waspadai depresi napas.',
        };
      }
      if (value <= 20) {
        return {
          severity: 'normal',
          statusVariant: 'success',
          tokenColor: 'green',
          iconName: 'success',
          shortLabel: 'Normal',
          message: 'Laju pernapasan dewasa normal.',
        };
      }
      return {
        severity: value > 26 ? 'critical' : 'warning',
        statusVariant: value > 26 ? 'error' : 'warning',
        tokenColor: value > 26 ? 'red' : 'orange',
        iconName: value > 26 ? 'error' : 'warning',
        shortLabel: 'Takipnea',
        message: 'Laju napas > 20 x/mnt (takipnea).',
      };
    }
  }
}

export function validateTriageForm(values: TriageFormValues): TriageValidationResult {
  const complaintTrimmed = values.chiefComplaint.trim();
  const allergyTrimmed = values.allergyHistory.trim();

  const complaintError =
    complaintTrimmed.length === 0
      ? 'Keluhan utama pasien wajib diisi sebelum meneruskan ke dokter.'
      : undefined;

  const allergyError =
    allergyTrimmed.length === 0
      ? 'Status riwayat alergi wajib diisi (ketik "Tidak ada" bila nihil).'
      : undefined;

  const hasMissingVital =
    values.weightKg === null ||
    values.weightKg === undefined ||
    values.weightKg <= 0 ||
    values.heightCm === null ||
    values.heightCm === undefined ||
    values.heightCm <= 0 ||
    values.systolic === null ||
    values.systolic === undefined ||
    values.diastolic === null ||
    values.diastolic === undefined ||
    values.pulseRate === null ||
    values.pulseRate === undefined ||
    values.bodyTemp === null ||
    values.bodyTemp === undefined ||
    values.respiratoryRate === null ||
    values.respiratoryRate === undefined;

  const bpOrderError =
    values.systolic !== null &&
    values.systolic !== undefined &&
    values.diastolic !== null &&
    values.diastolic !== undefined &&
    values.systolic <= values.diastolic
      ? 'Tekanan sistolik harus lebih besar daripada tekanan diastolik.'
      : undefined;

  if (complaintError) {
    return {
      isValid: false,
      complaintError,
      allergyError,
      bpOrderError,
      firstErrorMessage: complaintError,
    };
  }

  if (allergyError) {
    return {
      isValid: false,
      complaintError,
      allergyError,
      bpOrderError,
      firstErrorMessage: allergyError,
    };
  }

  if (bpOrderError) {
    return {
      isValid: false,
      complaintError,
      allergyError,
      bpOrderError,
      firstErrorMessage: bpOrderError,
    };
  }

  if (hasMissingVital) {
    return {
      isValid: false,
      firstErrorMessage: 'Lengkapi seluruh angka tanda-tanda vital dan antropometri wajib.',
    };
  }

  return {
    isValid: true,
    firstErrorMessage: '',
  };
}

export function isValidIcd10Code(code: string): boolean {
  const trimmed = code.trim();
  if (!trimmed || trimmed.length > 20) return false;
  return /^[A-Z][0-9]{2}(\.[A-Z0-9]{1,4})?$/i.test(trimmed);
}
