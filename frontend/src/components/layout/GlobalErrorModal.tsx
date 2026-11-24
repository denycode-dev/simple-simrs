import React from 'react';
import { useGlobalError } from '../../contexts/GlobalErrorContext';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import { Banner } from '@astryxdesign/core/Banner';
import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { VStack } from '@astryxdesign/core/VStack';

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
    <Dialog
      isOpen={Boolean(error)}
      onOpenChange={(isOpen) => {
        if (!isOpen) clearError();
      }}
      width={520}
      purpose="info"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="global-error-title"
      aria-describedby="global-error-desc"
    >
      <div className="p-5 bg-white rounded-lg shadow-xl border-t-4 border-t-red-600">
        <DialogHeader
          title={
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-lg">
                !
              </div>
              <div>
                <h2 id="global-error-title" className="text-lg font-bold text-slate-900">
                  {getTitle()}
                </h2>
                <Badge
                  label={isNetwork ? 'NETWORK_ERROR' : `STATUS_${error.statusCode}`}
                  variant={is403 ? 'warning' : 'error'}
                />
              </div>
            </div>
          }
          onOpenChange={() => clearError()}
        />

        <div className="py-4">
          <VStack gap={4}>
            <p id="global-error-desc" className="text-sm text-slate-700 leading-relaxed">
              {error.message}
            </p>

            {is500 && (
              <Banner
                status="error"
                title="Kendala Server"
                description="Tim teknis SIMRS telah menerima notifikasi insiden ini. Silakan coba kembali dalam beberapa saat atau hubungi administrator sistem jika kendala berlanjut."
                container="card"
              />
            )}

            {is403 && (
              <Banner
                status="warning"
                title="Akses Dibatasi"
                description="Peran akun Anda tidak memiliki izin untuk melihat atau memodifikasi modul ini. Hubungi kepala unit atau admin RS untuk pemutakhiran hak akses (RBAC)."
                container="card"
              />
            )}
          </VStack>
        </div>

        <HStack justify="end" gap={3} className="pt-3 border-t border-slate-200">
          <Button
            variant="primary"
            label={is401 ? 'Login Ulang Sekarang' : 'Tutup'}
            onClick={handleAction}
          />
        </HStack>
      </div>
    </Dialog>
  );
};
