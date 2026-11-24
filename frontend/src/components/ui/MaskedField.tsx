import React, { useState } from 'react';
import { apiClient } from '../../lib/api-client';

export interface MaskedFieldProps {
  maskedValue: string;
  unmaskedValue?: string;
  onFetchUnmask?: () => Promise<string>;
  patientId?: number;
  fieldToUnmask?: 'nik' | 'phone';
  label?: string;
  canUnmask?: boolean;
  className?: string;
}

export const MaskedField: React.FC<MaskedFieldProps> = ({
  maskedValue,
  unmaskedValue,
  onFetchUnmask,
  patientId,
  fieldToUnmask = 'nik',
  label = 'Data',
  canUnmask = true,
  className = '',
}) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [resolvedValue, setResolvedValue] = useState<string | null>(unmaskedValue || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = async () => {
    if (isRevealed) {
      setIsRevealed(false);
      return;
    }

    // If we already have the resolved unmasked value, simply reveal it
    if (resolvedValue) {
      setIsRevealed(true);
      return;
    }

    // If consumer provided a custom async fetcher
    if (onFetchUnmask) {
      setIsLoading(true);
      setError(null);
      try {
        const val = await onFetchUnmask();
        setResolvedValue(val);
        setIsRevealed(true);
      } catch (err: any) {
        setError(err.message || 'Gagal membuka data masking');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // If patientId is provided, call real logged unmask API
    if (patientId) {
      setIsLoading(true);
      setError(null);
      try {
        const res = await apiClient<{ success: boolean; data: { nik?: string; phone?: string } }>(
          `/patients/${patientId}/unmask`,
          { method: 'POST' }
        );
        if (res && res.success && res.data) {
          const val = fieldToUnmask === 'phone' ? res.data.phone : res.data.nik;
          setResolvedValue(val || maskedValue);
          setIsRevealed(true);
        } else {
          throw new Error('Respons unmask tidak valid');
        }
      } catch (err: any) {
        setError(err.message || 'Gagal mengaudit pembukaan data NIK');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Default fallback: toggle without custom unmasked value
    setIsRevealed(true);
  };

  const displayText = isRevealed ? (resolvedValue || unmaskedValue || maskedValue) : maskedValue;

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className="font-mono text-sm tracking-tight text-text-main select-all">
        {displayText}
      </span>

      {canUnmask && (
        <button
          type="button"
          onClick={handleToggle}
          disabled={isLoading}
          aria-label={isRevealed ? `Sembunyikan ${label}` : `Tampilkan ${label}`}
          title={isRevealed ? `Sembunyikan ${label}` : `Buka Masking ${label} (Tercatat di Audit Log)`}
          className="p-1 text-text-muted hover:text-primary rounded hover:bg-slate-100 focus:outline-none focus:ring-1 focus:ring-primary transition-colors disabled:opacity-50"
        >
          {isLoading ? (
            <span className="inline-block w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          ) : isRevealed ? (
            // Eye Off Icon
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          ) : (
            // Eye On Icon
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      )}

      {error && (
        <span role="alert" className="text-xs text-red-600 font-medium">
          {error}
        </span>
      )}
    </span>
  );
};
