import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GlobalErrorModal } from './GlobalErrorModal';
import { GlobalErrorProvider, useGlobalError } from '../../contexts/GlobalErrorContext';

const TestComponent = () => {
  const { showError } = useGlobalError();
  return (
    <div>
      <button
        onClick={() => showError({ statusCode: 500, message: 'Terjadi kesalahan internal pada server database.' })}
      >
        Trigger 500
      </button>
      <button
        onClick={() => showError({ statusCode: 403, message: 'Anda tidak memiliki hak akses ke modul ini.' })}
      >
        Trigger 403
      </button>
      <button
        onClick={() => showError({ statusCode: 422, message: 'Error validasi form' })}
      >
        Trigger 422
      </button>
    </div>
  );
};

describe('GlobalErrorModal & GlobalErrorContext', () => {
  it('opens modal for 500 server errors and displays informative Indonesian message', () => {
    render(
      <GlobalErrorProvider>
        <TestComponent />
        <GlobalErrorModal />
      </GlobalErrorProvider>
    );

    // Initial: no modal
    expect(screen.queryByRole('alertdialog')).toBeNull();

    // Trigger 500
    fireEvent.click(screen.getByText('Trigger 500'));

    // Modal appears
    expect(screen.getByRole('alertdialog')).toBeDefined();
    expect(screen.getByText(/Kesalahan Sistem Server/i)).toBeDefined();
    expect(screen.getByText(/Terjadi kesalahan internal pada server database/i)).toBeDefined();

    // Dismiss
    const closeBtns = screen.getAllByRole('button', { name: /Tutup|Mengerti/i });
    fireEvent.click(closeBtns[0]);
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  it('suppresses global modal for 422 validation errors to keep inline forms clean', () => {
    render(
      <GlobalErrorProvider>
        <TestComponent />
        <GlobalErrorModal />
      </GlobalErrorProvider>
    );

    // Trigger 422
    fireEvent.click(screen.getByText('Trigger 422'));

    // Modal must NOT open for 422
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });
});
