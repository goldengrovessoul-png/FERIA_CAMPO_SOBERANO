import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { apiClient } from './api';

interface Profile {
    id: string;
    rol: 'INSPECTOR' | 'JEFE' | 'ADMIN' | 'PLANIFICADOR';
    nombre: string;
    apellido: string;
    cedula: string;
    estado?: string | null;
    telefono?: string | null;
    is_active?: boolean;
    email: string;
}

interface AuthContextType {
    user: any | null;
    profile: Profile | null;
    loading: boolean;
    login: (email: string, pin: string) => Promise<void>;
    register: (data: any) => Promise<void>;
    signOut: () => void;
    fetchProfile: (id: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    loading: true,
    login: async () => { },
    register: async () => { },
    signOut: () => { },
    fetchProfile: async () => { },
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<any | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async (id: string) => {
        try {
            const data = await apiClient.get(`/admin/profiles/${id}`);
            if (data) {
                setProfile(data);
                // Si es el usuario actual, actualizar también el estado user
                const savedUser = localStorage.getItem('fcs_user');
                if (savedUser) {
                    const userData = JSON.parse(savedUser);
                    if (userData.id === id) {
                        localStorage.setItem('fcs_user', JSON.stringify(data));
                        setUser(data);
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };

    useEffect(() => {
        const checkSession = async () => {
            const token = localStorage.getItem('fcs_token');
            const savedUser = localStorage.getItem('fcs_user');

            if (token && savedUser) {
                try {
                    const userData = JSON.parse(savedUser);
                    setUser(userData);
                    setProfile(userData); // En nuestro sistema local, el usuario es el perfil
                } catch (e) {
                    signOut();
                }
            }
            setLoading(false);
        };

        checkSession();
    }, []);

    const login = async (email: string, pin: string) => {
        const response = await apiClient.post('/auth/login', { email, password: pin });
        if (response.token) {
            localStorage.setItem('fcs_token', response.token);
            localStorage.setItem('fcs_user', JSON.stringify(response.user));
            setUser(response.user);
            setProfile(response.user);
        }
    };

    const register = async (data: any) => {
        const response = await apiClient.post('/auth/register', data);
        if (response.token) {
            localStorage.setItem('fcs_token', response.token);
            localStorage.setItem('fcs_user', JSON.stringify(response.user));
            setUser(response.user);
            setProfile(response.user);
        }
    };

    const signOut = () => {
        localStorage.removeItem('fcs_token');
        localStorage.removeItem('fcs_user');
        setUser(null);
        setProfile(null);
    };

    return (
        <AuthContext.Provider value={{ user, profile, loading, login, register, signOut, fetchProfile }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
