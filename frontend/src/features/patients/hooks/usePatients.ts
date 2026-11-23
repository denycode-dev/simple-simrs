import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Patient, PatientFilter } from '../types';
import { getPatientsApi } from '../api/patients-api';

export function usePatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<PatientFilter>({
    search: '',
    status: 'all',
  });

  const loadData = useCallback((showLoadingState: boolean = true) => {
    if (showLoadingState) {
      setIsLoading(true);
    }
    setError(null);

    getPatientsApi()
      .then((data) => {
        setPatients(data);
        setIsLoading(false);
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : 'Gagal memuat data pasien';
        setError(message);
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    let isMounted = true;

    getPatientsApi()
      .then((data) => {
        if (isMounted) {
          setPatients(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          const message = err instanceof Error ? err.message : 'Gagal memuat data pasien';
          setError(message);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Derived filtered state (rerender-derived-state-no-effect: compute during render)
  const filteredPatients = useMemo(() => {
    return patients.filter((patient) => {
      const query = filter.search.toLowerCase().trim();
      const matchesSearch =
        !query ||
        patient.name.toLowerCase().includes(query) ||
        patient.medicalRecordNumber.toLowerCase().includes(query) ||
        patient.diagnosis.toLowerCase().includes(query);

      const matchesStatus =
        filter.status === 'all' || patient.status === filter.status;

      return matchesSearch && matchesStatus;
    });
  }, [patients, filter.search, filter.status]);

  const updateSearch = useCallback((search: string) => {
    setFilter((prev) => ({ ...prev, search }));
  }, []);

  const updateStatus = useCallback((status: string) => {
    setFilter((prev) => ({ ...prev, status }));
  }, []);

  const refresh = useCallback(() => {
    loadData(true);
  }, [loadData]);

  return {
    patients: filteredPatients,
    totalCount: patients.length,
    filteredCount: filteredPatients.length,
    isLoading,
    error,
    filter,
    updateSearch,
    updateStatus,
    refresh,
  };
}
