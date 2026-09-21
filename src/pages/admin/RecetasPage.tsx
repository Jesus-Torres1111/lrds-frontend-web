import { useEffect, useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { 
  ChefHat, Save, Plus, Trash2, Box, Search, 
  Loader2, Info, ArrowRight, Layers, LayoutGrid, DollarSign,
  PanelRightClose
} from 'lucide-react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { getProductosAdmin } from '@/api/catalogo';
import { getInsumos, getRecetaProducto, guardarReceta } from '@/api/inventario';
import type { Producto } from '@/types';
import type { Insumo } from '@/api/inventario';
import { useAuthStore } from '@/store/authStore';
import { sileo } from 'sileo';

interface RecetaLocal { 
  insumoId: number; 
  cantidadUsada: number | string; 
  insumoNombre?: string; 
  unidad?: string; 
  costo?: number; 
}

const listVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.03 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 400, damping: 30 } }
};

const slideInVariants: Variants = {
  hidden: { opacity: 0, x: 20 },
  show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 400, damping: 30 } },
  exit: { opacity: 0, x: 20, transition: { duration: 0.2 } }
};

function getEquivalenciaVisual(cantidad: number, unidad: string) {
  if (!cantidad || cantidad <= 0) return null;
  if (unidad === 'KG' && cantidad < 1) {
    return `${(cantidad * 1000).toFixed(1).replace('.0', '')} GR`;
  }
  if (unidad === 'LT' && cantidad < 1) {
    return `${(cantidad * 1000).toFixed(1).replace('.0', '')} ML`;
  }
  return null;
}

