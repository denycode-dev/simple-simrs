import React, { useState, useMemo } from 'react';
import { Card } from '@astryxdesign/core/Card';
import { Section } from '@astryxdesign/core/Section';
import { Button } from '@astryxdesign/core/Button';
import { Badge } from '@astryxdesign/core/Badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHeaderCell,
} from '@astryxdesign/core/Table';
import { TextInput } from '@astryxdesign/core/TextInput';
import { Selector } from '@astryxdesign/core/Selector';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import { Layout, LayoutContent, LayoutFooter } from '@astryxdesign/core/Layout';
import { CodeBlock } from '@astryxdesign/core/CodeBlock';
import { MetadataList, MetadataListItem } from '@astryxdesign/core/MetadataList';
import { HStack, VStack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { Code } from '@astryxdesign/core/Code';
import { Icon } from '@astryxdesign/core/Icon';

export interface AuditLogItem {
  id: number;
  user_id: number;
  action: string;
  module: string;
  record_id: number;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string;
  user_agent: string;
  created_at: string;
  user?: {
    id: number;
    username: string;
    name: string;
    role: string;
  };
}

export interface AuditTrailTableProps {
  logs: AuditLogItem[];
  isLoading: boolean;
  onRefresh?: () => void;
  actionFilter?: string;
  onActionFilterChange?: (action: string) => void;
  moduleFilter?: string;
  onModuleFilterChange?: (module: string) => void;
}

const ACTION_OPTIONS = [
  { value: 'ALL', label: 'Semua Aksi' },
  { value: 'UNMASK_DATA', label: 'UNMASK_DATA' },
  { value: 'PAYMENT', label: 'PAYMENT' },
  { value: 'DISPENSE', label: 'DISPENSE' },
  { value: 'CREATE', label: 'CREATE' },
  { value: 'UPDATE', label: 'UPDATE' },
  { value: 'DELETE', label: 'DELETE' },
  { value: 'LOGIN', label: 'LOGIN' },
];

const MODULE_OPTIONS = [
  { value: 'ALL', label: 'Semua Modul' },
  { value: 'PATIENT', label: 'PATIENT' },
  { value: 'REGISTRATION', label: 'REGISTRATION' },
  { value: 'NURSE_ASSESSMENT', label: 'NURSE_ASSESSMENT' },
  { value: 'EXAMINATION', label: 'EXAMINATION' },
  { value: 'PHARMACY', label: 'PHARMACY' },
  { value: 'LABORATORY', label: 'LABORATORY' },
  { value: 'BILLING', label: 'BILLING' },
  { value: 'MEDICINE', label: 'MEDICINE' },
  { value: 'MEDICAL_ACTION', label: 'MEDICAL_ACTION' },
  { value: 'AUTH', label: 'AUTH' },
];

function getActionBadge(action: string) {
  switch (action) {
    case 'UNMASK_DATA':
      return <Badge variant="warning" label="UNMASK_DATA" />;
    case 'PAYMENT':
      return <Badge variant="success" label="PAYMENT" />;
    case 'DISPENSE':
      return <Badge variant="info" label="DISPENSE" />;
    case 'CREATE':
      return <Badge variant="teal" label="CREATE" />;
    case 'UPDATE':
      return <Badge variant="neutral" label="UPDATE" />;
    case 'DELETE':
      return <Badge variant="error" label="DELETE" />;
    default:
      return <Badge variant="neutral" label={action} />;
  }
}

export const AuditTrailTable: React.FC<AuditTrailTableProps> = ({
  logs,
  isLoading,
  onRefresh,
  actionFilter: controlledActionFilter,
  onActionFilterChange,
  moduleFilter: controlledModuleFilter,
  onModuleFilterChange,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [internalActionFilter, setInternalActionFilter] = useState('ALL');
  const [internalModuleFilter, setInternalModuleFilter] = useState('ALL');
  const [selectedLogForDetail, setSelectedLogForDetail] =
    useState<AuditLogItem | null>(null);

  const actionFilter =
    controlledActionFilter !== undefined ? controlledActionFilter : internalActionFilter;
  const moduleFilter =
    controlledModuleFilter !== undefined ? controlledModuleFilter : internalModuleFilter;

  const handleActionChange = (val: string) => {
    if (onActionFilterChange) {
      onActionFilterChange(val);
    } else {
      setInternalActionFilter(val);
    }
  };

  const handleModuleChange = (val: string) => {
    if (onModuleFilterChange) {
      onModuleFilterChange(val);
    } else {
      setInternalModuleFilter(val);
    }
  };

  const filteredLogs = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return logs.filter((log) => {
      const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;
      const matchesModule = moduleFilter === 'ALL' || log.module === moduleFilter;
      if (!matchesAction || !matchesModule) return false;
      if (!q) return true;

      const username = (log.user?.username || '').toLowerCase();
      const name = (log.user?.name || '').toLowerCase();
      const ip = (log.ip_address || '').toLowerCase();
      const record = String(log.record_id);
      return (
        username.includes(q) ||
        name.includes(q) ||
        ip.includes(q) ||
        record.includes(q)
      );
    });
  }, [actionFilter, logs, moduleFilter, searchTerm]);

  const hasActiveFilter =
    actionFilter !== 'ALL' || moduleFilter !== 'ALL' || searchTerm.trim().length > 0;

  return (
    <>
      <Card elevation="low" padding={0}>
        <Section variant="transparent" padding={3} dividers={['bottom']}>
          <HStack justify="between" align="center" wrap="wrap" gap={2}>
            <TextInput
              label="Pencarian Log"
              isLabelHidden
              type="search"
              size="sm"
              width={260}
              startIcon="search"
              hasClear
              placeholder="Cari staf, username, IP, atau ID record..."
              value={searchTerm}
              onChange={(val) => setSearchTerm(val)}
            />

            <HStack gap={2} align="center" wrap="wrap">
              <Selector
                label="Filter Aksi"
                isLabelHidden
                size="sm"
                width={160}
                value={actionFilter}
                onChange={handleActionChange}
                options={ACTION_OPTIONS}
              />

              <Selector
                label="Filter Modul"
                isLabelHidden
                size="sm"
                width={175}
                value={moduleFilter}
                onChange={handleModuleChange}
                options={MODULE_OPTIONS}
              />

              {onRefresh ? (
                <Button
                  variant="secondary"
                  size="sm"
                  label="Segarkan"
                  onClick={onRefresh}
                  isDisabled={isLoading}
                />
              ) : null}
            </HStack>
          </HStack>
        </Section>

        {isLoading ? (
          <VStack gap={2} padding={4}>
            <Skeleton height={36} radius={2} index={0} />
            <Skeleton height={44} radius={2} index={1} />
            <Skeleton height={44} radius={2} index={2} />
            <Skeleton height={44} radius={2} index={3} />
          </VStack>
        ) : filteredLogs.length === 0 ? (
          <Section variant="transparent" padding={6}>
            <EmptyState
              headingLevel={2}
              icon={<Icon icon="info" size="lg" color="teal" />}
              title="Tidak Ada Catatan Audit"
              description={
                hasActiveFilter
                  ? 'Tidak ditemukan log audit yang cocok dengan filter saat ini.'
                  : 'Riwayat jejak audit sistem akan tercatat di sini.'
              }
              actions={
                hasActiveFilter ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    label="Reset Filter"
                    onClick={() => {
                      setSearchTerm('');
                      handleActionChange('ALL');
                      handleModuleChange('ALL');
                    }}
                  />
                ) : undefined
              }
            />
          </Section>
        ) : (
          <Table density="balanced" dividers="rows" hasHover>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Waktu</TableHeaderCell>
                <TableHeaderCell>Pengguna</TableHeaderCell>
                <TableHeaderCell>Modul</TableHeaderCell>
                <TableHeaderCell>Aktivitas</TableHeaderCell>
                <TableHeaderCell>IP Address</TableHeaderCell>
                <TableHeaderCell style={{ textAlign: 'right' }}>Detail</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <Code color="secondary">{log.created_at}</Code>
                  </TableCell>
                  <TableCell>
                    <VStack gap={0.5}>
                      <Text weight="semibold">
                        {log.user?.name || log.user?.username || `User #${log.user_id}`}
                      </Text>
                      <Text type="supporting">
                        {log.user?.role || 'staff'} · {log.user?.username || '-'}
                      </Text>
                    </VStack>
                  </TableCell>
                  <TableCell>
                    <Badge variant="neutral" label={log.module} />
                  </TableCell>
                  <TableCell>
                    <HStack gap={1.5} align="center" wrap="wrap">
                      {getActionBadge(log.action)}
                      {log.record_id ? (
                        <Code color="secondary">#{log.record_id}</Code>
                      ) : null}
                    </HStack>
                  </TableCell>
                  <TableCell>
                    <Code color="secondary">{log.ip_address || '-'}</Code>
                  </TableCell>
                  <TableCell>
                    <HStack justify="end">
                      {log.old_values || log.new_values ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          label="Lihat Detail"
                          onClick={() => setSelectedLogForDetail(log)}
                        />
                      ) : (
                        <Text color="secondary">-</Text>
                      )}
                    </HStack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {selectedLogForDetail ? (
        <Dialog
          isOpen={true}
          onOpenChange={(open) => {
            if (!open) setSelectedLogForDetail(null);
          }}
          width={680}
          maxHeight="85dvh"
          padding={0}
          purpose="info"
        >
          <Layout
            height="fill"
            padding={5}
            defaultHasDividers
            header={
              <DialogHeader
                title={`Detail Jejak Audit #${selectedLogForDetail.id}`}
                subtitle={`${selectedLogForDetail.module} · ${selectedLogForDetail.action} · ${selectedLogForDetail.created_at}`}
                onOpenChange={() => setSelectedLogForDetail(null)}
              />
            }
            content={
              <LayoutContent isScrollable>
                <VStack gap={4}>
                  <Section variant="muted" padding={3}>
                    <MetadataList columns="multi">
                      <MetadataListItem label="Pengguna">
                        <Text weight="medium">
                          {selectedLogForDetail.user?.name ||
                            selectedLogForDetail.user?.username ||
                            `User #${selectedLogForDetail.user_id}`}
                        </Text>
                      </MetadataListItem>
                      <MetadataListItem label="Peran">
                        <Code color="secondary">
                          {selectedLogForDetail.user?.role || '-'}
                        </Code>
                      </MetadataListItem>
                      <MetadataListItem label="IP Address">
                        <Code color="secondary">
                          {selectedLogForDetail.ip_address || '-'}
                        </Code>
                      </MetadataListItem>
                      <MetadataListItem label="ID Record">
                        <Code color="secondary">
                          {selectedLogForDetail.record_id
                            ? `#${selectedLogForDetail.record_id}`
                            : '-'}
                        </Code>
                      </MetadataListItem>
                    </MetadataList>
                  </Section>

                  <CodeBlock
                    title="Nilai Sebelum (Old Values)"
                    language="json"
                    width="100%"
                    isWrapped
                    code={
                      selectedLogForDetail.old_values
                        ? JSON.stringify(selectedLogForDetail.old_values, null, 2)
                        : 'null'
                    }
                  />

                  <CodeBlock
                    title="Nilai Sesudah (New Values)"
                    language="json"
                    width="100%"
                    isWrapped
                    code={
                      selectedLogForDetail.new_values
                        ? JSON.stringify(selectedLogForDetail.new_values, null, 2)
                        : 'null'
                    }
                  />
                </VStack>
              </LayoutContent>
            }
            footer={
              <LayoutFooter>
                <HStack justify="end">
                  <Button
                    variant="secondary"
                    size="md"
                    label="Tutup"
                    onClick={() => setSelectedLogForDetail(null)}
                  />
                </HStack>
              </LayoutFooter>
            }
          />
        </Dialog>
      ) : null}
    </>
  );
};
