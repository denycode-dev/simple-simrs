import React, { createContext, useContext, useState, useEffect } from 'react';
import { registerGlobalErrorHandler } from '../lib/api-client';

export interface GlobalErrorInfo {
  statusCode: number;
  message: string;
  details?: any;
}

export interface GlobalErrorContextType {
  error: GlobalErrorInfo | null;
  showError: (err: GlobalErrorInfo) => void;
  clearError: () => void;
}

const GlobalErrorContext = createContext<GlobalErrorContextType | undefined>(undefined);

export const GlobalErrorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [error, setError] = useState<GlobalErrorInfo | null>(null);

  const showError = (err: GlobalErrorInfo) => {
    // 422 Unprocessable Entity is strictly handled by inline form validation
    if (err.statusCode === 422) {
      return;
    }
    setError(err);
  };

  const clearError = () => {
    setError(null);
  };

  useEffect(() => {
    // Register error handler to api-client
    const unregister = registerGlobalErrorHandler((err) => {
      showError({
        statusCode: err.statusCode,
        message: err.message,
        details: err.errors,
      });
    });
    return unregister;
  }, []);

  return (
    <GlobalErrorContext.Provider value={{ error, showError, clearError }}>
      {children}
    </GlobalErrorContext.Provider>
  );
};

export const useGlobalError = (): GlobalErrorContextType => {
  const context = useContext(GlobalErrorContext);
  if (!context) {
    throw new Error('useGlobalError must be used within a GlobalErrorProvider');
  }
  return context;
};
