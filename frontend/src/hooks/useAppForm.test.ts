import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAppForm } from './useAppForm';
import { ApiClientError } from '../lib/api-client';

describe('useAppForm', () => {
  it('manages form values, preserves input values on 422 error, and maps field errors', async () => {
    const initialValues = {
      nik: '3201012345670001',
      name: 'Budi Santoso',
      phone: '',
    };

    const mockSubmit = async (_values: typeof initialValues) => {
      // Simulate 422 Unprocessable Entity error from Yii 2 backend
      throw new ApiClientError('Validasi form gagal', 422, {
        nik: ['NIK sudah terdaftar di SIMRS.'],
        phone: ['Nomor telepon wajib diisi.'],
      });
    };

    const { result } = renderHook(() =>
      useAppForm({
        initialValues,
        onSubmit: mockSubmit,
      })
    );

    // Initial state
    expect(result.current.values.nik).toBe('3201012345670001');
    expect(result.current.values.name).toBe('Budi Santoso');
    expect(result.current.fieldErrors).toEqual({});

    // Attempt submit that fails with 422
    await act(async () => {
      await result.current.handleSubmit();
    });

    // Values MUST be preserved (NOT wiped out)
    expect(result.current.values.nik).toBe('3201012345670001');
    expect(result.current.values.name).toBe('Budi Santoso');

    // Field errors mapped
    expect(result.current.fieldErrors.nik).toBe('NIK sudah terdaftar di SIMRS.');
    expect(result.current.fieldErrors.phone).toBe('Nomor telepon wajib diisi.');
    expect(result.current.generalError).toBe('Validasi form gagal');

    // User updates field: field error should clear
    act(() => {
      result.current.setFieldValue('nik', '3201012345670002');
    });

    expect(result.current.values.nik).toBe('3201012345670002');
    expect(result.current.fieldErrors.nik).toBeUndefined();
  });
});