export default function RecetasPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [productoSel, setProductoSel] = useState<Producto | null>(null);
  const [receta, setReceta] = useState<RecetaLocal[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [busquedaInsumo, setBusquedaInsumo] = useState('');
  const [busquedaProducto, setBusquedaProducto] = useState('');
  
  const [mostrarInsumos, setMostrarInsumos] = useState(true);

  const { sedeSeleccionadaId } = useAuthStore();

  useEffect(() => {
    Promise.all([getProductosAdmin(), getInsumos(sedeSeleccionadaId || undefined)]).then(([p, i]) => {
      setProductos(p.filter(x => x.estadoRegistro));
      setInsumos(i.filter(x => x.estadoRegistro));
    });
  }, [sedeSeleccionadaId]);

  const seleccionarProducto = async (prod: Producto) => {
    setProductoSel(prod);
    setLoading(true);
    setBusquedaInsumo('');
    setMostrarInsumos(true); 
    
    try {
      const data = await getRecetaProducto(prod.id);
      
      const mapeada = data.map((d: any) => {
        const idInsumoReal = d.insumo?.id || d.insumoId;
        const cantidadReal = d.cantidadRequerida || d.cantidadUsada || 0;
        const ins = insumos.find(i => i.id === idInsumoReal);
        const costoReal = Number((ins as any)?.costo) || Number(ins?.costoUnitario) || 0;
        
        return { 
           insumoId: idInsumoReal, 
           cantidadUsada: cantidadReal === 0 ? '' : cantidadReal, 
           insumoNombre: ins?.nombre || d.insumo?.nombre || 'Desconocido', 
           unidad: ins?.unidadMedida || d.unidadMedida || '-', 
           costo: costoReal 
         };
      });
      
      setReceta(mapeada);
    } catch (e: any) {
      const errorReal = e.response?.data?.causa || e.response?.data?.error || e.response?.data?.message || 'Error al cargar receta';
      sileo.error({ title: `Error de Servidor: ${errorReal}` });
      setReceta([]);
    } finally { 
      setLoading(false); 
    }
  };

  const agregarInsumo = (insumo: Insumo) => {
    if (receta.find(r => r.insumoId === insumo.id)) return;
    
    const costoReal = Number((insumo as any)?.costo) || Number(insumo.costoUnitario) || 0;
    setReceta([...receta, { 
      insumoId: insumo.id, 
      cantidadUsada: '',
      insumoNombre: insumo.nombre, 
      unidad: insumo.unidadMedida, 
      costo: costoReal 
    }]);
  };

  const quitarInsumo = (insumoId: number) => setReceta(receta.filter(r => r.insumoId !== insumoId));
  
  const actualizarCantidad = (insumoId: number, val: string) => {
    setReceta(receta.map(r => r.insumoId === insumoId ? { ...r, cantidadUsada: val } : r));
  };

  const handleGuardar = async () => {
    if (!productoSel) return;
    if (receta.some(r => (parseFloat(r.cantidadUsada.toString()) || 0) <= 0)) {
      return sileo.error({ title: 'Cantidades inválidas: Todas las cantidades deben ser mayores a 0' });
    }
    
    setGuardando(true);
    try {
      const payload = receta.map(r => ({ 
        insumoId: r.insumoId, 
        cantidadUsada: parseFloat(r.cantidadUsada.toString()) || 0 
      }));

      await guardarReceta(productoSel.id, payload);
      sileo.success({ title: 'Receta Guardada: El inventario se descontará automáticamente.' });
    } catch (e: any) { 
      const errorReal = e.response?.data?.causa || e.response?.data?.error || 'Error al guardar la receta';
      sileo.error({ title: `Error SQL: ${errorReal}` }); 
    } finally { 
      setGuardando(false); 
    }
  };

  const costoReceta = receta.reduce((s, r) => s + ((parseFloat(r.cantidadUsada.toString()) || 0) * (r.costo || 0)), 0);

  const productosFiltrados = productos.filter(p => p.nombre.toLowerCase().includes(busquedaProducto.toLowerCase()));
  
  const insumosDisponibles = insumos.filter(i => 
    !receta.some(r => r.insumoId === i.id) && 
    i.nombre.toLowerCase().includes(busquedaInsumo.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="max-w-[1600px] mx-auto flex flex-col h-[calc(100vh-120px)]">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 shrink-0">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              Builder de <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">Recetas</span>
            </h1>
            <p className="text-gray-500 font-medium text-sm mt-1">Diseña la composición de tus platos con selección rápida.</p>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-4 flex-1 min-h-0 pb-4">
          
          <div className="w-full xl:w-[320px] bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col shrink-0 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50/80 flex items-center gap-3 shrink-0">
              <div className="p-2 bg-orange-100 text-orange-600 rounded-lg border border-orange-200"><ChefHat size={16} strokeWidth={2.5}/></div>
              <h2 className="font-black text-gray-900 text-sm">Platos y Bebidas</h2>
            </div>
            
            <div className="p-3 border-b border-gray-100 shrink-0 bg-white">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input 
                  type="text" placeholder="Buscar plato..." value={busquedaProducto} onChange={(e) => setBusquedaProducto(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-orange-500 outline-none transition-all placeholder-gray-400"
                />
              </div>
            </div>
            
            <motion.div variants={listVariants} initial="hidden" animate="show" className="flex-1 overflow-y-auto p-2 bg-slate-50/30 space-y-1 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
              {productosFiltrados.map(p => {
                const isSelected = productoSel?.id === p.id;
                return (
                  <motion.button 
                    variants={itemVariants}
                    key={p.id} onClick={() => seleccionarProducto(p)} 
                    className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-200 flex justify-between items-center group relative ${
                      isSelected ? 'bg-orange-50 border border-orange-200 shadow-sm' : 'bg-white border border-transparent hover:border-gray-200 hover:shadow-sm'
                    }`}
                  >
                    {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500 rounded-l-lg"></div>}
                    <div className="pl-1">
                      <p className={`font-black text-[13px] leading-tight ${isSelected ? 'text-orange-800' : 'text-gray-800 group-hover:text-orange-600'} transition-colors`}>{p.nombre}</p>
                      <p className={`text-[10px] mt-0.5 font-bold ${isSelected ? 'text-orange-600/70' : 'text-gray-400'}`}>S/ {p.precioVenta.toFixed(2)}</p>
                    </div>
                    <ArrowRight size={14} className={`transition-transform ${isSelected ? 'text-orange-500 -rotate-90' : 'text-gray-300 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0'}`} />
                  </motion.button>
                );
              })}
            </motion.div>
          </div>

          <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col relative overflow-hidden transition-all duration-300">
            {!productoSel ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-10 bg-gray-50/50">
                <Layers size={48} className="text-gray-200 mb-4" strokeWidth={1} />
                <h3 className="text-xl font-black text-gray-800 mb-1 tracking-tight">Lienzo en Blanco</h3>
                <p className="text-sm font-medium text-center max-w-sm">
                  Selecciona un plato a la izquierda para empezar a construir su estructura de costos e insumos.
                </p>
              </div>
            ) : (
              <>
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/80 flex justify-between items-center shrink-0 z-10">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-gray-200 text-gray-500 text-[9px] font-black uppercase tracking-widest mb-2 shadow-sm">
                      <Info size={12} className="text-blue-500" /> Modo Edición
                    </div>
                    <h2 className="text-xl font-black text-gray-900 tracking-tight leading-none">{productoSel.nombre}</h2>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest mb-1">Costo Estimado</p>
                      <div className="inline-flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                        <DollarSign size={14} className="text-emerald-500" />
                        <span className="text-sm font-black text-emerald-700 tracking-tight leading-none">{costoReceta.toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => setMostrarInsumos(!mostrarInsumos)}
                      className={`hidden xl:flex items-center justify-center gap-2 p-2.5 sm:px-3 rounded-lg border font-bold text-xs transition-all shadow-sm ${
                        mostrarInsumos 
                          ? 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100' 
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}
                      title={mostrarInsumos ? "Ocultar panel de insumos" : "Mostrar panel de insumos"}
                    >
                      <Box size={14} strokeWidth={2.5} />
                      <span className="hidden sm:inline">{mostrarInsumos ? 'Ocultar Almacén' : 'Ver Almacén'}</span>
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                  {loading && receta.length === 0 ? (
                    <div className="flex justify-center items-center h-full">
                      <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <AnimatePresence>
                        {receta.length === 0 ? (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-16 px-6 border-2 border-dashed border-gray-200 rounded-2xl bg-white">
                            <LayoutGrid size={28} className="mx-auto text-gray-300 mb-3" />
                            <p className="font-black text-gray-600 mb-1 text-sm">Receta Vacía</p>
                            <p className="text-xs text-gray-400 font-medium max-w-xs mx-auto">Selecciona insumos del panel derecho para añadirlos a este plato.</p>
                          </motion.div>
                        ) : (
                          receta.map((r, index) => {
                            const cantidadNum = parseFloat(r.cantidadUsada.toString()) || 0;
                            const equivalencia = getEquivalenciaVisual(cantidadNum, r.unidad || '');
                            
                            return (
                              <motion.div 
                                key={r.insumoId}
                                layout
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, x: -20 }}
                                transition={{ duration: 0.2 }}
                                className="flex flex-col sm:flex-row items-center gap-4 p-3 border border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md hover:border-orange-200 transition-all group relative overflow-hidden"
                              >
                                <div className="w-7 h-7 bg-gray-50 rounded-md flex items-center justify-center text-[10px] font-black text-gray-400 border border-gray-100 shrink-0">
                                  {index + 1}
                                </div>
                                <div className="flex-1 w-full text-center sm:text-left pl-1">
                                  <p className="font-black text-[14px] text-gray-900 leading-tight">{r.insumoNombre}</p>
                                  <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-widest">
                                    Ref: S/ {r.costo?.toFixed(3)} / {r.unidad}
                                  </p>
                                </div>

                                <div className="flex items-center gap-3 shrink-0 bg-gray-50/80 p-1.5 rounded-lg border border-gray-100">
                                  <div className="flex flex-col items-end">
                                    <div className="flex items-center w-full justify-between mb-0.5">
                                      <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest px-1">Cantidad</span>
                                      {equivalencia && (
                                        <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest px-1">
                                          = {equivalencia}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center bg-white rounded-md border border-gray-200 overflow-hidden focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100 transition-all">
                                      <input 
                                        type="number" 
                                        step="any" 
                                        min="0" 
                                        value={r.cantidadUsada} 
                                        onChange={e => actualizarCantidad(r.insumoId, e.target.value)} 
                                        className="w-24 text-center py-1.5 text-xs font-black text-gray-900 outline-none" 
                                        placeholder="0.000"
                                      />
                                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-2 border-l border-gray-100 bg-gray-50 h-full flex items-center">
                                        {r.unidad}
                                      </span>
                                    </div>
                                  </div>
                                  <button 
                                    onClick={() => quitarInsumo(r.insumoId)} 
                                    className="mt-3 p-2 text-gray-400 hover:text-[#C1440E] hover:bg-red-50 rounded-lg transition-all" 
                                    title="Quitar Insumo"
                                  >
                                    <Trash2 size={16} strokeWidth={2.5}/>
                                  </button>
                                </div>
                              </motion.div>
                            )
                          })
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                <div className="p-4 border-t border-gray-200 bg-white shrink-0">
                  <motion.button 
                    whileTap={{ scale: 0.98 }}
                    onClick={handleGuardar} 
                    disabled={guardando} 
                    className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-black py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-70 text-sm"
                  >
                    {guardando ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} strokeWidth={2.5} />}
                    {guardando ? 'Sincronizando...' : 'Guardar Estructura'}
                  </motion.button>
                </div>
              </>
            )}
          </div>

          {/* ========================================== */}
          {/* COLUMNA 3: INSUMOS (ALMACÉN)                 */}
          {/* ========================================== */}
          <AnimatePresence>
            {productoSel && mostrarInsumos && (
              <motion.div 
                variants={slideInVariants} initial="hidden" animate="show" exit="exit"
                className="w-full xl:w-[320px] bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col shrink-0 overflow-hidden relative"
              >
                <div className="p-4 border-b border-gray-100 bg-gray-50/80 flex flex-col gap-3 shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-gray-100 text-gray-600 rounded-lg border border-gray-200"><Box size={16} strokeWidth={2.5}/></div>
                      <h2 className="font-black text-gray-900 text-sm">Insumos</h2>
                    </div>
                    <button 
                      onClick={() => setMostrarInsumos(false)} 
                      className="xl:hidden p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-900 rounded-lg transition-all"
                    >
                      <PanelRightClose size={16} />
                    </button>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input 
                      type="text" placeholder="Buscar para añadir..." value={busquedaInsumo} onChange={(e) => setBusquedaInsumo(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 text-gray-900 rounded-lg text-xs font-bold focus:ring-2 focus:ring-orange-500 outline-none transition-all shadow-sm placeholder-gray-400"
                    />
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-2 bg-slate-50/30 space-y-1 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
                  {insumosDisponibles.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 font-medium text-xs">
                      No hay más insumos disponibles.
                    </div>
                  ) : (
                    <AnimatePresence>
                      {insumosDisponibles.map((i) => (
                        <motion.button 
                          layout
                          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                          key={i.id} onClick={() => agregarInsumo(i)} 
                          className="w-full text-left px-3 py-2.5 rounded-lg border border-transparent bg-white hover:bg-orange-50 hover:border-orange-200 transition-all duration-200 flex justify-between items-center group shadow-sm"
                        >
                          <div>
                            <p className="font-bold text-[13px] text-gray-700 group-hover:text-orange-800 transition-colors leading-tight">{i.nombre}</p>
                            <span className="inline-block mt-0.5 text-[9px] bg-gray-50 text-gray-500 px-1.5 py-0.5 rounded uppercase tracking-widest font-black border border-gray-100">
                              {i.unidadMedida}
                            </span>
                          </div>
                          <div className="w-6 h-6 rounded-md bg-gray-50 text-gray-400 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-colors border border-gray-100 group-hover:border-orange-500 shadow-sm">
                            <Plus size={14} strokeWidth={3} />
                          </div>
                        </motion.button>
                      ))}
                    </AnimatePresence>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </AdminLayout>
  );
}