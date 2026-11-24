import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FormField } from './FormField';

describe('FormField', () => {
  it('renders label, input, and inline accessible error message with aria attributes', () => {
    render(
      <FormField
        id="nik-input"
        label="Nomor Induk Kependudukan (NIK)"
        required
        error="NIK harus berupa 16 digit angka."
      >
        <input id="nik-input" type="text" placeholder="Masukkan 16 digit NIK" />
      </FormField>
    );

    // Label and required marker
    expect(screen.getByText((content) => content.includes('Nomor Induk Kependudukan'))).toBeDefined();
    expect(screen.getByText('*')).toBeDefined();

    // Input attributes
    const inputEl = screen.getByPlaceholderText('Masukkan 16 digit NIK');
    expect(inputEl.getAttribute('aria-invalid')).toBe('true');
    expect(inputEl.getAttribute('aria-describedby')).toBe('nik-input-error');

    // Inline error message
    const errorEl = screen.getByRole('alert');
    expect(errorEl.textContent).toBe('NIK harus berupa 16 digit angka.');
    expect(errorEl.id).toBe('nik-input-error');
  });

  it('renders cleanly without error message when error prop is omitted or undefined', () => {
    render(
      <FormField id="patient-name" label="Nama Pasien">
        <input id="patient-name" type="text" placeholder="Nama Lengkap" />
      </FormField>
    );

    const inputEl = screen.getByPlaceholderText('Nama Lengkap');
    expect(inputEl.getAttribute('aria-invalid')).toBe('false');
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
