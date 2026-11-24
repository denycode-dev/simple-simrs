import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../lib/api-client';
import { AuditTrailTable } from './components/AuditTrailTable';
import type { AuditLogItem } from './components/AuditTrailTable';
import { Button } from '../../components/ui';

export const AuditTrailPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await apiClient<{ success: boolean; data: AuditLogItem[] }>('/audit-logs');
      if (res && res.success && Array.isArray(res.data)) {
        setLogs(res.data);
      } else {
        setLogs([]);
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || err.message || 'Gagal memuat catatan jejak audit (Audit Trail).'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main tracking-tight">
            Log Jejak Audit & Kepatuhan UU PDP
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Pencatatan riwayat transaksi sensitif, pembukaan masking data pribadi, dan mutasi rekam medis secara permanen
          </p>
        </div>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center justify-between"
        >
          <span>{errorMessage}</span>
          <Button variant="outline" size="sm" onClick={fetchLogs}>
            Coba Lagi
          </Button>
        </div>
      )}

      <AuditTrailTable
        logs={logs}
        isLoading={isLoading}
        onRefresh={fetchLogs}
      />
    </div>
  );
};
