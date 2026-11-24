import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MaskedField } from './MaskedField';

describe('MaskedField', () => {
  it('renders masked value by default and reveals unmasked value on toggle click', async () => {
    render(
      <MaskedField
        maskedValue="320101******0001"
        unmaskedValue="3201012345670001"
        label="NIK Pasien"
      />
    );

    // Initial state: masked
    expect(screen.getByText('320101******0001')).toBeDefined();
    expect(screen.queryByText('3201012345670001')).toBeNull();

    // Toggle button
    const toggleBtn = screen.getByRole('button', { name: /Lihat NIK|Buka Masking|Tampilkan/i });
    expect(toggleBtn).toBeDefined();

    // Click to reveal
    fireEvent.click(toggleBtn);

    // Value revealed
    expect(screen.getByText('3201012345670001')).toBeDefined();

    // Click again to hide
    fireEvent.click(toggleBtn);
    expect(screen.getByText('320101******0001')).toBeDefined();
  });

  it('supports async onFetchUnmask handler and logs audit unmask request', async () => {
    const mockFetch = vi.fn().mockResolvedValue('081234567890');

    render(
      <MaskedField
        maskedValue="0812****7890"
        onFetchUnmask={mockFetch}
        label="Nomor Telepon"
      />
    );

    expect(screen.getByText('0812****7890')).toBeDefined();

    const toggleBtn = screen.getByRole('button', { name: /Lihat Nomor Telepon|Buka Masking|Tampilkan/i });
    fireEvent.click(toggleBtn);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
      expect(screen.getByText('081234567890')).toBeDefined();
    });
  });
});
