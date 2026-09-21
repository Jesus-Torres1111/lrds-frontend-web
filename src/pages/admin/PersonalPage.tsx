import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { Search, Plus, Edit2, Trash2, Key, Users, ShieldAlert, CheckCircle, X, RotateCcw, AlertTriangle, User, Loader2, Lock, Mail, ShieldCheck } from 'lucide-react';
import { getUsuarios, crearUsuario, actualizarUsuario, eliminarUsuario, resetearPassword, activarUsuario } from '@/api/usuarios';
import type { Usuario } from '@/api/usuarios';
import AdminLayout from '@/components/layouts/AdminLayout';
import { useAuthStore } from '@/store/authStore';
import { sileo } from 'sileo';

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 400, damping: 30 } }
};

const ROLES = [
  { value: 'ROLE_SUPER_ADMIN', label: 'Super Administrador' },
  { value: 'ROLE_ADMIN_EMPRESA', label: 'Admin Empresa' },
  { value: 'ROLE_GERENTE_SEDE', label: 'Gerente de Sede' },
  { value: 'ROLE_CAJERO', label: 'Cajero' },
  { value: 'ROLE_MOZO', label: 'Mozo de Salón' },
  { value: 'ROLE_COCINA', label: 'Personal de Cocina (KDS)' }
];

function ModalConfirmacion({ isOpen, title, message, onClose, onConfirm }: { isOpen: boolean; title: string; message: string; onClose: () => void; onConfirm: () => void }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8 z-[60]">
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden p-8 text-center space-y-6">
        <div className="w-20 h-20 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <AlertTriangle size={40} />
        </div>
        <div>
          <h3 className="text-2xl font-black text-gray-900 tracking-tight">{title}</h3>
          <p className="text-gray-500 text-base font-medium mt-2">{message}</p>
        </div>
        <div className="flex gap-3 pt-4">
          <button type="button" onClick={onClose} className="flex-1 px-5 py-4 border border-gray-200 text-gray-600 rounded-xl text-base font-bold hover:bg-gray-50 transition-all active:scale-95">Cancelar</button>
          <button type="button" onClick={() => { onConfirm(); onClose(); }} className="flex-1 px-5 py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-black text-base rounded-xl transition-all shadow-md active:scale-95">Sí, confirmar</button>
        </div>
      </motion.div>
    </div>
  );
}

