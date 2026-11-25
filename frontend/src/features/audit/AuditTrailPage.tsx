import React, { useState, useEffect, useCallback } from 'react';
import { VStack, HStack } from '@astryxdesign/core/Stack';
import { Heading } from '@astryxdesign/core/Heading';
import { Badge } from '@astryxdesign/core/Badge';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { apiClient } from '@/lib/api-client';
import { AuditTrailTable, type AuditLogItem } from './components/AuditTrailTable';

export const AuditTrailPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [moduleFilter, setModuleFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const queryLogs = useCallback(async () => {
    const res = await apiClient<{ success: boolean; data: AuditLogItem[] }>(
      '/audit-logs',
      {
        params: {
          action: actionFilter !== 'ALL' ? actionFilter : undefined,
          module: moduleFilter !== 'ALL' ? moduleFilter : undefined,
        },
      }
    );
    return res && res.success && Array.isArray(res.data) ? res.data : [];
  }, [actionFilter, moduleFilter]);

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await queryLogs();
      setLogs(data);
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Gagal memuat catatan jejak audit (Audit Trail).'
      );
    } finally {
      setIsLoading(false);
    }
  }, [queryLogs]);

  useEffect(() => {
    let cancelled = false;
    queryLogs()
      .then((data) => {
        if (!cancelled) {
          setLogs(data);
          setErrorMessage(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setErrorMessage(
            err instanceof Error
              ? err.message
              : 'Gagal memuat catatan jejak audit (Audit Trail).'
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [queryLogs]);

  return (
    <VStack gap={4}>
      <HStack justify="between" align="center" wrap="wrap" gap={3}>
        <HStack gap={2} align="center" wrap="wrap">
          <Heading level={1}>Log Jejak Audit</Heading>
          <Badge variant="teal" label={logs.length} />
        </HStack>

        <Button
          variant="secondary"
          size="sm"
          label="Segarkan"
          isLoading={isLoading}
          onClick={loadLogs}
        />
      </HStack>

      {errorMessage ? (
        <Banner
          status="error"
          title="Gagal Memuat Jejak Audit"
          description={errorMessage}
          collapsible={false}
          endContent={
            <Button
              variant="secondary"
              size="sm"
              label="Coba Lagi"
              onClick={loadLogs}
            />
          }
        />
      ) : null}

      <AuditTrailTable
        logs={logs}
        isLoading={isLoading}
        actionFilter={actionFilter}
        onActionFilterChange={(val) => {
          setIsLoading(true);
          setActionFilter(val);
        }}
        moduleFilter={moduleFilter}
        onModuleFilterChange={(val) => {
          setIsLoading(true);
          setModuleFilter(val);
        }}
        onRefresh={loadLogs}
      />
    </VStack>
  );
};
