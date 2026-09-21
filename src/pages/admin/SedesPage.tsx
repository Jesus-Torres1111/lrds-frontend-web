import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { Search, Plus, Edit2, Trash2, MapPin, Building, ShieldAlert, CheckCircle, X, RotateCcw, AlertTriangle, Loader2 } from 'lucide-react';
import { getSedes, crearSede, actualizarSede, eliminarSede, activarSede } from '@/api/sedes';
import type { Sede } from '@/api/sedes';
import AdminLayout from '@/components/layouts/AdminLayout';
import { sileo } from 'sileo';

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 400, damping: 30 } }
};

function ModalConfirmacion({ isOpen, title, message, onClose, onConfirm }: { isOpen: boolean; title: string; message: string; onClose: () => void; onConfirm: () => void }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 p-8 text-center space-y-6">
        <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <AlertTriangle size={32} />
        </div>
        <div>
          <h3 className="text-xl font-black text-gray-900 tracking-tight">{title}</h3>
          <p className="text-gray-500 text-sm font-medium mt-2">{message}</p>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 px-5 py-3.5 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-all">Cancelar</button>
          <button type="button" onClick={() => { onConfirm(); onClose(); }} className="flex-1 px-5 py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-black rounded-xl shadow-md">Sí, confirmar</button>
        </div>
      </div>
    </div>
  );
}