function ModalUsuario({ usuario, sedeId, onClose, onGuardar }: { usuario?: Usuario | null; sedeId: number | null; onClose: () => void; onGuardar: () => void }) {
  const { user } = useAuthStore();
  
  const [nombre, setNombre] = useState(usuario?.nombre || '');
  const [correo, setCorreo] = useState(usuario?.correo || '');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState(usuario?.rol || '');
  const [loading, setLoading] = useState(false);

  const rolesPermitidos = ROLES.filter(r => {
    if (user?.rol === 'ROLE_SUPER_ADMIN') return true; 
    if (user?.rol === 'ROLE_ADMIN_EMPRESA') return r.value !== 'ROLE_SUPER_ADMIN'; 
    return !['ROLE_SUPER_ADMIN', 'ROLE_ADMIN_EMPRESA'].includes(r.value);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !correo.trim() || !rol) {
      return sileo.error({ title: 'Todos los campos son obligatorios' });
    }
    if (!usuario && (!password || password.length <= 3)) {
      return sileo.error({ title: 'La contraseña debe ser mayor de 3 caracteres' });
    }
    
    setLoading(true);
    try {
      const payload: any = { nombre, correo, rol, password: password || undefined, sedeId: sedeId || undefined };
      if (usuario) {
        await actualizarUsuario(usuario.id, payload);
        sileo.success({ title: 'Usuario actualizado exitosamente' });
      } else {
        await crearUsuario(payload);
        sileo.success({ title: 'Usuario creado exitosamente' });
      }
      onGuardar();
    } catch (err: any) {
      sileo.error({ title: err.response?.data?.message || 'Error al guardar el usuario' });
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8 z-[60]">
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl flex flex-col overflow-visible">
        
        <div className="bg-orange-500 p-6 text-white shrink-0 relative overflow-hidden rounded-t-3xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-400 rounded-full blur-3xl opacity-50 -mr-20 -mt-20"></div>
          <h3 className="text-2xl font-black flex items-center gap-2 relative z-10">
            <Users size={24} /> {usuario ? 'Editar Registro de Personal' : 'Registrar Nuevo Personal'}
          </h3>
          <p className="text-orange-100 text-sm font-medium mt-1 relative z-10">Complete todos los datos obligatorios para gestionar el acceso.</p>
          <button onClick={onClose} className="absolute top-6 right-6 text-white/70 hover:text-white hover:bg-white/10 p-2 rounded-full transition-colors z-10">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 flex-1 bg-white overflow-y-auto custom-scrollbar max-h-[70vh]">
          <form id="user-form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-10">
            
            <div className="space-y-6">
              <h4 className="text-xs font-black text-orange-600 uppercase tracking-widest flex items-center gap-2 border-b border-gray-100 pb-3">
                <User size={16} /> Datos Personales
              </h4>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Nombre Completo</label>
                <input autoFocus value={nombre} onChange={e => setNombre(e.target.value)} className="w-full px-5 py-3 text-base bg-white border border-gray-300 rounded-xl font-bold text-gray-900 focus:ring-2 focus:ring-orange-500 outline-none transition-all shadow-sm" placeholder="Ej. Juan Pérez" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Mail size={14}/> Correo Electrónico</label>
                <input type="email" value={correo} onChange={e => setCorreo(e.target.value)} className="w-full px-5 py-3 text-base bg-white border border-gray-300 rounded-xl font-bold text-gray-900 focus:ring-2 focus:ring-orange-500 outline-none transition-all shadow-sm" placeholder="juan@restaurante.com" />
              </div>
              
              {!usuario && (
                <div className="pt-4">
                  <h4 className="text-xs font-black text-orange-600 uppercase tracking-widest flex items-center gap-2 border-b border-gray-100 pb-3 mb-6">
                    <Key size={16} /> Seguridad
                  </h4>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">Contraseña Inicial</label>
                    <input type="text" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-5 py-3 text-base bg-white border border-gray-300 rounded-xl font-bold text-gray-900 focus:ring-2 focus:ring-orange-500 outline-none transition-all shadow-sm" placeholder="Mínimo 4 caracteres" />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-black text-orange-600 uppercase tracking-widest flex items-center gap-2 border-b border-gray-100 pb-3 mb-2">
                <ShieldCheck size={16} /> Selección de Rol
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {rolesPermitidos.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRol(r.value)}
                    className={`w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all flex flex-col justify-center items-start gap-1 ${
                      rol === r.value
                        ? 'border-orange-500 bg-orange-50 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50/50'
                    }`}
                  >
                    <div className="w-full flex justify-between items-center">
                      <span className={`text-sm font-bold ${rol === r.value ? 'text-orange-700' : 'text-gray-700'}`}>
                        {r.label}
                      </span>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${rol === r.value ? 'border-orange-500' : 'border-gray-300'}`}>
                        {rol === r.value && <div className="w-2 h-2 rounded-full bg-orange-500" />}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

          </form>
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-4 shrink-0 justify-end rounded-b-3xl">
          <button type="button" onClick={onClose} className="px-8 py-3.5 border border-gray-200 bg-white text-gray-600 rounded-xl text-base font-bold hover:bg-gray-100 transition-all active:scale-95 shadow-sm">Cancelar</button>
          <button form="user-form" type="submit" disabled={loading} className="px-10 py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-black text-base rounded-xl disabled:opacity-50 flex items-center shadow-md active:scale-95 transition-all">
            {loading ? <Loader2 size={20} className="animate-spin mr-2"/> : null} Guardar Registro
          </button>
        </div>

      </motion.div>
    </div>
  );
}

function ModalResetPassword({ usuario, onClose }: { usuario: Usuario; onClose: () => void }) {
  const [passwordNueva, setPasswordNueva] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordNueva || passwordNueva.length <= 3) {
      return sileo.error({ title: 'La contraseña debe ser mayor de 3 caracteres' });
    }
    setLoading(true);
    try {
      await resetearPassword(usuario.id, passwordNueva);
      sileo.success({ title: 'Contraseña reseteada exitosamente' });
      onClose();
    } catch (err: any) { 
      sileo.error({ title: err.response?.data?.message || 'Error al resetear la contraseña' }); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8 z-[60]">
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
          <h2 className="text-gray-900 font-black text-xl tracking-tight flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-xl"><Key className="text-orange-500" size={20} /></div>
            Resetear Contraseña
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 hover:bg-gray-200 p-2 rounded-lg transition-colors"><X size={20} strokeWidth={2.5} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl flex gap-3">
            <AlertTriangle className="text-orange-500 shrink-0 mt-0.5" size={20} />
            <p className="text-sm font-medium text-orange-800 leading-relaxed">Fuerza el cambio de clave para <strong className="text-gray-900">{usuario.nombre}</strong>.</p>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Nueva Contraseña</label>
            <input autoFocus type="text" value={passwordNueva} onChange={e => setPasswordNueva(e.target.value)} className="w-full px-5 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 font-black focus:ring-2 focus:ring-orange-500 outline-none transition-all shadow-sm" placeholder="Mínimo 4 caracteres" />
          </div>
          <div className="pt-4 flex gap-4">
            <button type="button" onClick={onClose} className="flex-1 px-5 py-3.5 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-all active:scale-95">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 px-5 py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white rounded-xl font-black transition-all shadow-md disabled:opacity-50 flex justify-center items-center active:scale-95">
              {loading ? <Loader2 size={18} className="animate-spin mr-2"/> : null} Confirmar
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function PersonalPage() {
  const { user, sedeSeleccionadaId } = useAuthStore();
  const isAdmin = user?.rol === 'ROLE_SUPER_ADMIN' || user?.rol === 'ROLE_ADMIN_EMPRESA';

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'ACTIVOS' | 'INACTIVOS'>('ACTIVOS');

  const [modalUsr, setModalUsr] = useState<{ isOpen: boolean; data?: Usuario | null }>({ isOpen: false });
  const [modalReset, setModalReset] = useState<{ isOpen: boolean; data?: Usuario | null }>({ isOpen: false });
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; action: () => void }>({ isOpen: false, title: '', message: '', action: () => {} });

  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getUsuarios(sedeSeleccionadaId || undefined);
      setUsuarios(data);
    } catch (error) { 
      sileo.error({ title: 'Error al conectar con el servidor' }); 
    } finally { 
      setLoading(false); 
    }
  }, [sedeSeleccionadaId]); 

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  const handleEliminar = (id: number) => {
    setConfirmModal({
      isOpen: true, title: '¿Inhabilitar Usuario?',
      message: 'Perderá inmediatamente el acceso al sistema.',
      action: async () => {
        try { 
          await eliminarUsuario(id); 
          sileo.success({ title: 'Usuario inhabilitado' }); 
          cargarDatos(); 
        } 
        catch (e: any) { 
          sileo.error({ title: e.response?.data?.message || 'Error al inhabilitar' }); 
        }
      }
    });
  };

  const handleActivar = (id: number) => {
    setConfirmModal({
      isOpen: true, title: '¿Restaurar Usuario?',
      message: 'Volverá a tener acceso al sistema de forma inmediata.',
      action: async () => {
        try { 
          await activarUsuario(id); 
          sileo.success({ title: 'Usuario restaurado' }); 
          cargarDatos(); 
        } 
        catch (e: any) { 
          sileo.error({ title: e.response?.data?.message || 'Error al restaurar' }); 
        }
      }
    });
  };

  const handleNuevoUsuario = () => {
    if (!sedeSeleccionadaId) {
      sileo.error({
        title: 'Acción Requerida',
        description: <span className="text-gray-200">Antes de registrar personal, debes crear o seleccionar tu sucursal en "Mis Locales" en la barra superior.</span>
      });
      return;
    }
    setModalUsr({ isOpen: true, data: null });
  };

  const filtrados = usuarios.filter(u => 
    (tab === 'ACTIVOS' ? u.estadoRegistro : !u.estadoRegistro) &&
    (u.nombre.toLowerCase().includes(busqueda.toLowerCase()) || u.correo.toLowerCase().includes(busqueda.toLowerCase()))
  );

  return (
    <>
      <AdminLayout>
        <div className="max-w-[1600px] mx-auto flex flex-col h-[calc(100vh-120px)]">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 shrink-0">
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                Gestión de <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">Personal</span>
              </h1>
              <p className="text-gray-500 font-medium text-sm">Administración de usuarios y accesos.</p>
            </div>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-gray-200 shadow-sm flex flex-col xl:flex-row items-center justify-between gap-4 shrink-0 mb-4">
            <div className="flex p-1 bg-gray-50 rounded-xl w-full xl:w-auto border border-gray-100">
              <button onClick={() => setTab('ACTIVOS')} className={`flex-1 xl:w-32 py-2 text-xs font-bold rounded-lg transition-all duration-300 ${tab === 'ACTIVOS' ? 'bg-white shadow-sm text-gray-900 border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}>Activos</button>
              <button onClick={() => setTab('INACTIVOS')} className={`flex-1 xl:w-32 py-2 text-xs font-bold rounded-lg transition-all duration-300 ${tab === 'INACTIVOS' ? 'bg-white shadow-sm text-gray-900 border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}>Inhabilitados</button>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
              <motion.div
                initial={false}
                animate={{ width: isSearchExpanded || busqueda ? 240 : 40 }}
                className="relative flex items-center bg-gray-50 border border-gray-200 rounded-full overflow-hidden h-10 transition-colors focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 shrink-0 max-w-full"
              >
                <button
                  onClick={() => {
                    if (!isSearchExpanded) {
                      setIsSearchExpanded(true);
                      setTimeout(() => searchInputRef.current?.focus(), 100);
                    }
                  }}
                  className={`absolute left-0 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-orange-500 transition-colors z-10 ${isSearchExpanded || busqueda ? 'pointer-events-none' : ''}`}
                >
                  <Search size={16} />
                </button>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Buscar por nombre o correo..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  onFocus={() => setIsSearchExpanded(true)}
                  onBlur={() => {
                    if (!busqueda) setIsSearchExpanded(false);
                  }}
                  className={`w-full h-full pl-10 pr-10 bg-transparent text-sm font-bold text-gray-700 outline-none placeholder-gray-400 ${isSearchExpanded || busqueda ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                />
                <AnimatePresence>
                  {(isSearchExpanded || busqueda) && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      onClick={() => {
                        setBusqueda('');
                        setIsSearchExpanded(false);
                      }}
                      className="absolute right-2 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X size={14} />
                    </motion.button>
                  )}
                </AnimatePresence>
              </motion.div>

              {isAdmin && tab === 'ACTIVOS' && (
                <motion.button whileTap={{ scale: 0.95 }} onClick={handleNuevoUsuario} className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white px-5 py-2.5 rounded-lg text-xs font-bold flex justify-center items-center gap-2 transition-colors shadow-sm shrink-0">
                  <Plus size={16} /> Nuevo Usuario
                </motion.button>
              )}
            </div>
          </div>

          <div className="flex-1 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden relative flex flex-col">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full space-y-4">
                <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
                <p className="font-bold text-gray-400">Cargando personal...</p>
              </div>
            ) : (
              <div className="flex-1 overflow-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                <table className="w-full text-left text-sm whitespace-nowrap min-w-[800px]">
                  <thead className="bg-gray-50 sticky top-0 border-b border-gray-200 text-[10px] text-gray-500 uppercase tracking-widest font-black z-10 shadow-sm">
                    <tr>
                      <th className="px-6 py-3">Colaborador</th>
                      <th className="px-6 py-3">Correo Electrónico</th>
                      <th className="px-6 py-3 text-center">Rol Asignado</th>
                      <th className="px-6 py-3 text-center">Estado</th>
                      {isAdmin && <th className="px-6 py-3 text-right">Acciones</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <AnimatePresence mode="popLayout">
                      {filtrados.length === 0 ? (
                        <motion.tr key="empty-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <td colSpan={5} className="px-8 py-24 text-center text-gray-400">
                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                              <Users size={40} className="mb-4 opacity-50" />
                              <h3 className="text-lg font-black text-gray-800 mb-1">{tab === 'ACTIVOS' ? 'Sin Personal Activo' : 'Papelera Limpia'}</h3>
                            </div>
                          </td>
                        </motion.tr>
                      ) : filtrados.map(u => {
                        const rolInfo = ROLES.find(r => r.value === u.rol) || { label: u.rol };
                        
                        const isTargetSuperAdmin = u.rol === 'ROLE_SUPER_ADMIN';
                        const isMeSuperAdmin = user?.rol === 'ROLE_SUPER_ADMIN';
                        const canEditThisUser = isMeSuperAdmin || !isTargetSuperAdmin;

                        return (
                          <motion.tr variants={itemVariants} initial="hidden" animate="show" exit="hidden" key={u.id} className={`hover:bg-orange-50/30 transition-colors group ${!u.estadoRegistro ? 'opacity-60 grayscale' : ''}`}>
                            <td className="px-6 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 group-hover:bg-orange-50 group-hover:text-orange-500 group-hover:border-orange-200 transition-colors">
                                  <User size={16} strokeWidth={2.5} />
                                </div>
                                <span className="font-bold text-gray-900 text-[13px]">{u.nombre}</span>
                              </div>
                            </td>
                            <td className="px-6 py-3 text-gray-500 font-medium text-[13px]">{u.correo}</td>
                            <td className="px-6 py-3 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <span className="inline-flex px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-bold text-[10px] tracking-wide border border-gray-200">{rolInfo.label}</span>
                                {(u.rol === 'ROLE_SUPER_ADMIN' || u.rol === 'ROLE_ADMIN_EMPRESA') ? (
                                  <span className="text-[8px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">🌍 Acceso Global</span>
                                ) : (
                                  <span className="text-[8px] font-black uppercase tracking-widest text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200">🏢 Empleado Local</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-3 text-center">
                              {u.estadoRegistro ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-200"><CheckCircle size={10}/> Activo</span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest text-gray-600 bg-gray-100 border border-gray-200"><ShieldAlert size={10}/> Inhabilitado</span>
                              )}
                            </td>
                            {isAdmin && (
                              <td className="px-6 py-3 text-right">
                                {canEditThisUser ? (
                                  tab === 'ACTIVOS' ? (
                                    <div className="flex justify-end gap-3">
                                      <button onClick={() => setModalReset({ isOpen: true, data: u })} className="text-blue-500 hover:scale-110 transition-transform" title="Resetear Clave"><Key size={16} strokeWidth={2.5} /></button>
                                      <button onClick={() => setModalUsr({ isOpen: true, data: u })} className="text-[#FFC640] hover:scale-110 transition-transform" title="Editar"><Edit2 size={16} strokeWidth={2.5} /></button>
                                      {u.estadoRegistro && (
                                        <button onClick={() => handleEliminar(u.id)} className="text-[#C1440E] hover:scale-110 transition-transform" title="Inhabilitar"><Trash2 size={16} strokeWidth={2.5} /></button>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="flex justify-end">
                                      <button onClick={() => handleActivar(u.id)} className="text-emerald-500 hover:text-emerald-600 transition-colors flex items-center gap-1 font-bold text-xs"><RotateCcw size={14} strokeWidth={2.5} /> Restaurar</button>
                                    </div>
                                  )
                                ) : (
                                  <div className="flex justify-end">
                                    <span className="inline-flex items-center gap-1 text-[9px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1.5 rounded-lg border border-gray-200" title="Solo otro Super Admin puede editar esta cuenta">
                                      <Lock size={12} /> Protegido
                                    </span>
                                  </div>
                                )}
                              </td>
                            )}
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </AdminLayout>

      <AnimatePresence>
        {modalUsr.isOpen && <ModalUsuario sedeId={sedeSeleccionadaId} usuario={modalUsr.data} onClose={() => setModalUsr({ isOpen: false })} onGuardar={() => { setModalUsr({ isOpen: false }); cargarDatos(); }} />}
        {modalReset.isOpen && modalReset.data && <ModalResetPassword usuario={modalReset.data} onClose={() => setModalReset({ isOpen: false })} />}
        {confirmModal.isOpen && <ModalConfirmacion isOpen={confirmModal.isOpen} title={confirmModal.title} message={confirmModal.message} onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} onConfirm={confirmModal.action} />}
      </AnimatePresence>
    </>
  );
}