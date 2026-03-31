import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

interface Profile {
    id: string;
    rol: 'INSPECTOR' | 'JEFE' | 'ADMIN';
    nombre: string;
    apellido: string;
    cedula: string;
    estado?: string | null;
    telefono?: string | null;
    is_active?: boolean;
}

interface AuthContextType {
    user: User | null;
    profile: Profile | null;
    session: Session | null;
    loading: boolean;
    signOut: () => Promise<void>;
    fetchProfile: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    session: null,
    loading: true,
    signOut: async () => { },
    fetchProfile: async () => { },
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    async function fetchProfile(userId: string) {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, rol, nombre, apellido, cedula, estado, telefono, is_active')
            .eq('id', userId)
            .single();

        if (!error && data) {
            if (data.is_active === false) {
                // Usuario suspendido administrativamente
                await supabase.auth.signOut();
                setProfile(null);
                setUser(null);
                setSession(null);
                alert("Tu cuenta ha sido suspendida. Contacta al administrador.");
                return;
            }
            setProfile(data as Profile);
        } else {
            setProfile(null);
        }
    }

    useEffect(() => {
        // Obtener sesión inicial
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id).finally(() => setLoading(false));
            } else {
                setLoading(false);
            }
        });

        // Escuchar cambios de auth
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setProfile(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        setSession(null);
    };

    return (
        <AuthContext.Provider value={{ user, profile, session, loading, signOut, fetchProfile }}>
            {children}
        </AuthContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    return useContext(AuthContext);
}
