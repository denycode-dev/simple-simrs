import { useState, useCallback } from 'react';
import { ApiClientError } from '../lib/api-client';

export interface UseAppFormOptions<T extends Record<string, any>> {
  initialValues: T;
  onSubmit: (values: T) => Promise<any>;
  validate?: (values: T) => Partial<Record<keyof T, string>>;
}

export interface UseAppFormReturn<T extends Record<string, any>> {
  values: T;
  fieldErrors: Partial<Record<keyof T, string>>;
  generalError: string | null;
  isSubmitting: boolean;
  setFieldValue: <K extends keyof T>(field: K, value: T[K]) => void;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleSubmit: (e?: React.FormEvent) => Promise<boolean>;
  setFieldErrors: (errors: Partial<Record<keyof T, string>>) => void;
  clearFieldError: (field: keyof T) => void;
  setGeneralError: (err: string | null) => void;
  resetForm: (newValues?: T) => void;
}

export function useAppForm<T extends Record<string, any>>({
  initialValues,
  onSubmit,
  validate,
}: UseAppFormOptions<T>): UseAppFormReturn<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setFieldValue = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    // Clear field error when user edits the field
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const finalValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFieldValue(name as keyof T, finalValue as any);
  }, [setFieldValue]);

  const clearFieldError = useCallback((field: keyof T) => {
    setFieldErrors((prev) => {
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  }, []);

  const resetForm = useCallback((newValues?: T) => {
    setValues(newValues || initialValues);
    setFieldErrors({});
    setGeneralError(null);
    setIsSubmitting(false);
  }, [initialValues]);

  const handleSubmit = useCallback(async (e?: React.FormEvent): Promise<boolean> => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    setGeneralError(null);

    // Client-side validation if provided
    if (validate) {
      const clientErrors = validate(values);
      if (Object.keys(clientErrors).length > 0) {
        setFieldErrors(clientErrors);
        return false;
      }
    }

    setIsSubmitting(true);

    try {
      await onSubmit(values);
      setIsSubmitting(false);
      return true;
    } catch (err: any) {
      setIsSubmitting(false);

      if (err instanceof ApiClientError && err.statusCode === 422) {
        // Map 422 validation errors to specific fields
        const mappedErrors: Partial<Record<keyof T, string>> = {};
        if (err.errors) {
          Object.entries(err.errors).forEach(([field, messages]) => {
            if (Array.isArray(messages) && messages.length > 0) {
              mappedErrors[field as keyof T] = messages[0];
            } else if (typeof messages === 'string') {
              mappedErrors[field as keyof T] = messages;
            }
          });
        }
        setFieldErrors(mappedErrors);
        setGeneralError(err.message || 'Data formulir tidak valid. Periksa kembali isian Anda.');
        return false;
      }

      // Other errors
      setGeneralError(err.message || 'Terjadi kesalahan sistem saat memproses formulir.');
      return false;
    }
  }, [values, validate, onSubmit]);

  return {
    values,
    fieldErrors,
    generalError,
    isSubmitting,
    setFieldValue,
    handleChange,
    handleSubmit,
    setFieldErrors,
    clearFieldError,
    setGeneralError,
    resetForm,
  };
}
