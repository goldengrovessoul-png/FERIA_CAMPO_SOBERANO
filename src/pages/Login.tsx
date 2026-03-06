import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, User, Lock, ArrowRight, Eye, EyeOff, AlertCircle, UserPlus, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Login() {
    const [isRegistering, setIsRegistering] = useState(false);
    const [cedula, setCedula] = useState('');
    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');
    const [pin, setPin] = useState('');
    const [showPin, setShowPin] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    const normalizarCedula = (c: string) => {
        const cNorm = c.trim().toUpperCase();
        if (['JEFE', 'ADMIN'].includes(cNorm)) return cNorm;
        return cNorm.replace(/^[VEJGvejg]-?/, ''); // Quita prefijo
    };

    const withTimeout = (promise: PromiseLike<any> | Promise<any>, ms: number = 10000) => {
        return Promise.race([
            Promise.resolve(promise),
            new Promise<'TIMEOUT'>((resolve) => setTimeout(() => resolve('TIMEOUT'), ms))
        ]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!cedula.trim() || !pin.trim()) {
            setError('Todos los campos obligatorios deben estar llenos.');
            return;
        }

        if (pin.length < 6) {
            setError('El PIN debe tener al menos 6 dígitos.');
            return;
        }

        if (isRegistering && (!nombre.trim() || !apellido.trim())) {
            setError('Para registrarte necesitas ingresar Nombre y Apellido.');
            return;
        }

        setLoading(true);

        try {
            // Se envía la orden de limpieza al fondo sin "await" para que no bloquee eternamente el proceso
            supabase.auth.signOut().catch(() => { });

            const cedulaPura = normalizarCedula(cedula);
            const emailForAuth = `${cedulaPura.toLowerCase()}@fcs.com`;

            if (isRegistering) {
                // ---------- MODO REGISTRO ----------
                let rol = 'INSPECTOR';
                if (cedulaPura === 'JEFE') rol = 'JEFE';
                if (cedulaPura === 'ADMIN') rol = 'ADMIN';

                const response = await withTimeout(supabase.auth.signUp({
                    email: emailForAuth,
                    password: pin.trim(),
                    options: {
                        data: {
                            nombre: nombre.trim(),
                            apellido: apellido.trim(),
                            cedula: cedulaPura,
                            rol: rol
                        }
                    }
                }));

                if (response === 'TIMEOUT') {
                    throw new Error('Tiempo de espera agotado conectando al registro.');
                }

                const { data, error: registerError } = response;

                if (registerError) {
                    if (registerError.message.includes('already registered')) {
                        setError('Esta cédula ya está registrada. Por favor, inicia sesión.');
                    } else {
                        setError(`Error al registrar: ${registerError.message} `);
                    }
                    setLoading(false);
                    return;
                }

                if (data.user) {
                    setSuccess('¡Registro exitoso! Iniciando tu sesión...');
                    setTimeout(() => window.location.reload(), 1500);
                }

            } else {
                // ---------- MODO LOGIN ----------
                console.log('Intentando inicio de sesión...', emailForAuth);
                const response = await withTimeout(supabase.auth.signInWithPassword({
                    email: emailForAuth,
                    password: pin.trim(),
                }));

                if (response === 'TIMEOUT') {
                    throw new Error('Tiempo de espera agotado intentando iniciar sesión. Revisa tu internet o la base de datos.');
                }

                const { data, error: authError } = response;

                if (authError) {
                    if (authError.message.includes('Invalid login credentials')) {
                        setError('Credenciales incorrectas o usuario no existe. Regístrate en la pestaña superior.');
                    } else {
                        setError(authError.message);
                    }
                    setLoading(false);
                    return;
                }

                if (!data?.user) {
                    setError('Respuesta vacía del servidor, no hubo inicio de sesión.');
                    setLoading(false);
                    return;
                }

                console.log('Sesión confirmada, cargando perfil...');
                const profileRes = await withTimeout(supabase
                    .from('profiles')
                    .select('rol, is_active')
                    .eq('id', data.user.id)
                    .single());

                if (profileRes === 'TIMEOUT') throw new Error('Tiempo de espera agotado leyendo el perfil.');

                const { data: profile, error: profileError } = profileRes;

                if (profileError || !profile) {
                    setError('Tu usuario existe pero no tiene un perfil asociado. Inténtalo de nuevo.');
                    await supabase.auth.signOut();
                    setLoading(false);
                    return;
                }

                // VALIDACIÓN CRÍTICA: Bloquear usuarios suspendidos
                if (profile.is_active === false) {
                    setError('Tu cuenta ha sido SUSPENDIDA temporal o permanentemente por un Administrador.');
                    await supabase.auth.signOut();
                    setLoading(false);
                    return;
                }

                console.log('Perfil verificado:', profile.rol);
                if (profile.rol === 'ADMIN') navigate('/admin');
                else if (profile.rol === 'JEFE') navigate('/dashboard');
                else navigate('/app');
            }

        } catch (err: any) {
            console.error('Error de autenticación capturado:', err);
            setError(err.message || 'Error grave de conexión o timeout. Verifica tu internet e intenta de nuevo.');
        } finally {
            if (!success) setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Fondo con Imagen de Pexels */}
            <div
                className="absolute inset-0 z-0"
                style={{
                    backgroundImage: 'url("https://images.pexels.com/photos/6102865/pexels-photo-6102865.jpeg")',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            >
                {/* Overlay Oscuro para Legibilidad */}
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]"></div>
            </div>

            <div className="w-full max-w-sm relative z-10">
                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl">
                        <ShieldCheck className="text-white drop-shadow-lg" size={40} />
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight leading-tight uppercase drop-shadow-md font-['Outfit']">
                        Feria Campo Soberano
                    </h1>
                    <p className="text-blue-300 text-xs font-black uppercase tracking-[0.3em] mt-2 opacity-90 drop-shadow-sm">Gestión de Reportes</p>
                </div>

                {/* Card con Glassmorphism Extremo */}
                <div className="bg-white/10 backdrop-blur-2xl rounded-[3rem] shadow-2xl p-8 sm:p-10 border border-white/20">

                    {/* Tabs / Switcher - Glass Style */}
                    <div className="flex bg-white/5 rounded-2xl p-1.5 mb-8 relative border border-white/10">
                        <div
                            className={`absolute top-1.5 bottom-1.5 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) bg-white/20 rounded-xl shadow-inner ${isRegistering ? 'left-1/2 w-[calc(50%-6px)]' : 'left-1.5 w-[calc(50%-6px)]'}`}
                        />
                        <button
                            type="button"
                            onClick={() => { setIsRegistering(false); setError(''); setSuccess(''); }}
                            className={`flex-1 relative z-10 flex items-center justify-center gap-2 py-3 text-[11px] font-black uppercase tracking-wider transition-all duration-300 ${!isRegistering ? 'text-white' : 'text-white/40 hover:text-white/60'}`}
                        >
                            <User size={14} />
                            <span>Entrar</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => { setIsRegistering(true); setError(''); setSuccess(''); }}
                            className={`flex-1 relative z-10 flex items-center justify-center gap-2 py-3 text-[11px] font-black uppercase tracking-wider transition-all duration-300 ${isRegistering ? 'text-white' : 'text-white/40 hover:text-white/60'}`}
                        >
                            <UserPlus size={14} />
                            <span>Registro</span>
                        </button>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-500/20 backdrop-blur-md border border-red-500/30 rounded-2xl flex items-start gap-3 animate-in fade-in zoom-in duration-200">
                            <AlertCircle size={18} className="text-red-300 mt-0.5 shrink-0" />
                            <p className="text-red-100 text-[11px] font-bold leading-relaxed">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="mb-6 p-4 bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 rounded-2xl flex items-start gap-3 animate-in fade-in zoom-in duration-200">
                            <ShieldCheck size={18} className="text-emerald-300 mt-0.5 shrink-0" />
                            <p className="text-emerald-100 text-[11px] font-bold leading-relaxed">{success}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] ml-1 block">
                                Cédula o PIN de Administrador
                            </label>
                            <div className="relative group">
                                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-blue-400 transition-colors">
                                    <FileText size={20} />
                                </div>
                                <input
                                    type="text"
                                    value={cedula}
                                    onChange={(e) => setCedula(e.target.value)}
                                    className="w-full pl-14 pr-4 py-4.5 bg-white/5 border border-white/10 rounded-[1.5rem] focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all text-white font-bold text-sm placeholder:text-white/20"
                                    placeholder="V-12345678 o ID"
                                    disabled={loading || !!success}
                                />
                            </div>
                        </div>

                        {isRegistering && (
                            <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] ml-1 block">Nombre</label>
                                    <input
                                        type="text"
                                        value={nombre}
                                        onChange={(e) => setNombre(e.target.value)}
                                        className="w-full px-5 py-4.5 bg-white/5 border border-white/10 rounded-[1.5rem] focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all text-white font-bold text-sm placeholder:text-white/20"
                                        placeholder="Tu nombre"
                                        disabled={loading || !!success}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] ml-1 block">Apellido</label>
                                    <input
                                        type="text"
                                        value={apellido}
                                        onChange={(e) => setApellido(e.target.value)}
                                        className="w-full px-5 py-4.5 bg-white/5 border border-white/10 rounded-[1.5rem] focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all text-white font-bold text-sm placeholder:text-white/20"
                                        placeholder="Tu apellido"
                                        disabled={loading || !!success}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] ml-1 block">
                                PIN (6 dígitos)
                            </label>
                            <div className="relative group">
                                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-blue-400 transition-colors">
                                    <Lock size={20} />
                                </div>
                                <input
                                    type={showPin ? 'text' : 'password'}
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value)}
                                    className="w-full pl-14 pr-14 py-4.5 bg-white/5 border border-white/10 rounded-[1.5rem] focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all text-white font-bold text-sm tracking-[0.4em] placeholder:text-white/20"
                                    placeholder="••••••"
                                    disabled={loading || !!success}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPin(!showPin)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60 p-2 transition-colors"
                                >
                                    {showPin ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !!success}
                            className="w-full py-5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-black rounded-[1.5rem] shadow-2xl shadow-emerald-900/40 active:scale-[0.97] transition-all flex items-center justify-center gap-3 group disabled:opacity-70 text-sm uppercase tracking-[0.15em] border-t border-white/20"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>Verificando...</span>
                                </>
                            ) : (
                                <>
                                    <ArrowRight size={20} className="group-hover:translate-x-1.5 transition-transform" />
                                    <span>Ingresar</span>
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 space-y-3">
                        <p className="text-center text-[10px] font-bold text-white/40 uppercase tracking-widest leading-loose">
                            ¿No tienes cuenta? <span className="text-emerald-400 hover:text-emerald-300 cursor-pointer transition-colors" onClick={() => setIsRegistering(true)}>Regístrate aquí</span>
                        </p>
                    </div>
                </div>

                <div className="mt-12 text-center space-y-2">
                    <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.3em]">
                        Módulo de Autenticación • CUSPAL
                    </p>
                    <p className="text-[9px] text-white/20 font-medium">
                        App Desarrollada por @GHLUCENA - 2026. <br /> Todos los derechos reservados.
                    </p>
                </div>
            </div>
        </div>
    );
}
