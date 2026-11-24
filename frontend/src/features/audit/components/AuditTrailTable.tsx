import React, { useState } from 'react';
import { Card, CardHeader, CardContent, Button, Badge } from '../../../components/ui';

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
        return <Badge variant="warning">UNMASK_DATA</Badge>;
      case 'PAYMENT':
        return <Badge variant="success">PAYMENT</Badge>;
      case 'DISPENSE':
        return <Badge variant="info">DISPENSE</Badge>;
      case 'CREATE':
        return <Badge variant="primary">CREATE</Badge>;
      case 'UPDATE':
        return <Badge variant="neutral">UPDATE</Badge>;
      case 'DELETE':
        return <Badge variant="danger">DELETE</Badge>;
      default:
        return <Badge variant="neutral">{action}</Badge>;
    }
  };

  return (
    <Card className="w-full bg-white border border-border-default shadow-sm">
      <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-default pb-4">
        <div>
          <h2 className="text-lg font-bold text-text-main">
            Catatan Jejak Audit Sistem (Audit Trail)
          </h2>
          <p className="text-sm text-text-muted">
            Log aktivitas tidak dapat diubah (immutable log) untuk kepatuhan UU PDP dan tata kelola keamanan SIMRS
          </p>
        </div>

        {onRefresh && (
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
            Segarkan Log
          </Button>
        )}
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Cari user, nama staf, IP address, atau ID record..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border-default rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="w-full sm:w-44">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border-default rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="ALL">Semua Aksi</option>
              <option value="UNMASK_DATA">UNMASK_DATA</option>
              <option value="PAYMENT">PAYMENT</option>
              <option value="DISPENSE">DISPENSE</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
              <option value="LOGIN">LOGIN</option>
            </select>
          </div>
          <div className="w-full sm:w-44">
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border-default rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="ALL">Semua Modul</option>
              <option value="PATIENT">PATIENT</option>
              <option value="REGISTRATION">REGISTRATION</option>
              <option value="EXAMINATION">EXAMINATION</option>
              <option value="PHARMACY">PHARMACY</option>
              <option value="LABORATORY">LABORATORY</option>
              <option value="BILLING">BILLING</option>
              <option value="AUTH">AUTH</option>
            </select>
          </div>
        </div>

        {/* Content Table */}
        {isLoading ? (
          <div className="py-12 text-center text-text-muted">
            <div className="animate-spin inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full mb-2"></div>
            <p className="text-sm">Memuat catatan jejak audit...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-12 text-center border-2 border-dashed border-border-default rounded-lg">
            <p className="text-sm font-medium text-text-muted">
              Tidak ada riwayat aktivitas audit yang ditemukan.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-border-default rounded-lg">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-text-muted border-b border-border-default font-semibold text-xs uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Waktu (WIB)</th>
                  <th className="py-3 px-4">Pengguna & Peran</th>
                  <th className="py-3 px-4">Modul</th>
                  <th className="py-3 px-4">Aktivitas</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4 text-center">Perubahan Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-text-muted whitespace-nowrap">
                      {log.created_at}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-text-main text-xs">
                        {log.user?.name || log.user?.username || `User #${log.user_id}`}
                      </div>
                      <div className="text-[11px] text-text-muted font-mono">
                        {log.user?.role || 'Staff'} ({log.user?.username || 'user'})
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                        {log.module}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {getActionBadge(log.action)}
                      {log.record_id ? (
                        <span className="font-mono text-[11px] text-text-muted ml-1.5">
                          ID: #{log.record_id}
                        </span>
                      ) : null}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-text-muted whitespace-nowrap">
                      {log.ip_address || '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {(log.old_values || log.new_values) ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedLogForDetail(log)}
                        >
                          Lihat Detail
                        </Button>
                      ) : (
                        <span className="text-xs text-text-muted">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      {/* JSON Payload Modal Detail */}
      {selectedLogForDetail && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
        >
          <div className="bg-white rounded-lg shadow-xl w-full max-w-xl max-h-[85vh] flex flex-col p-5">
            <div className="flex justify-between items-center border-b border-border-default pb-3">
              <h3 className="font-bold text-text-main text-base">
                Detail Jejak Audit #{selectedLogForDetail.id}
              </h3>
              <button
                onClick={() => setSelectedLogForDetail(null)}
                className="text-text-muted hover:text-text-main text-xl font-bold"
              >
                &times;
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs">
              <div>
                <p className="font-semibold text-text-muted mb-1 uppercase tracking-wider">
                  Nilai Sebelum (Old Values):
                </p>
                <pre className="p-3 bg-slate-50 border border-border-default rounded-md overflow-x-auto font-mono text-slate-800">
                  {selectedLogForDetail.old_values
                    ? JSON.stringify(selectedLogForDetail.old_values, null, 2)
                    : 'null (Data Baru / Tidak Ada)'}
                </pre>
              </div>
              <div>
                <p className="font-semibold text-text-muted mb-1 uppercase tracking-wider">
                  Nilai Sesudah (New Values):
                </p>
                <pre className="p-3 bg-slate-50 border border-border-default rounded-md overflow-x-auto font-mono text-slate-800">
                  {selectedLogForDetail.new_values
                    ? JSON.stringify(selectedLogForDetail.new_values, null, 2)
                    : 'null'}
                </pre>
              </div>
            </div>
            <div className="flex justify-end pt-3 border-t border-border-default">
              <Button variant="outline" size="sm" onClick={() => setSelectedLogForDetail(null)}>
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
