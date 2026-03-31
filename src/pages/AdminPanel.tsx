import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Settings, Shield, UserPlus, FileText, ArrowLeft,
    ChevronRight, LogOut, Search,
    MoreVertical, ShieldAlert, ShieldCheck,
    CreditCard as IdCard, RefreshCw, Plus, Trash2, Tag, Map as MapIcon,
    Box, Briefcase, Ruler, ChevronDown, SlidersHorizontal,
    Pencil, MessageCircle, DollarSign
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import ChatBox from '../components/chat/ChatBox';
import { ChatService } from '../services/ChatService';

interface Profile {
    id: string;
    rol: 'INSPECTOR' | 'JEFE' | 'ADMIN';
    nombre: string;
    apellido: string;
    cedula: string;
    estado: string | null;
    telefono: string | null;
    fecha_creacion: string;
    is_active?: boolean;
}

interface CatalogItem {
    id: string;
    type: 'RUBRO' | 'ENTE' | 'ESTADO' | 'ACTIVIDAD' | 'MEDIDA' | 'ARTICULO' | 'MINPPAL';
    name: string;
    is_active: boolean;
    created_at: string;
    parent_id?: string;
    empresa_id?: string;
    precio_referencia?: number;
    precio_privado?: number;
    presentacion?: string;
    parent?: { name: string };
    empresa?: { name: string };
}

interface VulnerabilityData {
    id: string;
    estado: string;
    municipio: string;
    parroquia: string;
    nivel_prioridad: number;
    descripcion_problema: string;
    latitud: number;
    longitud: number;
    fecha_registro: string;
}

