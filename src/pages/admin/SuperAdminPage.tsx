import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { Search, Plus, Key, ShieldAlert, CheckCircle, X, RotateCcw, ShieldCheck, User, ChevronDown, Loader2, Mail, Building, Power, MapPin, Activity, Check, Server, CreditCard } from 'lucide-react';
import { getTodasEmpresas, suspenderEmpresa, activarEmpresa, cambiarPlanEmpresa, registrarNuevoInquilino, type Empresa } from '@/api/empresa';
import AdminLayout from '@/components/layouts/AdminLayout';
import { useAuthStore } from '@/store/authStore';
import { sileo } from 'sileo';

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 400, damping: 30 } }
};

function ModalConfirmacion({ isOpen, title, message, isDestructive, onClose, onConfirm }: { isOpen: boolean; title: string; message: string; isDestructive: boolean; onClose: () => void; onConfirm: () => void }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 p-8 text-center space-y-6">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-inner ${isDestructive ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
          {isDestructive ? <Power size={32} /> : <CheckCircle size={32} />}
        </div>
        <div>
          <h3 className="text-xl font-black text-gray-900 tracking-tight">{title}</h3>
          <p className="text-gray-500 text-sm font-medium mt-2">{message}</p>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 px-5 py-3.5 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-all active:scale-95">Cancelar</button>
          <button type="button" onClick={() => { onConfirm(); onClose(); }} className={`flex-1 px-5 py-3.5 text-white font-black rounded-xl transition-all shadow-lg active:scale-95 ${isDestructive ? 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 shadow-red-500/30' : 'bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 shadow-emerald-500/30'}`}>
            Sí, confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalNuevoCliente({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void; }) {
  const [creando, setCreando] = useState(false);
  const [formData, setFormData] = useState({ nombreComercial: '', ruc: '', direccion: '', planId: '1', adminNombre: '', adminCorreo: '', adminPassword: '' });

  const handleRucChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valorLimpio = e.target.value.replace(/\D/g, '');
    if (valorLimpio.length <= 11) {
      setFormData({ ...formData, ruc: valorLimpio });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombreComercial.trim() || !formData.ruc.trim() || !formData.direccion.trim() || !formData.adminNombre.trim() || !formData.adminCorreo.trim() || !formData.adminPassword.trim()) {
      return sileo.error({ title: 'Todos los campos son obligatorios' });
    }

    if (formData.ruc.length !== 11) {
      return sileo.error({ title: 'El RUC debe tener exactamente 11 dígitos numéricos' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.adminCorreo)) {
      return sileo.error({ title: 'Ingrese un correo electrónico válido' });
    }

    if (formData.adminPassword.length <= 2) {
      return sileo.error({ title: 'La contraseña debe tener más de 2 caracteres' });
    }

    setCreando(true);
    try {
      await registrarNuevoInquilino(formData);
      sileo.success({ title: 'Cliente creado exitosamente' });
      setFormData({ nombreComercial: '', ruc: '', direccion: '', planId: '1', adminNombre: '', adminCorreo: '', adminPassword: '' });
      onSuccess();
    } catch (error: any) {
      sileo.error({ title: error.response?.data?.message || 'Error al crear el cliente' });
    } finally {
      setCreando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-visible animate-in zoom-in-95 duration-200">
        
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/80 shrink-0 rounded-t-2xl">
          <h2 className="text-gray-900 font-black text-xl tracking-tight flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-xl"><Building className="text-orange-500" size={20} /></div>
            Nuevo Cliente SaaS
          </h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-900 hover:bg-gray-200 p-1.5 rounded-lg transition-all active:scale-95">
            <X size={20} strokeWidth={2.5}/>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <form id="crear-tenant-form" onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              <div className="lg:col-span-7 space-y-6">
                <div className="space-y-4">
                  <h4 className="text-[11px] font-black text-orange-600 uppercase tracking-widest flex items-center gap-2 border-b border-gray-100 pb-2">
                    <Building size={14} /> Datos del Restaurante
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Nombre Comercial</label>
                      <input type="text" value={formData.nombreComercial} onChange={e => setFormData({...formData, nombreComercial: e.target.value})} className="w-full px-4 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 transition-all font-bold outline-none text-gray-900" placeholder="Ej. El Buen Sabor" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">RUC</label>
                      <input type="text" value={formData.ruc} onChange={handleRucChange} className="w-full px-4 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 transition-all font-bold outline-none text-gray-900" placeholder="11 dígitos numéricos" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><MapPin size={12}/> Dirección Principal</label>
                      <input type="text" value={formData.direccion} onChange={e => setFormData({...formData, direccion: e.target.value})} className="w-full px-4 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 transition-all font-bold outline-none text-gray-900" placeholder="Av. Principal 123" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <h4 className="text-[11px] font-black text-orange-600 uppercase tracking-widest flex items-center gap-2 border-b border-gray-100 pb-2">
                    <User size={14} /> Credenciales del Dueño
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Nombre del Administrador</label>
                      <input type="text" value={formData.adminNombre} onChange={e => setFormData({...formData, adminNombre: e.target.value})} className="w-full px-4 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 transition-all font-bold outline-none text-gray-900" placeholder="Ej. Juan Pérez" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Mail size={12}/> Correo Electrónico</label>
                      <input type="text" value={formData.adminCorreo} onChange={e => setFormData({...formData, adminCorreo: e.target.value})} className="w-full px-4 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 transition-all font-bold outline-none text-gray-900" placeholder="juan@restaurante.com" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Key size={12}/> Contraseña Inicial</label>
                      <input type="text" value={formData.adminPassword} onChange={e => setFormData({...formData, adminPassword: e.target.value})} className="w-full px-4 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 transition-all font-bold outline-none text-gray-900" placeholder="Mínimo 3 caracteres" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 flex flex-col space-y-4">
                <h4 className="text-[11px] font-black text-orange-600 uppercase tracking-widest flex items-center gap-2 border-b border-gray-100 pb-2">
                  <Activity size={14} /> Selección de Plan
                </h4>
                
                <div 
                  onClick={() => setFormData({...formData, planId: '1'})}
                  className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                    formData.planId === '1' ? 'border-orange-500 bg-orange-50/50 shadow-md' : 'border-gray-200 bg-white hover:border-orange-300'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="text-base font-black text-gray-900">Plan Básico</h5>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.planId === '1' ? 'border-orange-500 bg-orange-500' : 'border-gray-300'}`}>
                      {formData.planId === '1' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1 mb-3">
                    <span className="text-xl font-black text-orange-600">S/ 49.00</span><span className="text-xs text-gray-500 font-bold uppercase">/mes</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-gray-600 font-medium">
                    <li className="flex items-center gap-2"><Check size={14} className="text-emerald-500" /> Pedidos, Caja y KDS</li>
                    <li className="flex items-center gap-2 text-gray-400"><X size={14} /> Sin Facturación SUNAT</li>
                  </ul>
                </div>

                <div 
                  onClick={() => setFormData({...formData, planId: '2'})}
                  className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 overflow-hidden ${
                    formData.planId === '2' ? 'border-orange-500 bg-orange-50/50 shadow-md' : 'border-gray-200 bg-white hover:border-orange-300'
                  }`}
                >
                  <div className="absolute top-0 right-0 bg-orange-600 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-lg">
                    Recomendado
                  </div>
                  <div className="flex justify-between items-start mb-2 mt-1">
                    <h5 className="text-base font-black text-gray-900">Plan Completo</h5>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.planId === '2' ? 'border-orange-500 bg-orange-500' : 'border-gray-300'}`}>
                      {formData.planId === '2' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1 mb-3">
                    <span className="text-xl font-black text-orange-600">S/ 99.00</span><span className="text-xs text-gray-500 font-bold uppercase">/mes</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-gray-600 font-medium">
                    <li className="flex items-center gap-2"><Check size={14} className="text-emerald-500" /> Todos los módulos básicos</li>
                    <li className="flex items-center gap-2"><Check size={14} className="text-orange-500" /> Facturación SUNAT & Reportes</li>
                  </ul>
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="p-5 border-t border-gray-100 bg-gray-50/80 flex gap-4 shrink-0 justify-end rounded-b-2xl">
          <button type="button" onClick={onClose} className="px-6 py-2.5 border border-gray-200 bg-white text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm active:scale-95">
            Cancelar
          </button>
          <button form="crear-tenant-form" type="submit" disabled={creando} className="px-8 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-black text-sm rounded-xl disabled:opacity-50 flex justify-center items-center shadow-md transition-all active:scale-95">
            {creando ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
            {creando ? 'Creando...' : 'Confirmar Guardado'}
          </button>
        </div>

      </div>
    </div>
  );
}

export default function SuperAdminPage() {
  const { user } = useAuthStore();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  
  const [modalConfirmacion, setModalConfirmacion] = useState<{ isOpen: boolean; title: string; message: string; isDestructive: boolean; action: () => void }>({ isOpen: false, title: '', message: '', isDestructive: true, action: () => {} });
  const [isModalCrearOpen, setIsModalCrearOpen] = useState(false);

  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user && user.rol !== 'ROLE_SUPER_ADMIN') window.location.href = '/login';
  }, [user]);

  const cargarEmpresas = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getTodasEmpresas();
      setEmpresas(data);
    } catch (error: any) {
      sileo.error({ title: 'Error al conectar con la base de datos de clientes.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargarEmpresas(); }, [cargarEmpresas]);

  const handleSuspender = (emp: Empresa) => {
    setModalConfirmacion({
      isOpen: true,
      title: '¿Suspender Cliente?',
      message: `Al suspender a ${emp.nombreComercial}, perderán el acceso al sistema inmediatamente.`,
      isDestructive: true,
      action: async () => {
        try { 
          await suspenderEmpresa(emp.id); 
          sileo.success({ title: 'Cliente suspendido' });
          cargarEmpresas(); 
        } catch (e: any) { 
          sileo.error({ title: e.response?.data?.message || 'Error al suspender' }); 
        }
      }
    });
  };

  const handleActivar = (emp: Empresa) => {
    setModalConfirmacion({
      isOpen: true,
      title: '¿Restaurar Cliente?',
      message: `${emp.nombreComercial} volverá a tener acceso al sistema.`,
      isDestructive: false,
      action: async () => {
        try { 
          await activarEmpresa(emp.id); 
          sileo.success({ title: 'Cliente restaurado' });
          cargarEmpresas(); 
        } catch (e: any) { 
          sileo.error({ title: e.response?.data?.message || 'Error al restaurar' }); 
        }
      }
    });
  };

  const handleChangePlan = async (empresaId: number, nuevoPlanId: number) => {
    try {
      await cambiarPlanEmpresa(empresaId, nuevoPlanId);
      sileo.success({ title: `Plan actualizado correctamente` });
      cargarEmpresas(); 
    } catch (err: any) {
      sileo.error({ title: 'Error al actualizar el plan' });
    }
  };

  const empresasFiltradas = empresas.filter(e => 
    e.nombreComercial.toLowerCase().includes(busqueda.toLowerCase()) || 
    (e.ruc && e.ruc.includes(busqueda))
  );

  const empresasActivas = empresas.filter(e => e.estadoRegistro).length;
  const mrrTotal = empresas.filter(e => e.estadoRegistro).reduce((acc, curr) => acc + Number(curr.suscripcionVigente?.plan?.precioMensual || 0), 0);
  const planesPremium = empresas.filter(e => e.suscripcionVigente?.plan?.nombre?.toUpperCase().includes('COMPLETO')).length;

  return (
    <>
      <AdminLayout>
        <div className="max-w-[1600px] mx-auto flex flex-col min-h-[calc(100vh-120px)] pb-6">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 shrink-0">
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                Gestión de <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">Inquilinos SaaS</span>
              </h1>
              <p className="text-gray-500 font-medium text-sm">Administración de clientes, facturación y accesos.</p>
            </div>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-gray-200 shadow-sm flex flex-col xl:flex-row items-center justify-between gap-4 shrink-0 mb-4">
            <div className="flex p-1 bg-gray-50 rounded-xl w-full xl:w-auto border border-gray-100 hidden md:flex items-center px-4">
               <span className="text-xs font-bold text-gray-600">Directorio General de Restaurantes</span>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto ml-auto">
              <motion.div
                initial={false}
                animate={{ width: isSearchExpanded || busqueda ? 300 : 40 }}
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
                  placeholder="Buscar por cliente o RUC..."
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
              
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setIsModalCrearOpen(true)} className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white px-5 py-2 rounded-lg text-xs font-bold flex justify-center items-center gap-2 transition-colors shadow-sm shrink-0">
                <Plus size={16} /> Nuevo Cliente
              </motion.button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0 mb-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex justify-between items-center">
              <div>
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">MRR Total (Mensual)</p>
                <h3 className="text-3xl font-black text-gray-900 mt-1">S/ {mrrTotal.toFixed(2)}</h3>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-500 border border-emerald-100"><CreditCard size={24} strokeWidth={2.5} /></div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex justify-between items-center">
              <div>
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Clientes Activos</p>
                <h3 className="text-3xl font-black text-gray-900 mt-1">{empresasActivas} <span className="text-lg text-gray-400">/ {empresas.length}</span></h3>
              </div>
              <div className="p-3 bg-cyan-50 rounded-xl text-cyan-500 border border-cyan-100"><Server size={24} strokeWidth={2.5} /></div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex justify-between items-center">
              <div>
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Planes Completos</p>
                <h3 className="text-3xl font-black text-gray-900 mt-1">{planesPremium}</h3>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl text-purple-500 border border-purple-100"><Activity size={24} strokeWidth={2.5} /></div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0 mb-6">
            <div className="bg-[#0f1219] rounded-2xl p-6 relative overflow-hidden shadow-sm border border-gray-800">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h4 className="text-xl font-black text-white">Plan Básico</h4>
                  <p className="text-xs text-gray-400 font-medium mt-1">Para restaurantes en crecimiento.</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-white">S/ 49.00</span>
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest ml-1 font-bold">/ mes</span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-300 font-medium"><Check size={16} className="text-emerald-500" /> Módulo de Pedidos</div>
                <div className="flex items-center gap-2 text-sm text-gray-300 font-medium"><Check size={16} className="text-emerald-500" /> Módulo de Caja</div>
                <div className="flex items-center gap-2 text-sm text-gray-300 font-medium"><Check size={16} className="text-emerald-500" /> Inventario Básico</div>
                <div className="flex items-center gap-2 text-sm text-gray-300 font-medium"><Check size={16} className="text-emerald-500" /> Cocina (KDS)</div>
                <div className="flex items-center gap-2 text-sm text-gray-600 font-medium"><X size={16} className="text-gray-600" /> Reportes Avanzados</div>
                <div className="flex items-center gap-2 text-sm text-gray-600 font-medium"><X size={16} className="text-gray-600" /> Facturación SUNAT</div>
              </div>
            </div>

            <div className="bg-[#0f1219] border border-indigo-500/50 rounded-2xl p-6 relative overflow-hidden shadow-sm">
              <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h4 className="text-xl font-black text-white flex items-center gap-2">Plan Completo <span className="bg-indigo-500/20 text-indigo-400 text-[9px] px-2 py-0.5 rounded border border-indigo-500/30 uppercase tracking-widest">Recomendado</span></h4>
                  <p className="text-xs text-indigo-200/50 font-medium mt-1">Control financiero e inventario total.</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-indigo-400">S/ 99.00</span>
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest ml-1 font-bold">/ mes</span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-300 font-medium"><Check size={16} className="text-indigo-400" /> Todo lo del Básico</div>
                <div className="flex items-center gap-2 text-sm text-white font-bold"><Check size={16} className="text-indigo-400" /> Reportes Avanzados</div>
                <div className="flex items-center gap-2 text-sm text-white font-bold"><Check size={16} className="text-indigo-400" /> Facturación SUNAT</div>
                <div className="flex items-center gap-2 text-sm text-white font-bold"><Check size={16} className="text-indigo-400" /> Reservas y Fidelización</div>
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-[500px] bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden relative flex flex-col">
            {loading ? (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center text-gray-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-4 border-orange-500 mb-3"></div>
                <p className="font-bold text-gray-600 text-sm">Sincronizando inquilinos...</p>
              </div>
            ) : null}

            <div className="flex-1 overflow-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
              <table className="w-full text-left text-sm whitespace-nowrap min-w-[1000px]">
                <thead className="bg-gray-50 sticky top-0 border-b border-gray-200 text-[10px] text-gray-500 uppercase tracking-widest font-black z-10 shadow-sm">
                  <tr>
                    <th className="px-6 py-3">Cliente / Razón Social</th>
                    <th className="px-6 py-3">Plan y Módulos Activos</th>
                    <th className="px-6 py-3">Precio Mensual</th>
                    <th className="px-6 py-3 text-center">Estado del Sistema</th>
                    <th className="px-6 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <AnimatePresence mode="popLayout">
                    {empresasFiltradas.length === 0 ? (
                      <motion.tr 
                        key="empty-state-row"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <td colSpan={5} className="px-8 py-24 text-center text-gray-400">
                          <div className="flex flex-col items-center justify-center">
                            <Building size={32} className="text-gray-300 mb-3"/>
                            <p className="font-bold text-gray-600 text-base">Directorio Vacío</p>
                            <p className="text-sm mt-1">Registra un nuevo cliente para empezar.</p>
                          </div>
                        </td>
                      </motion.tr>
                    ) : empresasFiltradas.map((emp) => {
                      const esCompleto = emp.suscripcionVigente?.plan?.nombre?.toUpperCase().includes('COMPLETO');

                      return (
                        <motion.tr 
                          variants={itemVariants} 
                          initial="hidden" 
                          animate="show" 
                          exit="hidden" 
                          key={`empresa-row-${emp.id}`} 
                          className={`hover:bg-orange-50/30 transition-colors group ${!emp.estadoRegistro ? 'opacity-50 grayscale' : ''}`}
                        >
                          
                          <td className="px-6 py-4 font-bold text-gray-900 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500 shrink-0">
                              <Building size={16} />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[13px]">{emp.nombreComercial}</span>
                              <span className="text-[10px] text-gray-500 mt-0.5">TENANT-{emp.id} • RUC: {emp.ruc || 'S/D'}</span>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-2">
                              <div className="relative w-40">
                                <select 
                                  value={esCompleto ? 2 : 1}
                                  onChange={(e) => handleChangePlan(emp.id, Number(e.target.value))}
                                  className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-[11px] font-bold text-gray-700 cursor-pointer outline-none appearance-none hover:border-gray-400 shadow-sm"
                                >
                                  <option value={1}>Plan Básico</option>
                                  <option value={2}>Plan Completo</option>
                                </select>
                                <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                              </div>
                              
                              <div className="flex flex-wrap items-center gap-1.5 w-[250px]">
                                <span className="text-[8px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 px-1.5 py-0.5 rounded">CAJA & PEDIDOS</span>
                                <span className="text-[8px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 px-1.5 py-0.5 rounded">KDS & STOCK</span>
                                {esCompleto ? (
                                  <>
                                    <span className="text-[8px] font-bold bg-blue-50 text-blue-600 border border-blue-200 px-1.5 py-0.5 rounded">REPORTES FINAN.</span>
                                    <span className="text-[8px] font-bold bg-blue-50 text-blue-600 border border-blue-200 px-1.5 py-0.5 rounded">FACT. SUNAT</span>
                                  </>
                                ) : (
                                  <>
                                    <span className="text-[8px] font-bold bg-gray-100 text-gray-400 border border-gray-200 px-1.5 py-0.5 rounded line-through">REPORTES FINAN.</span>
                                    <span className="text-[8px] font-bold bg-gray-100 text-gray-400 border border-gray-200 px-1.5 py-0.5 rounded line-through">FACT. SUNAT</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4 font-black text-gray-900 text-[14px]">
                            S/ {esCompleto ? '99.00' : '49.00'}
                          </td>

                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest ${emp.estadoRegistro ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-red-700 bg-red-50 border border-red-200'}`}>
                              {emp.estadoRegistro ? <CheckCircle size={10}/> : <ShieldAlert size={10}/>}
                              {emp.estadoRegistro ? 'Activo / Visible' : 'Suspendido'}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-3">
                              {emp.id === 1 ? (
                                <button disabled className="text-gray-300 cursor-not-allowed" title="Matriz Intocable"><ShieldCheck size={18} strokeWidth={2.5} /></button>
                              ) : emp.estadoRegistro ? (
                                <button onClick={() => handleSuspender(emp)} className="text-[#C1440E] hover:scale-110 transition-transform" title="Cortar Acceso (Falta de Pago)"><Power size={18} strokeWidth={2.5} /></button>
                              ) : (
                                <button onClick={() => handleActivar(emp)} className="text-emerald-500 hover:scale-110 transition-transform" title="Restaurar Acceso"><RotateCcw size={18} strokeWidth={2.5} /></button>
                              )}
                            </div>
                          </td>

                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </AdminLayout>

      <>
        <ModalNuevoCliente isOpen={isModalCrearOpen} onClose={() => setIsModalCrearOpen(false)} onSuccess={() => { setIsModalCrearOpen(false); cargarEmpresas(); }} />
        <ModalConfirmacion isOpen={modalConfirmacion.isOpen} title={modalConfirmacion.title} message={modalConfirmacion.message} isDestructive={modalConfirmacion.isDestructive} onClose={() => setModalConfirmacion(prev => ({ ...prev, isOpen: false }))} onConfirm={modalConfirmacion.action} />
      </>
    </>
  );
}