function ModalSede({ sede, onClose, onGuardar }: { sede?: Sede | null; onClose: () => void; onGuardar: () => void }) {
  const [nombre, setNombre] = useState(sede?.nombre || 'Sede ');
  const [direccion, setDireccion] = useState(sede?.direccion || '');
  const [codigoEstablecimiento, setCodigoEstablecimiento] = useState(sede?.codigoEstablecimiento || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || nombre.trim() === 'Sede') return sileo.error({ title: 'Completa el nombre de la sede' });
    
    setLoading(true);
    try {
      const payload = { nombre, direccion, codigoEstablecimiento };
      if (sede) {
        await actualizarSede(sede.id, payload);
        sileo.success({ title: 'Local actualizado exitosamente' });
      } else {
        await crearSede(payload);
        sileo.success({ title: 'Nuevo local registrado exitosamente' });
      }
      onGuardar();
    } catch (err: any) {
      const mensajeBackend = err.response?.data?.message || 'Error al guardar el local';
      sileo.error({ 
        title: 'Acción Denegada', 
        description: <span className="text-gray-200">{mensajeBackend}</span>
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h2 className="text-gray-900 font-black text-lg tracking-tight flex items-center gap-2">
            <Building className="text-orange-500" size={20} />
            {sede ? 'Editar Local' : 'Nuevo Local Físico'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-lg transition-colors"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Nombre Comercial</label>
            <input autoFocus value={nombre} onChange={e => setNombre(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 font-bold focus:ring-2 focus:ring-orange-500 outline-none transition-all" placeholder="Ej. Sede Cañete Principal" />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Dirección Física</label>
            <input value={direccion} onChange={e => setDireccion(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 font-bold focus:ring-2 focus:ring-orange-500 outline-none transition-all" placeholder="Ej. Av. Principal 123" />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Código SUNAT (Opcional)</label>
            <input value={codigoEstablecimiento} onChange={e => setCodigoEstablecimiento(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 font-bold focus:ring-2 focus:ring-orange-500 outline-none transition-all" placeholder="Ej. 0001, 0002" />
          </div>
          <div className="pt-2 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-5 py-3 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-all">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 px-5 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-black rounded-xl transition-all shadow-md flex justify-center disabled:opacity-50">
              {loading ? <Loader2 size={18} className="animate-spin" /> : 'Guardar Local'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SedesPage() {
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'ACTIVOS' | 'INACTIVOS'>('ACTIVOS');
  const [modal, setModal] = useState<{ isOpen: boolean; data?: Sede | null }>({ isOpen: false });
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; action: () => void }>({ isOpen: false, title: '', message: '', action: () => {} });

  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSedes();
      setSedes(data);
    } catch (error) {
      sileo.error({ title: 'Error al cargar los locales' });
    } finally { setLoading(false); }
  }, []); 

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  const handleEliminar = (id: number) => {
    setConfirmModal({
      isOpen: true,
      title: '¿Inhabilitar Local?',
      message: 'Se cerrará la sesión de todos los usuarios asignados a esta sede y se ocultará.',
      action: async () => {
        try { 
          await eliminarSede(id); 
          sileo.success({ title: 'Local inhabilitado' });
          cargarDatos(); 
        } catch (e: any) { sileo.error({ title: e.response?.data?.message || 'Error al inhabilitar' }); }
      }
    });
  };

  const handleActivar = (id: number) => {
    setConfirmModal({
      isOpen: true,
      title: '¿Restaurar Local?',
      message: 'El local volverá a estar operativo.',
      action: async () => {
        try { 
          await activarSede(id); 
          sileo.success({ title: 'Local restaurado' });
          cargarDatos(); 
        } catch (e: any) { sileo.error({ title: e.response?.data?.message || 'Error al restaurar' }); }
      }
    });
  };

  const filtrados = sedes.filter(s => 
    (tab === 'ACTIVOS' ? s.estadoRegistro : !s.estadoRegistro) &&
    s.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="max-w-[1600px] mx-auto flex flex-col h-[calc(100vh-120px)]">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 shrink-0">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              Mis Locales <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">Operativos</span>
            </h1>
            <p className="text-gray-500 font-medium text-sm">Gestión de sedes, sucursales y franquicias físicas.</p>
          </div>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-gray-200 shadow-sm flex flex-col xl:flex-row items-center justify-between gap-4 shrink-0 mb-4">
          <div className="flex p-1 bg-gray-50 rounded-xl w-full xl:w-auto border border-gray-100">
            <button onClick={() => setTab('ACTIVOS')} className={`flex-1 xl:w-32 py-2 text-xs font-bold rounded-lg transition-all duration-300 ${tab === 'ACTIVOS' ? 'bg-white shadow-sm text-gray-900 border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}>
              Activos
            </button>
            <button onClick={() => setTab('INACTIVOS')} className={`flex-1 xl:w-32 py-2 text-xs font-bold rounded-lg transition-all duration-300 ${tab === 'INACTIVOS' ? 'bg-white shadow-sm text-gray-900 border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}>
              Inhabilitados
            </button>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
            <motion.div
              initial={false}
              animate={{ width: isSearchExpanded || busqueda ? 260 : 40 }}
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
                placeholder="Buscar local..."
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
            {tab === 'ACTIVOS' && (
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setModal({ isOpen: true, data: null })} className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white px-5 py-2.5 rounded-lg text-xs font-bold flex justify-center items-center gap-2 transition-colors shadow-sm shrink-0">
                <Plus size={16} /> Nuevo Local
              </motion.button>
            )}
          </div>
        </div>

        <div className="flex-1 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden relative flex flex-col">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
              <p className="font-bold text-gray-400">Cargando locales...</p>
            </div>
          ) : filtrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <Building size={40} className="mb-4 opacity-50" />
              <h3 className="text-lg font-black text-gray-800 mb-1">Sin Resultados</h3>
            </div>
          ) : (
            <div className="flex-1 overflow-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
              <table className="w-full text-left text-sm whitespace-nowrap min-w-[700px]">
                <thead className="bg-gray-50 sticky top-0 border-b border-gray-200 text-[10px] text-gray-500 uppercase tracking-widest font-black z-10 shadow-sm">
                  <tr>
                    <th className="px-6 py-3">Sucursal / Local</th>
                    <th className="px-6 py-3">Dirección</th>
                    <th className="px-6 py-3 text-center">Código SUNAT</th>
                    <th className="px-6 py-3 text-center">Estado</th>
                    <th className="px-6 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <AnimatePresence>
                    {filtrados.map(s => (
                      <motion.tr variants={itemVariants} initial="hidden" animate="show" exit="hidden" key={s.id} className={`hover:bg-orange-50/30 transition-colors group ${!s.estadoRegistro ? 'opacity-60 grayscale' : ''}`}>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100">
                              <Building size={14} />
                            </div>
                            <span className="font-bold text-gray-900 text-[13px]">{s.nombre}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-gray-500 font-medium text-xs">
                          <div className="flex items-center gap-1.5"><MapPin size={12} className="text-gray-400"/> {s.direccion || 'No especificada'}</div>
                        </td>
                        <td className="px-6 py-3 text-center">
                          <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2.5 py-1 rounded-md border border-gray-200 text-xs">{s.codigoEstablecimiento || '0000'}</span>
                        </td>
                        <td className="px-6 py-3 text-center">
                          {s.estadoRegistro ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-200"><CheckCircle size={10}/> Operativo</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest text-slate-700 bg-slate-100 border border-slate-200"><ShieldAlert size={10}/> Inhabilitado</span>
                          )}
                        </td>
                        <td className="px-6 py-3 text-right">
                          {tab === 'ACTIVOS' ? (
                            <div className="flex justify-end gap-3">
                              <button onClick={() => setModal({ isOpen: true, data: s })} className="text-[#FFC640] hover:scale-110 transition-transform" title="Editar"><Edit2 size={16} strokeWidth={2.5} /></button>
                              <button onClick={() => handleEliminar(s.id)} className="text-[#C1440E] hover:scale-110 transition-transform" title="Ocultar"><Trash2 size={16} strokeWidth={2.5} /></button>
                            </div>
                          ) : (
                            <div className="flex justify-end">
                              <button onClick={() => handleActivar(s.id)} className="text-emerald-500 hover:text-emerald-600 transition-colors flex items-center gap-1 font-bold text-xs"><RotateCcw size={14} strokeWidth={2.5} /> Restaurar</button>
                            </div>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {modal.isOpen && <ModalSede sede={modal.data} onClose={() => setModal({ isOpen: false })} onGuardar={() => { setModal({ isOpen: false }); cargarDatos(); }} />}
      {confirmModal.isOpen && <ModalConfirmacion isOpen={confirmModal.isOpen} title={confirmModal.title} message={confirmModal.message} onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} onConfirm={confirmModal.action} />}
    </AdminLayout>
  );
}