export default function AdminPanel() {
    const navigate = useNavigate();
    const { profile: currentUser, fetchProfile } = useAuth();
    const [view, setView] = useState<'overview' | 'users' | 'catalog' | 'vulnerability'>('overview');
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRol, setFilterRol] = useState<'ALL' | 'INSPECTOR' | 'JEFE' | 'ADMIN' | 'SUSPENDIDO'>('ALL');
    const [showRoleMenu, setShowRoleMenu] = useState<string | null>(null);
    const [showActionMenu, setShowActionMenu] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [selectedUserForChat, setSelectedUserForChat] = useState<{ id: string, name: string } | null>(null);
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

    // Estados para Edición de Usuario
    const [editingUser, setEditingUser] = useState<Profile | null>(null);
    const [editForm, setEditForm] = useState({
        nombre: '',
        apellido: '',
        cedula: '',
        telefono: '',
        estado: '',
        newPassword: ''
    });
    const [saving, setSaving] = useState(false);

    // Estados para Catálogos
    const [catalogType, setCatalogType] = useState<'RUBRO' | 'ENTE' | 'ESTADO' | 'ACTIVIDAD' | 'MEDIDA' | 'ARTICULO' | 'MINPPAL' | 'EMPRENDIMIENTO'>('RUBRO');
    const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
    const [rubrosForSelect, setRubrosForSelect] = useState<{ id: string, name: string }[]>([]);
    const [minppalForSelect, setMinppalForSelect] = useState<{ id: string, name: string }[]>([]);
    const [loadingCatalog, setLoadingCatalog] = useState(false);
    const [newCatalogName, setNewCatalogName] = useState('');
    const [selectedParentId, setSelectedParentId] = useState('');
    const [selectedMinppalId, setSelectedMinppalId] = useState('');
    const [newCatalogPrice, setNewCatalogPrice] = useState('0');
    const [newCatalogPricePrivado, setNewCatalogPricePrivado] = useState('0');
    const [newCatalogPresentation, setNewCatalogPresentation] = useState('');
    const [editingCatalogId, setEditingCatalogId] = useState<string | null>(null);

    // Estados para Vulnerabilidad
    const [vulnerabilities, setVulnerabilities] = useState<VulnerabilityData[]>([]);
    const [loadingVulnerability, setLoadingVulnerability] = useState(false);
    const [newVulnerability, setNewVulnerability] = useState({
        estado: '',
        municipio: '',
        parroquia: '',
        nivel_prioridad: 3,
        descripcion_problema: '',
        latitud: '',
        longitud: ''
    });
    const [editingVulnerabilityId, setEditingVulnerabilityId] = useState<string | null>(null);

    // Estados para Emprendimiento (Admin)
    const [entrepreneurTypes, setEntrepreneurTypes] = useState<{ id: string, nombre: string }[]>([]);
    const [loadingEntrep, setLoadingEntrep] = useState(false);
    const [newEntrepName, setNewEntrepName] = useState('');

    // Estados para Campos Personalizados de Emprendimiento
    const [customFields, setCustomFields] = useState<{ id: string, nombre: string, etiqueta: string, tipo: string, requerido: boolean, orden: number }[]>([]);
    const [loadingFields, setLoadingFields] = useState(false);
    const [newField, setNewField] = useState({ etiqueta: '', tipo: 'texto', requerido: false });
    const [showFieldForm, setShowFieldForm] = useState(false);

    useEffect(() => {
        if (view === 'users') {
            fetchProfiles();
            fetchUnreadCounts();
        } else if (view === 'catalog') {
            fetchCatalogItems();
            fetchEntrepreneurTypes();
            if (catalogType === 'EMPRENDIMIENTO') fetchCustomFields();
        } else if (view === 'vulnerability') {
            fetchVulnerabilities();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [view, catalogType]);

    // Suscripción a notificaciones de nuevos mensajes
    useEffect(() => {
        if (!currentUser?.id) return;

        const channel = ChatService.subscribeToMessages(currentUser.id, (msg) => {
            // Incrementar conteo si el chat no está abierto con ese usuario
            if (selectedUserForChat?.id !== msg.sender_id) {
                setUnreadCounts(prev => ({
                    ...prev,
                    [msg.sender_id]: (prev[msg.sender_id] || 0) + 1
                }));

                // Opcional: Sonido de notificación
                new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3').play().catch(() => { });
            }
        });

        return () => {
            channel.unsubscribe();
        };
    }, [currentUser?.id, selectedUserForChat?.id]);

    async function fetchUnreadCounts() {
        if (!currentUser?.id) return;
        try {
            const counts = await ChatService.getUnreadCounts(currentUser.id);
            setUnreadCounts(counts);
        } catch (err) {
            console.error('Error al cargar conteos:', err);
        }
    }

    async function fetchProfiles() {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('fecha_creacion', { ascending: false });

            if (error) throw error;
            setProfiles(data || []);
        } catch (error) {
            console.error('Error fetching profiles:', error);
            alert('Error al cargar la lista de usuarios');
        } finally {
            setLoading(false);
        }
    }

    async function changeUserRole(userId: string, newRole: Profile['rol']) {
        if (!window.confirm(`¿Estás seguro de cambiar el rol a ${newRole}?`)) return;

        try {
            const { data, error } = await supabase
                .from('profiles')
                .update({ rol: newRole })
                .eq('id', userId)
                .select('id');

            if (error) throw error;
            if (!data || data.length === 0) {
                alert('La asignación de rol falló (Posiblemente no tienes permisos de administrador para alterar roles).');
                return;
            }

            fetchProfiles();
            setShowRoleMenu(null);
        } catch (error) {
            console.error('Error updating role:', error);
            alert('No se pudo actualizar el rol');
        }
    }

    async function toggleUserStatus(userId: string, currentStatus: boolean) {
        if (!window.confirm(`¿Estás seguro de ${currentStatus ? 'SUSPENDER' : 'ACTIVAR'} a este usuario?`)) return;

        try {
            const { data, error } = await supabase
                .from('profiles')
                .update({ is_active: !currentStatus })
                .eq('id', userId)
                .select('id');

            if (error) throw error;
            if (!data || data.length === 0) {
                alert('La actualización falló silenciosamente (Posiblemente no tienes nivel de administrador/jefe en Base de Datos).');
                return;
            }

            fetchProfiles();
            setShowActionMenu(null);
        } catch (e) {
            console.error(e);
            alert('Error al cambiar estado del usuario. Asegúrate de que la columna is_active exista en la tabla profiles.');
        }
    }

    const openEditModal = (user: Profile) => {
        setEditingUser(user);
        setEditForm({
            nombre: user.nombre,
            apellido: user.apellido,
            cedula: user.cedula,
            telefono: user.telefono || '',
            estado: user.estado || '',
            newPassword: ''
        });
        setShowActionMenu(null);
    };

    async function handleUpdateUser() {
        if (!editingUser) return;
        setSaving(true);
        try {
            // 1. Actualizar Perfil
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    nombre: editForm.nombre,
                    apellido: editForm.apellido,
                    cedula: editForm.cedula,
                    telefono: editForm.telefono,
                    estado: editForm.estado
                })
                .eq('id', editingUser.id);

            if (profileError) throw profileError;

            // 2. Nota sobre contraseña
            if (editForm.newPassword) {
                alert("Perfil actualizado. Nota: Para cambiar la contraseña de otro usuario se requiere configuración de Service Role. Los cambios de datos personales se guardaron con éxito.");
            }

            // Si el usuario editado es el mismo que está logueado, refrescar perfil global
            if (editingUser.id === currentUser?.id) {
                await fetchProfile(editingUser.id);
            }

            fetchProfiles();
            setEditingUser(null);
        } catch (error) {
            console.error(error);
            alert("Error al actualizar datos.");
        } finally {
            setSaving(false);
        }
    }

    // --- FUNCIONES DE CATÁLOGO ---
    async function fetchCatalogItems() {
        try {
            setLoadingCatalog(true);
            const query = supabase
                .from('catalog_items')
                .select('*, parent:parent_id(name), empresa:empresa_id(name)')
                .eq('type', catalogType)
                .order('name', { ascending: true });

            const { data, error } = await query;

            if (error) throw error;
            setCatalogItems(data || []);

            // Si estamos en la vista de artículos, cargar también los rubros para el selector
            if (catalogType === 'ARTICULO') {
                const { data: rubros } = await supabase
                    .from('catalog_items')
                    .select('id, name')
                    .eq('type', 'RUBRO')
                    .eq('is_active', true)
                    .order('name', { ascending: true });
                setRubrosForSelect(rubros || []);

                // También cargar las empresas MINPPAL y ENTES para vincular artículos
                const { data: minppal } = await supabase
                    .from('catalog_items')
                    .select('id, name')
                    .in('type', ['MINPPAL', 'ENTE'])
                    .eq('is_active', true)
                    .order('name', { ascending: true });
                setMinppalForSelect(minppal || []);
            }
        } catch (error) {
            console.error('Error fetching catalogs:', error);
        } finally {
            setLoadingCatalog(false);
        }
    }

    async function addCatalogItem() {
        if (!newCatalogName.trim()) return;
        try {
            const itemData: Record<string, string | number | null> = {
                type: catalogType,
                name: newCatalogName.trim().toUpperCase()
            };

            if (catalogType === 'ARTICULO' || catalogType === 'RUBRO') {
                itemData.parent_id = selectedParentId || null;
                itemData.empresa_id = selectedMinppalId || null;
                itemData.precio_referencia = Number(newCatalogPrice) || 0;
                itemData.precio_privado = Number(newCatalogPricePrivado) || 0;
                itemData.presentacion = newCatalogPresentation.trim();
            }

            if (editingCatalogId) {
                // Modo Edición
                const { error } = await supabase
                    .from('catalog_items')
                    .update(itemData)
                    .eq('id', editingCatalogId);
                if (error) throw error;
                alert('Elemento actualizado correctamente.');
            } else {
                // Modo Creación
                const { error } = await supabase
                    .from('catalog_items')
                    .insert([itemData]);
                if (error) throw error;
            }

            setNewCatalogName('');
            setSelectedParentId('');
            setSelectedMinppalId('');
            setNewCatalogPrice('0');
            setNewCatalogPricePrivado('0');
            setNewCatalogPresentation('');
            setEditingCatalogId(null);
            fetchCatalogItems();
        } catch (error: unknown) {
            if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
                alert('Este elemento ya existe en el catálogo.');
            } else {
                alert('Error al procesar la operación.');
            }
        }
    }

    function handleEditCatalogItem(item: CatalogItem) {
        setEditingCatalogId(item.id);
        setNewCatalogName(item.name);
        if (catalogType === 'ARTICULO' || catalogType === 'RUBRO') {
            setSelectedParentId(item.parent_id || '');
            setSelectedMinppalId(item.empresa_id || '');
            setNewCatalogPrice(item.precio_referencia?.toString() || '0');
            setNewCatalogPricePrivado(item.precio_privado?.toString() || '0');
            setNewCatalogPresentation(item.presentacion || '');
        }
        window.scrollTo({ top: 400, behavior: 'smooth' });
    }

    async function toggleCatalogStatus(id: string, currentStatus: boolean) {
        try {
            const { error } = await supabase
                .from('catalog_items')
                .update({ is_active: !currentStatus })
                .eq('id', id);

            if (error) throw error;
            fetchCatalogItems();
        } catch (e) {
            console.error(e);
            alert('Error al actualizar estado.');
        }
    }

    async function deleteCatalogItem(id: string) {
        if (!window.confirm('¿Estás seguro de eliminar este elemento?')) return;
        try {
            const { error } = await supabase
                .from('catalog_items')
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchCatalogItems();
        } catch (e) {
            console.error(e);
            alert('Error al eliminar elemento. Es posible que esté siendo usado en reportes.');
        }
    }

    // --- FUNCIONES DE EMPRENDIMIENTO (ADMIN) ---
    async function fetchEntrepreneurTypes() {
        try {
            setLoadingEntrep(true);
            const { data, error } = await supabase
                .from('cat_emprendimiento_tipos')
                .select('*')
                .order('nombre', { ascending: true });
            if (error) throw error;
            setEntrepreneurTypes(data || []);
        } catch (err) {
            console.error('Error fetching entrepreneur types:', err);
        } finally {
            setLoadingEntrep(false);
        }
    }

    async function addEntrepreneurType() {
        if (!newEntrepName.trim()) return;
        try {
            const { error } = await supabase
                .from('cat_emprendimiento_tipos')
                .insert([{ nombre: newEntrepName.trim().toUpperCase() }]);
            if (error) throw error;
            setNewEntrepName('');
            fetchEntrepreneurTypes();
        } catch (err: unknown) {
            alert(err && typeof err === 'object' && 'code' in err && err.code === '23505' ? 'Este tipo ya existe.' : 'Error al guardar.');
        }
    }

    async function deleteEntrepreneurType(id: string) {
        if (!window.confirm('¿Eliminar este tipo de actividad?')) return;
        try {
            const { error } = await supabase
                .from('cat_emprendimiento_tipos')
                .delete()
                .eq('id', id);
            if (error) throw error;
            fetchEntrepreneurTypes();
        } catch (e) {
            console.error(e);
            alert('No se puede eliminar porque está en uso en reportes.');
        }
    }

    // --- FUNCIONES DE CAMPOS PERSONALIZADOS ---
    async function fetchCustomFields() {
        try {
            setLoadingFields(true);
            const { data, error } = await supabase
                .from('cat_emprendimiento_campos')
                .select('*')
                .order('orden', { ascending: true });
            if (error) throw error;
            setCustomFields((data || []).filter((f: Record<string, unknown>) => !['nombre', 'actividad', 'telefono'].includes(String(f.nombre))));
        } catch (err) {
            console.error('Error:', err);
        } finally { setLoadingFields(false); }
    }
    async function addCustomField() {
        if (!newField.etiqueta.trim()) return;
        const nombre = newField.etiqueta.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        try {
            const { error } = await supabase.from('cat_emprendimiento_campos').insert([{ nombre, etiqueta: newField.etiqueta.trim(), tipo: newField.tipo, requerido: newField.requerido, orden: customFields.length + 10 }]);
            if (error) throw error;
            setNewField({ etiqueta: '', tipo: 'texto', requerido: false });
            setShowFieldForm(false);
            fetchCustomFields();
        } catch (err: unknown) { alert(err && typeof err === 'object' && 'code' in err && err.code === '23505' ? 'Ya existe un campo con ese nombre.' : 'Error al guardar.'); }
    }
    async function deleteCustomField(id: string) {
        if (!window.confirm('¿Eliminar este campo? Los datos ya guardados se conservarán.')) return;
        try {
            const { error } = await supabase.from('cat_emprendimiento_campos').delete().eq('id', id);
            if (error) throw error;
            fetchCustomFields();
        } catch (e) {
            console.error(e); alert('Error al eliminar campo.'); }
    }

    // --- FUNCIONES DE VULNERABILIDAD ---
    async function fetchVulnerabilities() {
        try {
            setLoadingVulnerability(true);
            const { data, error } = await supabase
                .from('vulnerability_data')
                .select('*')
                .order('fecha_registro', { ascending: false });

            if (error) throw error;
            setVulnerabilities(data || []);
        } catch (error) {
            console.error('Error fetching vulnerabilities:', error);
        } finally {
            setLoadingVulnerability(false);
        }
    }

    async function addVulnerability() {
        const { estado, latitud, longitud } = newVulnerability;
        if (!estado || !latitud || !longitud) {
            alert('Estado, Latitud y Longitud son campos obligatorios.');
            return;
        }

        try {
            if (editingVulnerabilityId) {
                // Modo Edición
                const { error } = await supabase
                    .from('vulnerability_data')
                    .update({
                        ...newVulnerability,
                        latitud: parseFloat(newVulnerability.latitud),
                        longitud: parseFloat(newVulnerability.longitud)
                    })
                    .eq('id', editingVulnerabilityId);

                if (error) throw error;
                alert('Punto actualizado correctamente.');
            } else {
                // Modo Creación
                const { error } = await supabase
                    .from('vulnerability_data')
                    .insert([{
                        ...newVulnerability,
                        latitud: parseFloat(newVulnerability.latitud),
                        longitud: parseFloat(newVulnerability.longitud)
                    }]);

                if (error) throw error;
                alert('Punto registrado correctamente.');
            }

            setNewVulnerability({
                estado: '',
                municipio: '',
                parroquia: '',
                nivel_prioridad: 3,
                descripcion_problema: '',
                latitud: '',
                longitud: ''
            });
            setEditingVulnerabilityId(null);
            fetchVulnerabilities();
        } catch (error) {
            console.error('Error in addVulnerability:', error);
            alert('Error al procesar la operación.');
        }
    }

    function handleEditVulnerability(v: VulnerabilityData) {
        setEditingVulnerabilityId(v.id);
        setNewVulnerability({
            estado: v.estado,
            municipio: v.municipio,
            parroquia: v.parroquia,
            nivel_prioridad: v.nivel_prioridad,
            descripcion_problema: v.descripcion_problema,
            latitud: v.latitud.toString(),
            longitud: v.longitud.toString()
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    async function deleteVulnerability(id: string) {
        if (!window.confirm('¿Desea eliminar este punto de vulnerabilidad?')) return;
        try {
            const { error } = await supabase
                .from('vulnerability_data')
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchVulnerabilities();
        } catch (e) {
            console.error(e);
            alert('Error al eliminar el punto.');
        }
    }


    const filteredProfiles = profiles.filter(p => {
        const matchesSearch =
            p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.cedula.includes(searchTerm);

        let matchesRol = false;
        if (filterRol === 'ALL') matchesRol = true;
        else if (filterRol === 'SUSPENDIDO') matchesRol = p.is_active === false;
        else matchesRol = p.rol === filterRol;

        return matchesSearch && matchesRol;
    });

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row font-sans relative">
            {/* Botón de Menú Móvil */}
            <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-[#007AFF] text-white rounded-2xl z-[10001] shadow-2xl flex items-center justify-center active:scale-95 transition-all"
            >
                {isSidebarOpen ? <ArrowLeft size={24} /> : <Settings size={24} />}
            </button>

            {/* Sidebar Fija / Móvil */}
            <aside className={`
                w-80 bg-white border-r border-slate-100 flex flex-col p-8 
                fixed lg:sticky top-0 left-0 h-screen z-[9999] transition-transform duration-300
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                <div className="flex items-center gap-4 mb-12">
                    <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-slate-900/20">
                        <Shield size={24} />
                    </div>
                    <div>
                        <h1 className="font-black text-slate-900 tracking-tight leading-none text-lg">Admin Console</h1>
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">Control de Gestión</p>
                    </div>
                </div>

                <nav className="flex-1 space-y-2">
                    {[
                        { id: 'overview', label: 'Panel General', icon: <Settings size={20} /> },
                        { id: 'users', label: 'Gestión de Usuarios', icon: <UserPlus size={20} /> },
                        { id: 'catalog', label: 'Control de Catálogos', icon: <FileText size={20} /> },
                        { id: 'vulnerability', label: 'Mapa Vulnerabilidad', icon: <ShieldAlert size={20} /> },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => {
                                setView(item.id as 'overview' | 'users' | 'catalog' | 'vulnerability');
                                setIsSidebarOpen(false);
                            }}
                            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm transition-all duration-300 ${view === item.id ? 'bg-[#007AFF] text-white shadow-xl shadow-blue-500/30' : 'text-slate-400 hover:bg-slate-50'}`}
                        >
                            {item.icon}
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="mt-auto space-y-4">
                    {currentUser && (
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-4 hidden md:block">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Sesión Activa</p>
                            <p className="text-xs font-black text-slate-900 uppercase truncate">{currentUser.nombre} {currentUser.apellido}</p>
                        </div>
                    )}
                    <button
                        onClick={() => navigate('/login')}
                        className="w-full flex items-center gap-4 px-6 py-4 text-red-500 font-black text-sm hover:bg-red-50 rounded-2xl transition-all"
                    >
                        <LogOut size={20} /> CERRAR SESIÓN
                    </button>
                </div>
            </aside>

            {/* Overlay para cerrar sidebar móvil */}
            {isSidebarOpen && (
                <div
                    onClick={() => setIsSidebarOpen(false)}
                    className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9998]"
                />
            )}

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto w-full">
                <div className="max-w-[1400px] mx-auto space-y-8 md:space-y-12 pb-32">

                    {/* ENCABEZADO DINÁMICO */}
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="px-3 py-1 bg-blue-50 text-[#007AFF] text-[10px] font-black rounded-full uppercase tracking-widest border border-blue-100">
                                    {view === 'overview' ? 'DASHBOARD' : view === 'users' ? 'SEGURIDAD' : view === 'catalog' ? 'CATÁLOGOS' : 'ALERTAS'}
                                </div>
                            </div>
                            <h2 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                                {view === 'overview' ? 'Panel Control' : view === 'users' ? 'Gestión Usuarios' : view === 'catalog' ? 'Catálogos Sistema' : 'Vulnerabilidad Geográfica'}
                            </h2>
                            <p className="text-slate-400 font-bold uppercase text-[9px] md:text-[11px] tracking-widest mt-3">
                                {view === 'overview' ? 'Configuración global y métricas del sistema.' : view === 'users' ? 'Administración de accesos y roles de inspectores.' : view === 'catalog' ? 'Gestión de listas dinámicas del sistema.' : 'Carga de puntos estratégicos de vulnerabilidad para contraste operativo.'}
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">

                            <button onClick={() => navigate('/dashboard')} className="px-6 md:px-8 py-4 bg-white border border-slate-200 rounded-2xl text-slate-900 font-black text-[10px] md:text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-50 hover:shadow-lg transition-all active:scale-95 shadow-sm">
                                <ArrowLeft size={18} className="text-blue-600" /> Dashboard Web
                            </button>
                        </div>
                    </div>

                    {/* VISTA: OVERVIEW */}
                    {view === 'overview' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div
                                onClick={() => setView('users')}
                                className="bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-200/40 border border-slate-50 group hover:border-blue-300 transition-all cursor-pointer relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-bl-[5rem] -mr-16 -mt-16 group-hover:bg-blue-100 transition-all"></div>
                                <div className="w-16 h-16 bg-blue-50 rounded-3xl flex items-center justify-center text-[#007AFF] mb-8 shadow-inner">
                                    <UserPlus size={32} />
                                </div>
                                <h3 className="font-black text-slate-900 text-2xl uppercase tracking-tighter mb-4 flex items-center justify-between">
                                    Seguridad y Roles
                                    <ChevronRight size={24} className="text-slate-300 group-hover:translate-x-2 transition-all" />
                                </h3>
                                <p className="text-slate-400 font-medium text-sm leading-relaxed mb-6">
                                    Gestiona permisos específicos, activa o suspende cuentas de inspectores y audita accesos regionales.
                                </p>
                                <div className="flex gap-2">
                                    <span className="px-3 py-1.5 bg-slate-50 text-slate-400 text-[9px] font-black rounded-lg uppercase tracking-widest">Active Members: {profiles.length || '...'}</span>
                                </div>
                            </div>

                            <div
                                onClick={() => setView('catalog')}
                                className="bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-200/40 border border-slate-50 group hover:border-emerald-300 transition-all cursor-pointer relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50/50 rounded-bl-[5rem] -mr-16 -mt-16 group-hover:bg-emerald-100 transition-all"></div>
                                <div className="w-16 h-16 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-600 mb-8 shadow-inner">
                                    <FileText size={32} />
                                </div>
                                <h3 className="font-black text-slate-900 text-2xl uppercase tracking-tighter mb-4 flex items-center justify-between">
                                    Catálogos Estructurales
                                    <ChevronRight size={24} className="text-slate-300 group-hover:translate-x-2 transition-all" />
                                </h3>
                                <p className="text-slate-400 font-medium text-sm leading-relaxed mb-6">
                                    Actualiza la lista de rubros, entes ejecutores y estados geográficos para mantener el sistema flexible.
                                </p>
                                <div className="flex gap-2">
                                    <span className="px-3 py-1.5 bg-slate-50 text-slate-400 text-[9px] font-black rounded-lg uppercase tracking-widest">32 Rubros Base</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* VISTA: USERS (Paso 1 del Plan) */}
                    {view === 'users' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">

                            {/* Filtros de Usuario */}
                            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-wrap gap-6 items-end">
                                <div className="flex-1 min-w-[300px] space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Buscar por Nombre o Cédula</label>
                                    <div className="relative">
                                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            placeholder="Ej. Juan Pérez o 12345678..."
                                            className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl text-[14px] font-bold outline-none focus:border-blue-100 transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="w-64 space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Filtrar por Rol</label>
                                    <select
                                        value={filterRol}
                                        onChange={(e) => setFilterRol(e.target.value as 'ALL' | 'INSPECTOR' | 'JEFE' | 'ADMIN' | 'SUSPENDIDO')}
                                        className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-6 py-4 text-[14px] font-bold outline-none focus:border-blue-100 transition-all appearance-none"
                                    >
                                        <option value="ALL">TODOS LOS ROLES // ACTIVOS Y SUSPENDIDOS</option>
                                        <option value="INSPECTOR">SOLO INSPECTORES</option>
                                        <option value="JEFE">SOLO JEFES</option>
                                        <option value="ADMIN">SOLO ADMINISTRADORES</option>
                                        <option value="SUSPENDIDO">⬛ CUENTAS SUSPENDIDAS</option>
                                    </select>
                                </div>
                                <button onClick={fetchProfiles} className="p-4 bg-slate-50 text-[#007AFF] rounded-2xl hover:bg-blue-50 transition-all">
                                    <RefreshCw size={22} className={loading ? 'animate-spin' : ''} />
                                </button>
                            </div>

                            {/* Tabla de Usuarios */}
                            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[800px]">
                                    <thead>
                                        <tr className="bg-slate-50/50 border-b border-slate-50">
                                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identificación</th>
                                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Rol Actual</th>
                                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ubicación</th>
                                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {filteredProfiles.map((p) => (
                                            <tr key={p.id} className={`group transition-all hover:bg-slate-50/50 ${p.is_active === false ? 'opacity-50 grayscale bg-red-50/10' : ''}`}>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="relative">
                                                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-black text-xs">
                                                                {p.nombre[0]}{p.apellido[0]}
                                                            </div>
                                                            {unreadCounts[p.id] > 0 && (
                                                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full border-2 border-white flex items-center justify-center animate-bounce">
                                                                    {unreadCounts[p.id]}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-black text-slate-900 uppercase text-sm">{p.nombre} {p.apellido}</p>
                                                                {p.is_active === false && (
                                                                    <span className="bg-red-50 text-red-500 text-[8px] font-black px-1.5 py-0.5 rounded uppercase border border-red-100">Suspendido</span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <IdCard size={12} className="text-slate-300" />
                                                                <p className="text-[11px] font-bold text-slate-400">{p.cedula}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${p.rol === 'ADMIN' ? 'bg-slate-900 border-slate-900 text-white' :
                                                        p.rol === 'JEFE' ? 'bg-amber-50 border-amber-200 text-amber-600' :
                                                            'bg-blue-50 border-blue-200 text-[#007AFF]'
                                                        }`}>
                                                        {p.rol === 'ADMIN' ? <ShieldAlert size={12} /> : p.rol === 'JEFE' ? <ShieldCheck size={12} /> : <UserPlus size={12} />}
                                                        <span className="text-[10px] font-black uppercase tracking-widest">{p.rol}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <p className="text-xs font-bold text-slate-500 uppercase">{p.estado || 'No Asignado'}</p>
                                                    <p className="text-[10px] text-slate-300 font-medium mt-1">Región de Operación</p>
                                                </td>
                                                <td className="px-8 py-6 text-right relative">
                                                    <div className="flex justify-end gap-3 transition-all">
                                                        {/* Selector de Rol */}
                                                        <div className="relative">
                                                            <button
                                                                disabled={p.id === currentUser?.id}
                                                                onClick={() => {
                                                                    setShowRoleMenu(showRoleMenu === p.id ? null : p.id);
                                                                    setShowActionMenu(null);
                                                                }}
                                                                title="Cambiar Rol Administrativo"
                                                                className={`p-3 border rounded-xl transition-all ${showRoleMenu === p.id ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-white border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200'}`}
                                                            >
                                                                <Shield size={18} />
                                                            </button>

                                                            {showRoleMenu === p.id && (
                                                                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 z-[2000] py-3 animate-in fade-in zoom-in-95 duration-200">
                                                                    <p className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-2">Asignar Nuevo Rol</p>
                                                                    {(['INSPECTOR', 'JEFE', 'ADMIN'] as const).map((role) => (
                                                                        <button
                                                                            key={role}
                                                                            onClick={() => changeUserRole(p.id, role)}
                                                                            className={`w-full text-left px-5 py-2.5 text-xs font-black uppercase tracking-tight transition-all ${p.rol === role ? 'text-blue-600 bg-blue-50' : 'text-slate-600 hover:bg-slate-50'}`}
                                                                        >
                                                                            <div className="flex items-center justify-between">
                                                                                {role}
                                                                                {p.rol === role && <ShieldCheck size={14} />}
                                                                            </div>
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Menú de Acciones (3 puntos) */}
                                                        <div className="relative">
                                                            <button
                                                                onClick={() => {
                                                                    setShowActionMenu(showActionMenu === p.id ? null : p.id);
                                                                    setShowRoleMenu(null);
                                                                }}
                                                                className={`p-3 border rounded-xl transition-all relative ${showActionMenu === p.id ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-400 hover:text-slate-900 hover:border-slate-400'}`}
                                                            >
                                                                <MoreVertical size={18} />
                                                                {unreadCounts[p.id] > 0 && (
                                                                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
                                                                )}
                                                            </button>

                                                            {showActionMenu === p.id && (
                                                                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 z-[2000] py-3 animate-in fade-in zoom-in-95 duration-200">
                                                                    <p className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-2">Acciones de Cuenta</p>
                                                                    <button
                                                                        onClick={() => {
                                                                            setSelectedUserForChat({ id: p.id, name: `${p.nombre} ${p.apellido}` });
                                                                            setUnreadCounts(prev => ({ ...prev, [p.id]: 0 })); // Limpiar localmente
                                                                            setShowActionMenu(null);
                                                                        }}
                                                                        className="w-full text-left px-5 py-3 text-[11px] font-black text-slate-600 uppercase hover:bg-slate-50 transition-all flex items-center justify-between group/chat"
                                                                    >
                                                                        <div className="flex items-center gap-3">
                                                                            <MessageCircle size={14} className="text-emerald-500" /> Chat Directo
                                                                        </div>
                                                                        {unreadCounts[p.id] > 0 && (
                                                                            <span className="bg-red-500 text-white text-[9px] px-2 py-0.5 rounded-full">
                                                                                {unreadCounts[p.id]}
                                                                            </span>
                                                                        )}
                                                                    </button>
                                                                    <div className="h-px bg-slate-50 my-2"></div>
                                                                    <button
                                                                        onClick={() => openEditModal(p)}
                                                                        className="w-full text-left px-5 py-3 text-[11px] font-black text-slate-600 uppercase hover:bg-slate-50 transition-all flex items-center gap-3"
                                                                    >
                                                                        <UserPlus size={14} className="text-blue-500" /> Editar e Info
                                                                    </button>
                                                                    <div className="h-px bg-slate-50 my-2"></div>
                                                                    <button
                                                                        onClick={() => toggleUserStatus(p.id, p.is_active !== false)}
                                                                        className={`w-full text-left px-5 py-3 text-[11px] font-black uppercase hover:bg-red-50 transition-all flex items-center gap-3 ${p.is_active === false ? 'text-emerald-600' : 'text-red-500'}`}
                                                                    >
                                                                        {p.is_active === false ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                                                                        {p.is_active === false ? 'Activar Usuario' : 'Suspender Acceso'}
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredProfiles.length === 0 && !loading && (
                                            <tr>
                                                <td colSpan={4} className="px-8 py-20 text-center">
                                                    <div className="max-w-xs mx-auto space-y-4">
                                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                                                            <Search size={32} />
                                                        </div>
                                                        <p className="text-slate-400 font-bold uppercase text-[11px] tracking-widest">No se encontraron usuarios con esos criterios.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* VISTA: CATALOG (Control de Catálogos) */}
                    {view === 'catalog' && (
                        <div className="space-y-8 animate-in fade-in duration-500">
                            {/* Selector de Tipo de Catálogo */}
                            <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap gap-2">
                                {[
                                    { id: 'RUBRO', label: 'Rubros', icon: Tag },
                                    { id: 'ARTICULO', label: 'Artículos', icon: Box },
                                    { id: 'ENTE', label: 'Entes', icon: Briefcase },
                                    { id: 'ESTADO', label: 'Estados', icon: MapIcon },
                                    { id: 'ACTIVIDAD', label: 'Actividades', icon: Box },
                                    { id: 'MEDIDA', label: 'Medidas', icon: Ruler },
                                    { id: 'MINPPAL', label: 'Empresas MINPPAL', icon: Briefcase },
                                    { id: 'EMPRENDIMIENTO', label: 'Emprendimiento', icon: UserPlus }
                                ].map(type => (
                                    <button
                                        key={type.id}
                                        onClick={() => setCatalogType(type.id as 'RUBRO' | 'ENTE' | 'ESTADO' | 'ACTIVIDAD' | 'MEDIDA' | 'ARTICULO' | 'MINPPAL' | 'EMPRENDIMIENTO')}
                                        className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${catalogType === type.id ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                    >
                                        <type.icon size={16} />
                                        {type.label}
                                    </button>
                                ))}
                            </div>

                            {/* Formulario para Agregar Nuevo Elemento */}
                            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col gap-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                                    <div className="space-y-2 w-full">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                            Nombre del {catalogType.toLowerCase()}
                                        </label>
                                        <div className="relative">
                                            <input
                                                value={catalogType === 'EMPRENDIMIENTO' ? newEntrepName : newCatalogName}
                                                onChange={e => catalogType === 'EMPRENDIMIENTO' ? setNewEntrepName(e.target.value) : setNewCatalogName(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && (catalogType === 'EMPRENDIMIENTO' ? addEntrepreneurType() : addCatalogItem())}
                                                placeholder={`EJ: ${catalogType === 'RUBRO' ? 'CARNE' : catalogType === 'EMPRENDIMIENTO' ? 'COMIDA CASERA' : 'NUEVO ITEM'}`}
                                                className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-blue-100 transition-all uppercase"
                                            />
                                        </div>
                                    </div>

                                    {(catalogType === 'ARTICULO' || catalogType === 'RUBRO') && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                                    Vincular a Rubro (Categoría)
                                                </label>
                                                <div className="relative">
                                                    <select
                                                        value={selectedParentId}
                                                        onChange={e => {
                                                            setSelectedParentId(e.target.value);
                                                        }}
                                                        className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-blue-100 transition-all appearance-none"
                                                    >
                                                        <option value="">-- Sin Vincular --</option>
                                                        {rubrosForSelect.map(r => (
                                                            <option key={r.id} value={r.id}>{r.name}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-1">
                                                    O Vincular a Empresa MINPPAL
                                                </label>
                                                <div className="relative">
                                                    <select
                                                        value={selectedMinppalId}
                                                        onChange={e => {
                                                            setSelectedMinppalId(e.target.value);
                                                        }}
                                                        className="w-full bg-blue-50/30 border-2 border-blue-50 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-blue-200 transition-all appearance-none"
                                                    >
                                                        <option value="">-- Producido por --</option>
                                                        {minppalForSelect.map(m => (
                                                            <option key={m.id} value={m.id}>{m.name}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-blue-400 pointer-events-none" size={18} />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {/* Campos adicionales para ARTÍCULO */}
                                {(catalogType === 'ARTICULO' || catalogType === 'RUBRO') && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Presentación (Ej: 1Kg, 140Grs)</label>
                                            <input
                                                type="text"
                                                value={newCatalogPresentation}
                                                onChange={(e) => setNewCatalogPresentation(e.target.value)}
                                                placeholder="Ej: 1 Kg"
                                                className="w-full h-[60px] px-8 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 flex items-center gap-2">
                                                <DollarSign size={12} /> Precio Sugerido Nacional (Bs.)
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Bs.</span>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={newCatalogPrice}
                                                    onChange={(e) => setNewCatalogPrice(e.target.value)}
                                                    className="w-full h-[60px] pl-16 pr-8 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 transition-all"
                                                    placeholder="Ej: 813.39"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center px-4">
                                                <label className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-2" title="Referencia del mercado privado para cálculo de ahorro">
                                                    <Tag size={12} /> Precio Referencia Privado (Bs.)
                                                </label>
                                                {Number(newCatalogPricePrivado) > 0 && Number(newCatalogPrice) > 0 && (
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                                            Impacto: -Bs. {(Number(newCatalogPricePrivado) - Number(newCatalogPrice)).toFixed(2)}
                                                        </span>
                                                        <span className="text-[8px] font-bold text-emerald-500 mr-2">
                                                            ({(((Number(newCatalogPricePrivado) - Number(newCatalogPrice)) / Number(newCatalogPricePrivado)) * 100).toFixed(0)}% de ahorro)
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="relative">
                                                <span className="absolute left-8 top-1/2 -translate-y-1/2 text-rose-400 font-bold">Bs.</span>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={newCatalogPricePrivado}
                                                    onChange={(e) => setNewCatalogPricePrivado(e.target.value)}
                                                    className="w-full h-[60px] pl-16 pr-8 bg-rose-50/30 border-2 border-rose-100/50 rounded-2xl text-sm font-bold text-rose-900 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all placeholder:text-rose-200"
                                                    placeholder="Ej: 1200.00"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div className="flex gap-4">
                                    <button
                                        onClick={catalogType === 'EMPRENDIMIENTO' ? addEntrepreneurType : addCatalogItem}
                                        className={`h-[60px] flex-1 px-8 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl transition-all flex items-center gap-2 justify-center ${editingCatalogId ? 'bg-amber-500 shadow-amber-500/20 text-white' : 'bg-blue-600 shadow-blue-500/20 text-white'}`}
                                    >
                                        {editingCatalogId ? <RefreshCw size={18} /> : <Plus size={18} />}
                                        {editingCatalogId ? 'ACTUALIZAR ELEMENTO' : 'AGREGAR AL CATÁLOGO'}
                                    </button>
                                    {editingCatalogId && (
                                        <button
                                            onClick={() => {
                                                setEditingCatalogId(null);
                                                setNewCatalogName('');
                                                setNewCatalogPrice('0');
                                                setNewCatalogPricePrivado('0');
                                                setNewCatalogPresentation('');
                                            }}
                                            className="h-[60px] px-8 bg-slate-100 text-slate-400 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-slate-200 transition-all"
                                        >
                                            CANCELAR
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Lista de Elementos */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {loadingCatalog || loadingEntrep ? (
                                    <div className="col-span-full py-20 text-center space-y-4">
                                        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sincronizando Catálogo...</p>
                                    </div>
                                ) : (catalogType === 'EMPRENDIMIENTO' ? entrepreneurTypes : catalogItems).length > 0 ? (
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    (catalogType === 'EMPRENDIMIENTO' ? entrepreneurTypes : catalogItems).map((item: any) => (
                                        <div
                                            key={item.id}
                                            className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-blue-100 transition-all"
                                        >
                                            <div className="space-y-1">
                                                <h4 className={`text-sm font-black uppercase tracking-tighter ${(item.is_active !== false) ? 'text-slate-900' : 'text-slate-300 line-through'}`}>
                                                    {catalogType === 'EMPRENDIMIENTO' ? item.nombre : item.name}
                                                </h4>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                                                        CREADO: {new Date(item.created_at).toLocaleDateString()}
                                                    </p>
                                                    {item.parent && (
                                                        <>
                                                            <span className="text-slate-200">|</span>
                                                            <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest">
                                                                RUBRO: {item.parent.name}
                                                            </p>
                                                        </>
                                                    )}
                                                    {item.empresa && (
                                                        <>
                                                            <span className="text-slate-200">|</span>
                                                            <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">
                                                                EMPRESA: {item.empresa.name}
                                                            </p>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                {catalogType !== 'EMPRENDIMIENTO' && (
                                                    <button
                                                        onClick={() => handleEditCatalogItem(item)}
                                                        className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"
                                                        title="Editar"
                                                    >
                                                        <Pencil size={16} />
                                                    </button>
                                                )}
                                                {catalogType !== 'EMPRENDIMIENTO' && (
                                                    <button
                                                        onClick={() => toggleCatalogStatus(item.id, item.is_active)}
                                                        className={`p-3 rounded-xl transition-all ${item.is_active ? 'bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white'}`}
                                                        title={item.is_active ? 'Desactivar' : 'Activar'}
                                                    >
                                                        {item.is_active ? <ShieldAlert size={16} /> : <ShieldCheck size={16} />}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => catalogType === 'EMPRENDIMIENTO' ? deleteEntrepreneurType(item.id) : deleteCatalogItem(item.id)}
                                                    className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full py-20 bg-white rounded-[3rem] border border-dashed border-slate-200 text-center space-y-4">
                                        <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center mx-auto">
                                            <Tag size={32} />
                                        </div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No hay elementos en esta categoría.</p>
                                    </div>
                                )}
                            </div>

                            {/* Campos Personalizados — solo visible en pestaña Emprendimiento */}
                            {catalogType === 'EMPRENDIMIENTO' && (
                                <div className="bg-white p-8 md:p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                                                <SlidersHorizontal size={22} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Campos Personalizados</h3>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Define información adicional que el Inspector deberá capturar de cada emprendedor</p>
                                            </div>
                                        </div>
                                        <button onClick={() => setShowFieldForm(!showFieldForm)} className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 active:scale-95 transition-all">
                                            <Plus size={16} /> Nuevo Campo
                                        </button>
                                    </div>
                                    <div className="bg-slate-50 p-5 rounded-2xl border border-dashed border-slate-200">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Campos Base (no modificables)</p>
                                        <div className="flex flex-wrap gap-3">
                                            {['Nombre del Emprendedor', 'Tipo de Actividad', 'Teléfono de Contacto'].map(f => (
                                                <div key={f} className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm">
                                                    <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                                                    <span className="text-[10px] font-black text-slate-600 uppercase">{f}</span>
                                                    <span className="text-[8px] font-bold text-slate-300 uppercase ml-2">FIJO</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    {showFieldForm && (
                                        <div className="bg-indigo-50/50 p-6 rounded-[2rem] border border-indigo-100 space-y-4">
                                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Nuevo Campo Personalizado</p>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre del Campo</label>
                                                    <input type="text" value={newField.etiqueta} onChange={e => setNewField({ ...newField, etiqueta: e.target.value })} placeholder="EJ: Correo Electrónico" className="w-full bg-white border-none rounded-2xl p-4 text-sm font-bold text-slate-900 shadow-sm" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Dato</label>
                                                    <div className="relative">
                                                        <select value={newField.tipo} onChange={e => setNewField({ ...newField, tipo: e.target.value })} className="w-full bg-white border-none rounded-2xl p-4 text-sm font-bold text-slate-700 appearance-none shadow-sm">
                                                            <option value="texto">Texto Libre</option>
                                                            <option value="numero">Número</option>
                                                            <option value="email">Correo Electrónico</option>
                                                            <option value="telefono">Teléfono</option>
                                                        </select>
                                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 cursor-pointer" onClick={() => setNewField({ ...newField, requerido: !newField.requerido })}>
                                                    <div className={`w-12 h-6 rounded-full transition-colors relative ${newField.requerido ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${newField.requerido ? 'left-7' : 'left-1'}`} />
                                                    </div>
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Obligatorio</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-3">
                                                <button onClick={addCustomField} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest active:scale-95 transition-all">Guardar Campo</button>
                                                <button onClick={() => setShowFieldForm(false)} className="px-6 py-3 bg-slate-100 text-slate-500 rounded-2xl text-[11px] font-black uppercase tracking-widest active:scale-95 transition-all">Cancelar</button>
                                            </div>
                                        </div>
                                    )}
                                    <div className="space-y-3">
                                        {loadingFields ? (
                                            <div className="py-8 text-center"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div></div>
                                        ) : customFields.length > 0 ? customFields.map(field => (
                                            <div key={field.id} className="flex items-center justify-between p-5 bg-white rounded-2xl border border-slate-100 group hover:border-indigo-100 transition-all shadow-sm">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500"><SlidersHorizontal size={16} /></div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-900 uppercase tracking-tighter">{field.etiqueta}</p>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-[8px] font-black bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded-full uppercase">{field.tipo}</span>
                                                            {field.requerido && <span className="text-[8px] font-black bg-red-50 text-red-400 px-2 py-0.5 rounded-full uppercase">Obligatorio</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                                <button onClick={() => deleteCustomField(field.id)} className="p-3 bg-red-50 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all active:scale-90">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        )) : (
                                            <div className="py-10 text-center bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No hay campos adicionales. Pulsa "Nuevo Campo" para configurar uno.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}


                    {/* VISTA: VULNERABILITY (Mapa de Vulnerabilidad) */}
                    {view === 'vulnerability' && (
                        <div className="space-y-8 animate-in fade-in duration-500">
                            {/* Formulario de Carga de Vulnerabilidad */}
                            <div className="bg-white p-8 md:p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
                                <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
                                    <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center">
                                        {editingVulnerabilityId ? <RefreshCw size={24} className="animate-spin-slow" /> : <ShieldAlert size={24} />}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
                                            {editingVulnerabilityId ? 'Editando Punto Crítico' : 'Registrar Punto Crítico'}
                                        </h3>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            {editingVulnerabilityId ? 'Modificando datos georeferenciados' : 'Añadir zona de alta prioridad en el mapa'}
                                        </p>
                                    </div>
                                    {editingVulnerabilityId && (
                                        <button
                                            onClick={() => {
                                                setEditingVulnerabilityId(null);
                                                setNewVulnerability({
                                                    estado: '', municipio: '', parroquia: '',
                                                    nivel_prioridad: 3, descripcion_problema: '',
                                                    latitud: '', longitud: ''
                                                });
                                            }}
                                            className="ml-auto px-4 py-2 bg-slate-100 text-slate-500 rounded-xl text-[9px] font-black uppercase hover:bg-slate-200"
                                        >
                                            Cancelar Edición
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Estado / Región</label>
                                        <input
                                            value={newVulnerability.estado}
                                            onChange={e => setNewVulnerability({ ...newVulnerability, estado: e.target.value.toUpperCase() })}
                                            placeholder="EJ: ZULIA"
                                            className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-red-100 transition-all uppercase"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Municipio / Parroquia</label>
                                        <input
                                            value={newVulnerability.municipio}
                                            onChange={e => setNewVulnerability({ ...newVulnerability, municipio: e.target.value.toUpperCase(), parroquia: e.target.value.toUpperCase() })}
                                            placeholder="EJ: MARACAIBO"
                                            className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-red-100 transition-all uppercase"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nivel de Prioridad (1-5)</label>
                                        <select
                                            value={newVulnerability.nivel_prioridad}
                                            onChange={e => setNewVulnerability({ ...newVulnerability, nivel_prioridad: parseInt(e.target.value) })}
                                            className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-red-100 transition-all appearance-none"
                                        >
                                            <option value="1">1 - ESTABLE (VERDE)</option>
                                            <option value="2">2 - BAJA (AMARILLO)</option>
                                            <option value="3">3 - MEDIA (NARANJA)</option>
                                            <option value="4">4 - ALTA (ROJO)</option>
                                            <option value="5">5 - CRÍTICA (ROJO OSCURO)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Coordenada Latitud</label>
                                        <input
                                            value={newVulnerability.latitud}
                                            onChange={e => setNewVulnerability({ ...newVulnerability, latitud: e.target.value })}
                                            placeholder="EJ: 10.7167"
                                            className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-red-100 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Coordenada Longitud</label>
                                        <input
                                            value={newVulnerability.longitud}
                                            onChange={e => setNewVulnerability({ ...newVulnerability, longitud: e.target.value })}
                                            placeholder="EJ: -71.6667"
                                            className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-red-100 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descripción de la Vulnerabilidad</label>
                                    <textarea
                                        value={newVulnerability.descripcion_problema}
                                        onChange={e => setNewVulnerability({ ...newVulnerability, descripcion_problema: e.target.value })}
                                        placeholder="Describa brevemente la situación socio-alimentaria de la zona..."
                                        rows={3}
                                        className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-red-100 transition-all resize-none"
                                    />
                                </div>

                                <button
                                    onClick={addVulnerability}
                                    className={`h-[65px] px-8 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl transition-all flex items-center gap-3 w-full justify-center active:scale-95 ${editingVulnerabilityId ? 'bg-blue-600 shadow-blue-500/20' : 'bg-slate-900 shadow-slate-900/20'
                                        }`}
                                >
                                    {editingVulnerabilityId ? <RefreshCw size={20} /> : <Plus size={20} />}
                                    {editingVulnerabilityId ? 'ACTUALIZAR PUNTO CRÍTICO' : 'GUARDAR PUNTO CRÍTICO'}
                                </button>
                            </div>

                            {/* Lista de Puntos Críticos */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {loadingVulnerability ? (
                                    <div className="col-span-full py-20 text-center">
                                        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                    </div>
                                ) : vulnerabilities.length > 0 ? (
                                    vulnerabilities.map(v => (
                                        <div key={v.id} className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-50 shadow-sm hover:shadow-lg transition-all relative group">
                                            <div className="flex gap-6">
                                                <div className={`w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center font-black text-xl text-white shadow-lg ${v.nivel_prioridad === 5 ? 'bg-red-900 shadow-red-900/20' :
                                                    v.nivel_prioridad >= 4 ? 'bg-red-600 shadow-red-600/20' :
                                                        v.nivel_prioridad === 3 ? 'bg-amber-500 shadow-amber-500/20' :
                                                            'bg-emerald-500 shadow-emerald-500/20'
                                                    }`}>
                                                    {v.nivel_prioridad}
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{v.estado}</h4>
                                                    <p className="font-black text-slate-900 uppercase text-lg leading-tight tracking-tighter">{v.parroquia || v.municipio}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold mt-2">LAT: {v.latitud} | LON: {v.longitud}</p>
                                                    <p className="text-[11px] text-slate-600 mt-4 leading-relaxed line-clamp-2">
                                                        "{v.descripcion_problema || 'Sin descripción'}"
                                                    </p>
                                                </div>
                                                <div className="absolute top-6 right-6 flex gap-2">
                                                    <button
                                                        onClick={() => handleEditVulnerability(v)}
                                                        className="p-3 bg-blue-50 text-blue-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-blue-500 hover:text-white"
                                                        title="Editar punto"
                                                    >
                                                        <FileText size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteVulnerability(v.id)}
                                                        className="p-3 bg-red-50 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                                                        title="Eliminar punto"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full py-20 bg-white rounded-[3rem] border border-dashed border-slate-200 text-center space-y-4">
                                        <ShieldAlert size={48} className="mx-auto text-slate-100" />
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No hay puntos de vulnerabilidad registrados</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                </div>
            </main>

            {/* MODAL DE EDICIÓN */}
            {editingUser && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[5000] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
                        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Editar Perfil</h3>
                                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">ID: {editForm.cedula}</p>
                            </div>
                            <button onClick={() => setEditingUser(null)} className="p-2 hover:bg-white rounded-xl transition-all">
                                <ArrowLeft size={20} className="text-slate-400" />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre</label>
                                    <input
                                        value={editForm.nombre}
                                        onChange={e => setEditForm({ ...editForm, nombre: e.target.value })}
                                        className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:border-blue-100 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Apellido</label>
                                    <input
                                        value={editForm.apellido}
                                        onChange={e => setEditForm({ ...editForm, apellido: e.target.value })}
                                        className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:border-blue-100 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cédula de Identidad</label>
                                <input
                                    value={editForm.cedula}
                                    onChange={e => setEditForm({ ...editForm, cedula: e.target.value })}
                                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:border-blue-100 transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Teléfono</label>
                                <input
                                    value={editForm.telefono}
                                    onChange={e => setEditForm({ ...editForm, telefono: e.target.value })}
                                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:border-blue-100 transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ubicación / Estado</label>
                                <input
                                    value={editForm.estado}
                                    onChange={e => setEditForm({ ...editForm, estado: e.target.value })}
                                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:border-blue-100 transition-all"
                                />
                            </div>

                            <div className="pt-4 border-t border-slate-50">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-[10px] font-black text-amber-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                            <ShieldAlert size={12} /> Nueva Contraseña
                                        </label>
                                        <span className="text-[8px] font-bold text-slate-300 uppercase">Solo para cambios de emergencia</span>
                                    </div>
                                    <input
                                        type="password"
                                        value={editForm.newPassword}
                                        onChange={e => setEditForm({ ...editForm, newPassword: e.target.value })}
                                        placeholder="••••••••"
                                        className="w-full bg-amber-50/30 border-2 border-amber-50 rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:border-amber-200 transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-slate-50/50 flex gap-4">
                            <button
                                onClick={() => setEditingUser(null)}
                                className="flex-1 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest hover:bg-white rounded-2xl transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleUpdateUser}
                                disabled={saving}
                                className="flex-[2] py-4 bg-blue-600 text-white shadow-xl shadow-blue-600/20 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all disabled:opacity-50"
                            >
                                {saving ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DE CHAT FLOTANTE */}
            {selectedUserForChat && (
                <div className="fixed bottom-6 right-6 z-[6000] animate-in slide-in-from-right-10 duration-500 w-full max-w-sm">
                    <ChatBox
                        receiverId={selectedUserForChat.id}
                        receiverName={selectedUserForChat.name}
                        onClose={() => setSelectedUserForChat(null)}
                        isAdminView={true}
                    />
                </div>
            )}
        </div>
    );
}

