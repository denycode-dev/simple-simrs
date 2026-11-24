import React from 'react';
import { useGlobalError } from '../../contexts/GlobalErrorContext';
import { Card, CardHeader, CardContent, CardFooter, Button, Badge } from '../ui';

export const GlobalErrorModal: React.FC = () => {
  const { error, clearError } = useGlobalError();

  if (!error) return null;

  const is500 = error.statusCode >= 500;
  const is401 = error.statusCode === 401;
  const is403 = error.statusCode === 403;
  const isNetwork = error.statusCode === 0;

  const getTitle = () => {
    if (is500) return 'Kesalahan Sistem Server (HTTP ' + error.statusCode + ')';
    if (is401) return 'Sesi Kedaluwarsa (HTTP 401)';
    if (is403) return 'Akses Ditolak (HTTP 403)';
    if (isNetwork) return 'Koneksi Jaringan Terputus';
    return `Terjadi Kesalahan (HTTP ${error.statusCode})`;
  };

  const handleAction = () => {
    if (is401) {
      localStorage.removeItem('simrs_token');
      localStorage.removeItem('simrs_user');
      window.location.reload();
    } else {
      clearError();
    }
  };

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="global-error-title"
      aria-describedby="global-error-desc"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in"
    >
      <Card className="w-full max-w-lg bg-white shadow-2xl border-t-4 border-t-red-600">
        <CardHeader className="flex items-start justify-between border-b border-border-default pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-lg">
              !
            </div>
            <div>
              <h2 id="global-error-title" className="text-lg font-bold text-slate-900">
                {getTitle()}
              </h2>
              <Badge variant={is403 ? 'warning' : 'danger'}>
                {isNetwork ? 'NETWORK_ERROR' : `STATUS_${error.statusCode}`}
              </Badge>
            </div>
          </div>
          <button
            onClick={clearError}
            aria-label="Tutup jendela error"
            className="text-slate-400 hover:text-slate-700 text-2xl font-bold leading-none p-1 rounded focus:outline-none"
          >
            &times;
          </button>
        </CardHeader>

        <CardContent className="p-5 space-y-3">
          <p id="global-error-desc" className="text-sm text-slate-700 leading-relaxed">
            {error.message}
          </p>

          {is500 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-800">
              Tim teknis SIMRS telah menerima notifikasi insiden ini. Silakan coba kembali dalam beberapa saat atau hubungi administrator sistem jika kendala berlanjut.
            </div>
          )}

          {is403 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
              Peran akun Anda tidak memiliki izin untuk melihat atau memodifikasi modul ini. Hubungi kepala unit atau admin RS untuk pemutakhiran hak akses (RBAC).
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-end gap-3 border-t border-border-default pt-3 p-4">
          <Button variant="primary" onClick={handleAction}>
            {is401 ? 'Login Ulang Sekarang' : 'Tutup'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
