import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleRoute } from './RoleRoute';
import { DashboardLayout } from '@/components/layout';
import { LoginPage } from '@/features/auth';
import { PatientsPage } from '@/features/patients';
import {
  MasterPatientsPage,
  MasterMedicinesPage,
  MasterDoctorsPage,
} from '@/features/master';
import { RegistrationForm, QueueStatusBoard } from '@/features/registration';
import { NurseQueueList } from '@/features/nurse';
import { DoctorExaminationForm } from '@/features/examination';
import { PrescriptionQueueTable } from '@/features/pharmacy';
import { LaboratoryPage } from '@/features/laboratory';
import { BillingPage } from '@/features/billing';
import { DashboardAnalyticsPage } from '@/features/dashboard';
import { AuditTrailPage } from '@/features/audit';
import {
  NotFoundPage,
  ForbiddenPage,
  ServerErrorPage,
  RouteErrorBoundary,
} from './errors';
import { ROUTES } from './routes.config';

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <RouteErrorBoundary>
        <Routes>
          {/* Public Login Route */}
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />

          {/* Standalone Error Routes for Direct Navigation */}
          <Route path={ROUTES.FORBIDDEN} element={<ForbiddenPage />} />
          <Route path={ROUTES.SERVER_ERROR} element={<ServerErrorPage />} />
          <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />

          {/* Protected Dashboard Shell Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              {/* Default Index Redirect */}
              <Route index element={<Navigate to={ROUTES.PATIENTS} replace />} />

              {/* Patient Domain (Universal Access for all 7 hospital roles) */}
              <Route
                path={ROUTES.PATIENTS}
                element={
                  <RoleRoute
                    allowedRoles={['admin', 'registration', 'nurse', 'doctor', 'pharmacist', 'lab', 'cashier']}
                    moduleTitle="Data Pasien Rawat Jalan"
                  >
                    <PatientsPage />
                  </RoleRoute>
                }
              />

              {/* Registration Domain */}
              <Route
                path={ROUTES.REG_NEW}
                element={
                  <RoleRoute
                    allowedRoles={['admin', 'registration']}
                    moduleTitle="Pendaftaran Kunjungan"
                  >
                    <RegistrationForm />
                  </RoleRoute>
                }
              />
              <Route
                path={ROUTES.REG_BOARD}
                element={
                  <RoleRoute
                    allowedRoles={['admin', 'registration']}
                    moduleTitle="Live Board Antrean"
                  >
                    <QueueStatusBoard />
                  </RoleRoute>
                }
              />

              {/* Nurse Triage */}
              <Route
                path={ROUTES.NURSE_TRIAGE}
                element={
                  <RoleRoute
                    allowedRoles={['admin', 'nurse']}
                    moduleTitle="Skrining & Triage Nakes"
                  >
                    <NurseQueueList />
                  </RoleRoute>
                }
              />

              {/* Doctor Consultation */}
              <Route
                path={ROUTES.DOCTOR_CONSULTATION}
                element={
                  <RoleRoute
                    allowedRoles={['admin', 'doctor']}
                    moduleTitle="Konsultasi RME Dokter"
                  >
                    <DoctorExaminationForm />
                  </RoleRoute>
                }
              />

              {/* Pharmacy & Prescriptions */}
              <Route
                path={ROUTES.PHARMACY_PRESCRIPTIONS}
                element={
                  <RoleRoute
                    allowedRoles={['admin', 'pharmacist']}
                    moduleTitle="Antrean e-Resep"
                  >
                    <PrescriptionQueueTable />
                  </RoleRoute>
                }
              />

              {/* Master Medicines */}
              <Route
                path={ROUTES.MASTER_MEDICINES}
                element={
                  <RoleRoute
                    allowedRoles={['admin', 'pharmacist']}
                    moduleTitle="Master Obat & Stok"
                  >
                    <MasterMedicinesPage />
                  </RoleRoute>
                }
              />

              {/* Clinical Laboratory */}
              <Route
                path={ROUTES.LABORATORY}
                element={
                  <RoleRoute
                    allowedRoles={['admin', 'lab', 'doctor']}
                    moduleTitle="Laboratorium Klinis"
                  >
                    <LaboratoryPage />
                  </RoleRoute>
                }
              />

              {/* Cashier & Billing */}
              <Route
                path={ROUTES.BILLING}
                element={
                  <RoleRoute
                    allowedRoles={['admin', 'cashier']}
                    moduleTitle="Kasir & Pembayaran"
                  >
                    <BillingPage />
                  </RoleRoute>
                }
              />

              {/* Master Patients */}
              <Route
                path={ROUTES.MASTER_PATIENTS}
                element={
                  <RoleRoute
                    allowedRoles={['admin', 'registration']}
                    moduleTitle="Master Pasien (NIK/RM)"
                  >
                    <MasterPatientsPage />
                  </RoleRoute>
                }
              />

              {/* Master Doctors */}
              <Route
                path={ROUTES.MASTER_DOCTORS}
                element={
                  <RoleRoute
                    allowedRoles={['admin']}
                    moduleTitle="Master Dokter & Jadwal"
                  >
                    <MasterDoctorsPage />
                  </RoleRoute>
                }
              />

              {/* Audit Trail UU PDP */}
              <Route
                path={ROUTES.AUDIT_TRAIL}
                element={
                  <RoleRoute
                    allowedRoles={['admin']}
                    moduleTitle="Audit Trail UU PDP"
                  >
                    <AuditTrailPage />
                  </RoleRoute>
                }
              />

              {/* Dashboard Analytics & Reports */}
              <Route
                path={ROUTES.DASHBOARD}
                element={
                  <RoleRoute
                    allowedRoles={['admin', 'doctor', 'cashier']}
                    moduleTitle="Dashboard & Laporan"
                  >
                    <DashboardAnalyticsPage />
                  </RoleRoute>
                }
              />

              {/* In-Dashboard 404 Catch-All */}
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Route>

          {/* Root Fallback Catch-All */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </RouteErrorBoundary>
    </BrowserRouter>
  );
};
