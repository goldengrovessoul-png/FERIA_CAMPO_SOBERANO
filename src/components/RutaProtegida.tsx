import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';

interface Props {
    children: React.ReactNode;
    rolesPermitidos: ('INSPECTOR' | 'JEFE' | 'ADMIN')[];
}

export default function RutaProtegida({ children, rolesPermitidos }: Props) {
    const { user, profile, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8]">
                <div className="text-center space-y-4">
                    <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Verificando acceso...</p>
                </div>
            </div>
        );
    }

    if (!user || !profile) {
        return <Navigate to="/login" replace />;
    }

    if (!rolesPermitidos.includes(profile.rol)) {
        // Redirigir al área correcta según su role real
        if (profile.rol === 'ADMIN') return <Navigate to="/admin" replace />;
        if (profile.rol === 'JEFE') return <Navigate to="/dashboard" replace />;
        return <Navigate to="/app" replace />;
    }

    return <>{children}</>;
}
