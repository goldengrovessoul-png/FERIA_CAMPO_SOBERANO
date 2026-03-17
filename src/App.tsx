import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/AuthContext';
import RutaProtegida from './components/auth/RutaProtegida';
import Login from './pages/Login';
import InspectorDashboard from './pages/InspectorDashboard';
import JefeDashboard from './pages/JefeDashboard';
import AdminPanel from './pages/AdminPanel';
import ReportForm from './pages/ReportForm';
import ReportView from './pages/ReportView';

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Pública */}
          <Route path="/login" element={<Login />} />

          {/* Inspector: Área Operativa Móvil */}
          <Route path="/app" element={
            <RutaProtegida rolesPermitidos={['INSPECTOR']}>
              <InspectorDashboard />
            </RutaProtegida>
          } />
          <Route path="/reporte" element={
            <RutaProtegida rolesPermitidos={['INSPECTOR']}>
              <ReportForm />
            </RutaProtegida>
          } />
          <Route path="/ver-reporte/:id" element={
            <RutaProtegida rolesPermitidos={['INSPECTOR', 'JEFE', 'ADMIN']}>
              <ReportView />
            </RutaProtegida>
          } />

          {/* Jefe: Dashboard Analítico */}
          <Route path="/dashboard" element={
            <RutaProtegida rolesPermitidos={['JEFE', 'ADMIN']}>
              <JefeDashboard />
            </RutaProtegida>
          } />

          {/* Admin: Panel de Configuración */}
          <Route path="/admin" element={
            <RutaProtegida rolesPermitidos={['ADMIN']}>
              <AdminPanel />
            </RutaProtegida>
          } />

          {/* Default */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;
