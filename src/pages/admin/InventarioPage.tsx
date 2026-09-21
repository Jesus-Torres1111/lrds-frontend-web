import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { Search, Plus, Edit2, Trash2, AlertTriangle, Box, RotateCcw, X, CheckCircle, ChevronDown, Loader2 } from 'lucide-react';
import { getInsumos, crearInsumo, actualizarInsumo, eliminarInsumo, activarInsumo } from '@/api/inventario';
import type { Insumo, InsumoRequestDTO } from '@/api/inventario';
import { useAuthStore } from '@/store/authStore';
import AdminLayout from '@/components/layouts/AdminLayout';
import { sileo } from 'sileo';

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 400, damping: 30 } }
};

function ModalConfirmacion({ isOpen, title, message, onClose, onConfirm }: { isOpen: boolean; title: string; message: string; onClose: () => void; onConfirm: () => void }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
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
          <button type="button" onClick={() => { onConfirm(); onClose(); }} className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-black rounded-xl disabled:opacity-50 flex justify-center items-center shadow-md">Sí, confirmar</button>
        </div>
      </div>
    </div>
  );
}

function ModalInsumo({ insumo, onClose, onGuardar }: { insumo?: Insumo | null; onClose: () => void; onGuardar: () => void; }) {
  const navigate = useNavigate();
  const [nombre, setNombre] = useState(insumo?.nombre || '');
  const [unidadMedida, setUnidadMedida] = useState(insumo?.unidadMedida || 'KG');
  const [loading, setLoading] = useState(false);
  const [isUnidadOpen, setIsUnidadOpen] = useState(false);
  const unidadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (unidadRef.current && !unidadRef.current.contains(event.target as Node)) {
        setIsUnidadOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unidades = [
    { value: 'KG', label: 'KG (Kilogramos)' },
    { value: 'GR', label: 'GR (Gramos)' },
    { value: 'LT', label: 'LT (Litros)' },
    { value: 'ML', label: 'ML (Mililitros)' },
    { value: 'UND', label: 'UND (Unidades)' },
    { value: 'PAQ', label: 'PAQ (Paquetes)' },
    { value: 'LAT', label: 'LAT (Latas)' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return sileo.error({ title: 'El nombre es obligatorio' });
    if (!unidadMedida.trim()) return sileo.error({ title: 'La unidad de medida es obligatoria' });
    
    setLoading(true);
    try {
      const payload: InsumoRequestDTO = { nombre, unidadMedida, stockMinimo: 0 };
      
      if (insumo) {
        await actualizarInsumo(insumo.id, payload);
        sileo.success({ title: 'Insumo actualizado correctamente' });
        onGuardar();
      } else {
        const res = await crearInsumo(payload);
        sileo.success({ title: 'Insumo creado correctamente' });
        
        const nuevoId = (res as any)?.id || (res as any)?.data?.id;
        
        onGuardar();
        
        if (nuevoId) {
          navigate('/admin/kardex', { state: { autoSelectId: nuevoId, openEntrada: true } });
        }
      }
    } catch (err: any) {
      sileo.error({ title: err.response?.data?.error || err.response?.data?.message || 'Error al guardar el insumo' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-visible animate-in zoom-in-95 duration-200">
        
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 rounded-t-2xl">
          <h2 className="text-gray-900 font-black text-lg tracking-tight flex items-center gap-2">
            <Box className="text-orange-500" size={20} />
            {insumo ? 'Editar Insumo' : 'Nuevo Insumo'}
          </h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-900 hover:bg-gray-100 p-1.5 rounded-lg transition-all active:scale-95">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Nombre del Insumo / Producto</label>
              <input 
                autoFocus value={nombre} onChange={e => setNombre(e.target.value)} 
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 font-bold focus:ring-2 focus:ring-orange-500 outline-none transition-all" 
                placeholder="Ej. Tomate, Coca Cola, etc." 
              />
            </div>

            <div className="relative sm:col-span-2" ref={unidadRef}>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Unidad de Medida</label>
              <div 
                onClick={() => setIsUnidadOpen(!isUnidadOpen)}
                className={`w-full px-4 py-2.5 bg-white border rounded-xl transition-all font-bold text-gray-900 flex justify-between items-center cursor-pointer select-none ${isUnidadOpen ? 'border-orange-500 ring-2 ring-orange-500/20' : 'border-gray-300 hover:border-gray-400'}`}
              >
                <span>{unidades.find(u => u.value === unidadMedida)?.label || 'Seleccionar...'}</span>
                <ChevronDown size={18} className={`text-gray-400 transition-transform duration-300 ${isUnidadOpen ? 'rotate-180 text-orange-500' : ''}`} />
              </div>

              {isUnidadOpen && (
                <div className="absolute z-50 w-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <ul className="max-h-48 overflow-y-auto p-1.5 custom-scrollbar">
                    {unidades.map(u => (
                      <li 
                        key={u.value}
                        onClick={() => {
                          setUnidadMedida(u.value);
                          setIsUnidadOpen(false);
                        }}
                        className={`px-4 py-2.5 rounded-lg text-sm font-bold cursor-pointer transition-colors ${unidadMedida === u.value ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                      >
                        {u.label}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex gap-3">
            <AlertTriangle className="text-orange-500 shrink-0" size={18} />
            <p className="text-xs text-orange-800 font-medium leading-relaxed">
              Nota: El stock físico y los costos se gestionan desde el panel de <strong>Kardex & Movimientos</strong>.
            </p>
          </div>

          <div className="pt-2 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-5 py-3 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-all">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 px-5 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-black rounded-xl disabled:opacity-50 flex justify-center items-center shadow-md transition-colors">
              {loading ? <Loader2 size={18} className="animate-spin" /> : 'Guardar Insumo'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

export default function InventarioPage() {
  const { user, sedeSeleccionadaId } = useAuthStore();
  const isAdmin = user?.rol === 'ROLE_SUPER_ADMIN' || user?.rol === 'ROLE_ADMIN_EMPRESA';
  
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; action: () => void }>({ isOpen: false, title: '', message: '', action: () => {} });
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'ACTIVOS' | 'INACTIVOS'>('ACTIVOS');
  const [modal, setModal] = useState<{ isOpen: boolean; data?: Insumo | null }>({ isOpen: false });

  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getInsumos(sedeSeleccionadaId || undefined);
      setInsumos(data);
    } catch (error) {
      sileo.error({ title: 'Error al conectar con el servidor' });
    } finally {
      setLoading(false);
    }
  }, [sedeSeleccionadaId]);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  const handleEliminar = (id: number) => {
    setConfirmModal({
      isOpen: true,
      title: '¿Inhabilitar Insumo?',
      message: '¿Estás seguro de inhabilitar este insumo del almacén?',
      action: async () => {
        try { 
          await eliminarInsumo(id); 
          sileo.success({ title: 'Insumo enviado a inhabilitados' });
          cargarDatos(); 
        } catch (e: any) { 
          const errorReal = e.response?.data?.message || e.response?.data?.error || 'Error al inhabilitar';
          sileo.error({ title: 'Fallo Servidor', description: errorReal }); 
        }
      }
    });
  };

  const handleActivar = (id: number) => {
    setConfirmModal({
      isOpen: true,
      title: '¿Restaurar Insumo?',
      message: '¿Deseas restaurar este insumo al almacén?',
      action: async () => {
        try { 
          await activarInsumo(id); 
          sileo.success({ title: 'Insumo restaurado correctamente' });
          cargarDatos(); 
        } catch (e: any) { 
          const errorReal = e.response?.data?.message || e.response?.data?.error || 'Error al restaurar';
          sileo.error({ title: 'Fallo Servidor', description: errorReal }); 
        }
      }
    });
  };

  const filtrados = insumos.filter(i => 
    (tab === 'ACTIVOS' ? i.estadoRegistro : !i.estadoRegistro) &&
    i.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="max-w-[1600px] mx-auto flex flex-col h-[calc(100vh-120px)]">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 shrink-0">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              Almacén <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">Central</span>
            </h1>
            <p className="text-gray-500 font-medium text-sm">Catálogo maestro de insumos y materia prima.</p>
          </div>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-gray-200 shadow-sm flex flex-col xl:flex-row items-center justify-between gap-4 shrink-0 mb-4">
          <div className="flex p-1 bg-gray-50 rounded-xl w-full xl:w-auto border border-gray-100">
            <button 
              onClick={() => setTab('ACTIVOS')} 
              className={`flex-1 xl:w-32 py-2 text-xs font-bold rounded-lg transition-all duration-300 ${tab === 'ACTIVOS' ? 'bg-white shadow-sm text-gray-900 border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Activos
            </button>
            <button 
              onClick={() => setTab('INACTIVOS')} 
              className={`flex-1 xl:w-32 py-2 text-xs font-bold rounded-lg transition-all duration-300 ${tab === 'INACTIVOS' ? 'bg-white shadow-sm text-gray-900 border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Inhabilitados
            </button>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
            <motion.div
              initial={false}
              animate={{ width: isSearchExpanded || busqueda ? 260 : 40 }}
              className="relative flex items-center bg-gray-50 border border-gray-200 rounded-full overflow-hidden h-10 transition-colors focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 shrink-0"
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
                placeholder="Buscar insumo..."
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
              <motion.button 
                whileTap={{ scale: 0.95 }}
                onClick={() => setModal({ isOpen: true, data: null })} 
                className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex justify-center items-center gap-2 transition-colors shadow-sm shrink-0"
              >
                <Plus size={16} /> Nuevo Insumo
              </motion.button>
            )}
          </div>
        </div>

        <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col relative overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
              <p className="font-bold text-gray-400">Consultando almacén...</p>
            </div>
          ) : filtrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <Box size={40} className="mb-4 opacity-50" />
              <h3 className="text-lg font-black text-gray-800 mb-1">{tab === 'ACTIVOS' ? 'Almacén Vacío' : 'Papelera Limpia'}</h3>
              <p className="text-sm font-medium">No se encontraron insumos.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
              <table className="w-full text-left text-sm whitespace-nowrap min-w-[900px]">
                <thead className="bg-gray-50 sticky top-0 border-b border-gray-200 text-[10px] text-gray-500 uppercase tracking-widest font-black z-10 shadow-sm">
                  <tr>
                    <th className="px-6 py-3">Insumo</th>
                    <th className="px-6 py-3 text-center">Und.</th>
                    <th className="px-6 py-3 text-right">Stock Local</th>
                    <th className="px-6 py-3 text-right">Costo Estimado</th>
                    <th className="px-6 py-3 text-center">Estado</th>
                    {isAdmin && <th className="px-6 py-3 text-right">Acciones</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <AnimatePresence>
                    {filtrados.map(i => {
                      const stock = Number(i.stockActual) || 0;
                      const minimo = Number(i.stockMinimo) || 0;
                      const costo = Number(i.costoUnitario) || 0;
                      const critico = stock <= minimo && minimo > 0;

                      return (
                        <motion.tr 
                          variants={itemVariants}
                          initial="hidden" animate="show" exit="hidden"
                          key={i.id} 
                          className={`hover:bg-orange-50/30 transition-colors group ${!i.estadoRegistro ? 'opacity-60 grayscale' : ''}`}
                        >
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors ${tab === 'ACTIVOS' ? 'bg-gray-50 border-gray-200 text-gray-400 group-hover:bg-orange-100 group-hover:text-orange-500 group-hover:border-orange-200' : 'bg-gray-200 border-gray-300 text-gray-500'}`}>
                                <Box size={14} strokeWidth={2.5} />
                              </div>
                              <span className="font-bold text-gray-900 text-[13px]">{i.nombre}</span>
                            </div>
                          </td>
                          <td className="px-6 py-3 text-center">
                            <span className="inline-flex px-2 py-1 rounded bg-gray-100 text-gray-600 font-black text-[10px] tracking-widest uppercase border border-gray-200">{i.unidadMedida}</span>
                          </td>
                          <td className="px-6 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {critico && tab === 'ACTIVOS' && <AlertTriangle size={14} className="text-red-500 animate-pulse" />}
                              <span className={`font-black text-[14px] ${critico && tab === 'ACTIVOS' ? 'text-red-600' : 'text-gray-800'}`}>{stock.toFixed(2)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-3 text-right">
                            <span className="font-mono font-bold text-gray-500 text-[13px]">
                              S/ {costo.toFixed(4)}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-center">
                            {!i.estadoRegistro ? (
                               <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest text-gray-500 bg-gray-100 border border-gray-200">
                                 INHABILITADO
                               </span>
                            ) : critico ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest text-red-700 bg-red-50 border border-red-200">
                                <AlertTriangle size={12}/> Bajo Stock
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-200">
                                <CheckCircle size={12}/> OK
                              </span>
                            )}
                          </td>
                          
                          {isAdmin && (
                          <td className="px-6 py-3 text-right">
                            {tab === 'ACTIVOS' ? (
                              <div className="flex justify-end gap-3">
                                <button onClick={() => setModal({ isOpen: true, data: i })} className="text-[#FFC640] hover:scale-110 transition-transform" title="Editar">
                                  <Edit2 size={16} strokeWidth={2.5} />
                                </button>
                                <button onClick={() => handleEliminar(i.id)} className="text-[#C1440E] hover:scale-110 transition-transform" title="Ocultar">
                                  <Trash2 size={16} strokeWidth={2.5} />
                                </button>
                              </div>
                            ) : (
                              <div className="flex justify-end">
                                <button onClick={() => handleActivar(i.id)} className="text-emerald-500 hover:text-emerald-600 transition-colors flex items-center gap-1.5 font-bold text-xs" title="Restaurar Insumo">
                                  <RotateCcw size={16} strokeWidth={2.5} /> Restaurar
                                </button>
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

      {modal.isOpen && (
        <ModalInsumo 
          insumo={modal.data} 
          onClose={() => setModal({ isOpen: false })} 
          onGuardar={() => { setModal({ isOpen: false }); cargarDatos(); }} 
        />
      )}

      {confirmModal.isOpen && (
        <ModalConfirmacion 
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
          onConfirm={confirmModal.action}
        />
      )}
    </AdminLayout>
  );
}