import React, { useState } from 'react';
import { Card } from '@astryxdesign/core/Card';
import { Button } from '@astryxdesign/core/Button';
import { Badge } from '@astryxdesign/core/Badge';
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHeaderCell } from '@astryxdesign/core/Table';
import { TextInput } from '@astryxdesign/core/TextInput';
import { Selector } from '@astryxdesign/core/Selector';
import { Spinner } from '@astryxdesign/core/Spinner';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import { HStack } from '@astryxdesign/core/HStack';
import { VStack } from '@astryxdesign/core/VStack';

export interface AuditLogItem {
  id: number;
  user_id: number;
  action: string;
  module: string;
  record_id: number;
  old_values: any;
  new_values: any;
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
}

export const AuditTrailTable: React.FC<AuditTrailTableProps> = ({
  logs,
  isLoading,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [selectedLogForDetail, setSelectedLogForDetail] = useState<AuditLogItem | null>(null);

  const filteredLogs = logs.filter((log) => {
    const username = log.user?.username || '';
    const name = log.user?.name || '';
    const ip = log.ip_address || '';
    const record = String(log.record_id);

    const matchesSearch =
      username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ip.includes(searchTerm) ||
      record.includes(searchTerm);

    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;
    const matchesModule = moduleFilter === 'ALL' || log.module === moduleFilter;

    return matchesSearch && matchesAction && matchesModule;
  });

  const getActionBadge = (action: string) => {
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
  };

  return (
    <Card elevation="low" padding={4}>
      <VStack gap={4}>
        <HStack justify="between" align="center" className="border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Catatan Jejak Audit Sistem (Audit Trail)
            </h2>
            <p className="text-sm text-slate-500">
              Log aktivitas tidak dapat diubah (immutable log) untuk kepatuhan UU PDP dan tata kelola keamanan SIMRS
            </p>
          </div>

          {onRefresh && (
            <Button
              variant="secondary"
              size="sm"
              label="Segarkan Log"
              onClick={onRefresh}
              isDisabled={isLoading}
            />
          )}
        </HStack>

        {/* Controls Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <TextInput
              label="Pencarian Log"
              isLabelHidden
              placeholder="Cari user, nama staf, IP address, atau ID record..."
              value={searchTerm}
              onChange={(val) => setSearchTerm(val)}
              width="100%"
            />
          </div>
          <div>
            <Selector
              label="Filter Aksi"
              isLabelHidden
              value={actionFilter}
              onChange={(val) => setActionFilter(val)}
              options={[
                { value: 'ALL', label: 'Semua Aksi' },
                { value: 'UNMASK_DATA', label: 'UNMASK_DATA' },
                { value: 'PAYMENT', label: 'PAYMENT' },
                { value: 'DISPENSE', label: 'DISPENSE' },
                { value: 'CREATE', label: 'CREATE' },
                { value: 'UPDATE', label: 'UPDATE' },
                { value: 'DELETE', label: 'DELETE' },
                { value: 'LOGIN', label: 'LOGIN' },
              ]}
              width="100%"
            />
          </div>
          <div>
            <Selector
              label="Filter Modul"
              isLabelHidden
              value={moduleFilter}
              onChange={(val) => setModuleFilter(val)}
              options={[
                { value: 'ALL', label: 'Semua Modul' },
                { value: 'PATIENT', label: 'PATIENT' },
                { value: 'REGISTRATION', label: 'REGISTRATION' },
                { value: 'EXAMINATION', label: 'EXAMINATION' },
                { value: 'PHARMACY', label: 'PHARMACY' },
                { value: 'LABORATORY', label: 'LABORATORY' },
                { value: 'BILLING', label: 'BILLING' },
                { value: 'AUTH', label: 'AUTH' },
              ]}
              width="100%"
            />
          </div>
        </div>

        {/* Content Table */}
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <Spinner size="md" />
            <p className="text-sm text-slate-500">Memuat catatan jejak audit...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <EmptyState
            title="Tidak Ada Catatan Audit"
            description="Tidak ditemukan riwayat jejak audit dengan filter pencarian saat ini."
          />
        ) : (
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <Table density="balanced" dividers="rows" hasHover>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>Waktu (WIB)</TableHeaderCell>
                  <TableHeaderCell>Pengguna & Peran</TableHeaderCell>
                  <TableHeaderCell>Modul</TableHeaderCell>
                  <TableHeaderCell>Aktivitas</TableHeaderCell>
                  <TableHeaderCell>IP Address</TableHeaderCell>
                  <TableHeaderCell style={{ textAlign: 'center' }}>Perubahan Data</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <span className="font-mono text-xs text-slate-500 whitespace-nowrap">
                        {log.created_at}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-slate-900 text-xs">
                        {log.user?.name || log.user?.username || `User #${log.user_id}`}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {log.user?.role || 'Staff'} ({log.user?.username || 'user'})
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral" label={log.module} />
                    </TableCell>
                    <TableCell>
                      <HStack gap={1.5} align="center">
                        {getActionBadge(log.action)}
                        {log.record_id ? (
                          <span className="font-mono text-[11px] text-slate-500">
                            ID: #{log.record_id}
                          </span>
                        ) : null}
                      </HStack>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs text-slate-600 whitespace-nowrap">
                        {log.ip_address || '-'}
                      </span>
                    </TableCell>
                    <TableCell style={{ textAlign: 'center' }}>
                      {(log.old_values || log.new_values) ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          label="Lihat Detail"
                          onClick={() => setSelectedLogForDetail(log)}
                        />
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </VStack>

      {/* Detail Dialog */}
      {selectedLogForDetail && (
        <Dialog
          isOpen={true}
          onOpenChange={(open) => {
            if (!open) setSelectedLogForDetail(null);
          }}
          width={640}
          purpose="info"
          role="dialog"
          aria-modal="true"
        >
          <div className="p-6 bg-white rounded-xl shadow-2xl flex flex-col max-h-[85vh]">
            <DialogHeader
              title={`Detail Jejak Audit #${selectedLogForDetail.id}`}
              subtitle={`Modul: ${selectedLogForDetail.module} • Aksi: ${selectedLogForDetail.action}`}
              onOpenChange={() => setSelectedLogForDetail(null)}
            />
            <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs">
              <div>
                <p className="font-semibold text-slate-600 mb-1 uppercase tracking-wider">
                  Nilai Sebelum (Old Values):
                </p>
                <pre className="p-3 bg-slate-50 border border-slate-200 rounded-lg overflow-x-auto font-mono text-slate-800">
                  {selectedLogForDetail.old_values
                    ? JSON.stringify(selectedLogForDetail.old_values, null, 2)
                    : 'null (Data Baru / Tidak Ada)'}
                </pre>
              </div>
              <div>
                <p className="font-semibold text-slate-600 mb-1 uppercase tracking-wider">
                  Nilai Sesudah (New Values):
                </p>
                <pre className="p-3 bg-slate-50 border border-slate-200 rounded-lg overflow-x-auto font-mono text-slate-800">
                  {selectedLogForDetail.new_values
                    ? JSON.stringify(selectedLogForDetail.new_values, null, 2)
                    : 'null'}
                </pre>
              </div>
            </div>
            <HStack justify="end" className="pt-3 border-t border-slate-200">
              <Button
                variant="secondary"
                size="sm"
                label="Tutup"
                onClick={() => setSelectedLogForDetail(null)}
              />
            </HStack>
          </div>
        </Dialog>
      )}
    </Card>
  );
};
