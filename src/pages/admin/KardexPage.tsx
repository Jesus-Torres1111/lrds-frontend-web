import { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { 
  Box, Search, ArrowDownCircle, ArrowUpCircle, RefreshCw, 
  Scale, X, FileText, ArrowRight, Package, Loader2, Bell
} from 'lucide-react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { useAuthStore } from '@/store/authStore';
import { sileo } from 'sileo';
import api from '@/api/client';
import { getInsumos } from '@/api/inventario';
import { formatearFechaHoraPeru } from '@/lib/datetimePeru';

const listVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.03 } } 
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 400, damping: 30 } }
};

function ModalConfigurarStock({ insumo, sedeId, onClose, onGuardar }: any) {
  const [stockMin, setStockMin] = useState(insumo?.stockMinimo?.toString() || '0');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(stockMin) < 0) return sileo.error({ title: 'Cantidad inválida' });
    setLoading(true);
    try {
      await api.put(`/inventario/insumos/${insumo.id}/stock-minimo`, { 
        sedeId, 
        stockMinimo: Number(stockMin) 
      });
      sileo.success({ title: 'Alerta de stock mínimo actualizada' });
      onGuardar();
    } catch (err: any) {
      sileo.error({ title: err.response?.data?.message || 'Error al actualizar' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h2 className="text-gray-900 font-black text-lg tracking-tight flex items-center gap-2">
            <Bell className="text-amber-500" size={20} /> Alerta de Stock
          </h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-900 hover:bg-gray-100 p-1.5 rounded-lg transition-all active:scale-95"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm font-medium text-gray-500">
            El sistema te alertará automáticamente cuando el stock de <strong className="text-gray-900">{insumo.nombre}</strong> caiga por debajo de esta cantidad.
          </p>
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Cantidad Mínima ({insumo.unidadMedida})</label>
            <input autoFocus type="number" step="0.01" min="0" value={stockMin} onChange={e => setStockMin(e.target.value)} className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 font-black focus:ring-2 focus:ring-amber-500 outline-none transition-all text-lg" placeholder="0.00" />
          </div>
          <div className="pt-2 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-5 py-3 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-all">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 px-5 py-3 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white rounded-xl font-black disabled:opacity-50 flex justify-center items-center shadow-lg shadow-amber-500/30 transition-all">
              {loading ? <Loader2 size={18} className="animate-spin" /> : 'Guardar Alerta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ModalOperacionKardex({ tipo, insumo, sedeId, onClose, onGuardar }: any) {
  const [cantidad, setCantidad] = useState('');
  const [costoUnitario, setCostoUnitario] = useState(insumo?.costoUnitario?.toString() || '');
  const [motivo, setMotivo] = useState('');
  const [esPositivo, setEsPositivo] = useState(true);
  const [loading, setLoading] = useState(false);

  const config = {
    ENTRADA: { title: 'Registrar Compra', icon: <ArrowDownCircle className="text-gray-900" />, theme: 'bg-gray-50 border-gray-200 text-gray-900', btn: 'bg-gray-900 hover:bg-black text-white shadow-gray-900/20' },
    MERMA: { title: 'Registrar Merma', icon: <ArrowUpCircle className="text-red-600" />, theme: 'bg-red-50 border-red-100 text-red-700', btn: 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/20' },
    AJUSTE: { title: 'Ajuste de Inventario', icon: <Scale className="text-blue-600" />, theme: 'bg-blue-50 border-blue-100 text-blue-700', btn: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20' }
  }[tipo as 'ENTRADA' | 'MERMA' | 'AJUSTE'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cantidad || Number(cantidad) <= 0) return sileo.error({ title: 'Ingresa una cantidad válida' });
    if (tipo === 'ENTRADA' && (!costoUnitario || Number(costoUnitario) < 0)) return sileo.error({ title: 'Ingresa un costo válido' });
    if ((tipo === 'MERMA' || tipo === 'AJUSTE') && !motivo.trim()) return sileo.error({ title: 'El motivo es obligatorio' });

    setLoading(true);
    try {
      if (tipo === 'ENTRADA') {
        await api.post('/inventario/entradas', { insumoId: insumo.id, sedeId, cantidad: Number(cantidad), costoUnitario: Number(costoUnitario), observacion: motivo || 'Ingreso por compra' });
      } else if (tipo === 'MERMA') {
        await api.post('/inventario/mermas', { insumoId: insumo.id, sedeId, cantidad: Number(cantidad), motivo });
      } else if (tipo === 'AJUSTE') {
        await api.post('/inventario/ajustes', { insumoId: insumo.id, sedeId, cantidad: Number(cantidad), esPositivo, motivo });
      }
      sileo.success({ title: 'Operación registrada con éxito en el Kardex' });
      onGuardar();
    } catch (err: any) {
      sileo.error({ title: err.response?.data?.message || err.response?.data?.error || 'Error al procesar la operación' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h2 className="text-gray-900 font-black text-lg tracking-tight flex items-center gap-2">
            {config.icon} {config.title}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 hover:bg-gray-100 p-1.5 rounded-lg transition-all active:scale-95"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className={`p-4 rounded-xl border flex items-center gap-3 ${config.theme}`}>
            <Box size={20} />
            <div>
              <p className="font-black text-sm">{insumo.nombre}</p>
              <p className="text-xs font-bold opacity-80">Stock Actual: {insumo.stockActual} {insumo.unidadMedida}</p>
            </div>
          </div>

          {tipo === 'AJUSTE' && (
            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-200">
              <p className="text-sm font-bold text-gray-900">Tipo de Ajuste</p>
              <div className="flex gap-2">
                <button type="button" onClick={() => setEsPositivo(true)} className={`px-4 py-1.5 rounded-lg text-xs font-black transition-colors ${esPositivo ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 border border-gray-200'}`}>+ Ingreso</button>
                <button type="button" onClick={() => setEsPositivo(false)} className={`px-4 py-1.5 rounded-lg text-xs font-black transition-colors ${!esPositivo ? 'bg-red-600 text-white' : 'bg-white text-gray-500 border border-gray-200'}`}>- Salida</button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Cantidad ({insumo.unidadMedida})</label>
              <input autoFocus type="number" step="0.01" min="0.01" value={cantidad} onChange={e => setCantidad(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 font-black focus:ring-2 focus:ring-gray-900 outline-none transition-all" placeholder="0.00" />
            </div>
            {tipo === 'ENTRADA' && (
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Costo Unit. (S/)</label>
                <input type="number" step="0.0001" min="0" value={costoUnitario} onChange={e => setCostoUnitario(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 font-black focus:ring-2 focus:ring-gray-900 outline-none transition-all" placeholder="0.00" />
              </div>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">{tipo === 'ENTRADA' ? 'Observación / Guía (Opcional)' : 'Motivo / Justificación'}</label>
            <input type="text" value={motivo} onChange={e => setMotivo(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 font-bold focus:ring-2 focus:ring-gray-900 outline-none transition-all" placeholder={tipo === 'ENTRADA' ? 'Ej. Factura F001-223' : 'Ej. Producto vencido'} />
          </div>

          <div className="pt-2 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-5 py-3 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-all">Cancelar</button>
            <button type="submit" disabled={loading} className={`bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-black flex-1 px-5 py-3 rounded-xl font-black disabled:opacity-50 flex justify-center items-center shadow-lg transition-all ${config.btn}`}>
              {loading ? <Loader2 size={18} className="animate-spin" /> : 'Confirmar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function KardexPage() {
  const { sedeSeleccionadaId } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [insumos, setInsumos] = useState<any[]>([]);
  const [insumoSel, setInsumoSel] = useState<any | null>(null);
  const [busqueda, setBusqueda] = useState('');
  
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingKardex, setLoadingKardex] = useState(false);

  const [modalOperacion, setModalOperacion] = useState<{ isOpen: boolean, tipo: 'ENTRADA' | 'MERMA' | 'AJUSTE' } | null>(null);
  const [modalStockMin, setModalStockMin] = useState(false);

  const cargarKardex = async (insumoId: number) => {
    setLoadingKardex(true);
    try {
      const { data } = await api.get(`/inventario/kardex/${insumoId}`);
      setMovimientos(data);
    } catch (e) {
      sileo.error({ title: 'Error al cargar el historial del Kardex' });
    } finally {
      setLoadingKardex(false);
    }
  };

  const seleccionarInsumo = useCallback((insumo: any) => {
    setInsumoSel(insumo);
    cargarKardex(insumo.id);
  }, []);

  const cargarInsumos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getInsumos(sedeSeleccionadaId || undefined);
      const activos = data.filter((i: any) => i.estadoRegistro !== false);
      setInsumos(activos);
      return activos;
    } catch (error) {
      sileo.error({ title: 'Error al conectar con el servidor' });
      return [];
    } finally {
      setLoading(false);
    }
  }, [sedeSeleccionadaId]);

  useEffect(() => { 
    cargarInsumos(); 
    setInsumoSel(null); 
    setMovimientos([]); 
  }, [cargarInsumos]);

  useEffect(() => {
    if (insumos.length > 0 && location.state?.autoSelectId) {
      const targetId = location.state.autoSelectId;
      const targetInsumo = insumos.find(i => i.id === targetId);
      
      if (targetInsumo) {
        seleccionarInsumo(targetInsumo);
        
        if (location.state.openEntrada) {
          setTimeout(() => {
            setModalOperacion({ isOpen: true, tipo: 'ENTRADA' });
          }, 300); 
        }
        
        navigate(location.pathname, { replace: true, state: {} });
      }
    }
  }, [insumos, location.state, navigate, seleccionarInsumo]);

  const recargarDespuesDeOperacion = async () => {
    setModalOperacion(null);
    setModalStockMin(false);
    const activos = await cargarInsumos();
    
    if (insumoSel) {
      const actualizado = activos.find((i: any) => i.id === insumoSel.id);
      if (actualizado) {
        setInsumoSel(actualizado);
        await cargarKardex(actualizado.id);
      }
    }
  };

  const formatTipoMovimiento = (tipo: string) => {
    if (tipo.includes('ENTRADA')) return { label: tipo.replace('_', ' '), color: 'text-gray-900 bg-gray-100 border-gray-300', sign: '+' };
    if (tipo.includes('SALIDA') || tipo.includes('CONSUMO') || tipo === 'RESERVA') return { label: tipo.replace('_', ' '), color: 'text-red-700 bg-red-50 border-red-200', sign: '-' };
    return { label: tipo.replace('_', ' '), color: 'text-blue-700 bg-blue-50 border-blue-200', sign: '+' };
  };

  const filtrados = insumos.filter(i => i.nombre.toLowerCase().includes(busqueda.toLowerCase()));

  return (
    <AdminLayout>
      <div className="max-w-[1600px] mx-auto flex flex-col h-[calc(100vh-120px)]">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 shrink-0">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              Auditoría de <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">Kardex</span>
            </h1>
            <p className="text-gray-500 font-medium text-sm">Controla entradas, salidas y mermas del inventario físico.</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
          
          <div className="w-full lg:w-[320px] bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col shrink-0 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center gap-3 bg-gray-50/80 shrink-0">
              <div className="p-2 bg-blue-100 text-blue-700 rounded-lg border border-blue-200">
                <Package size={18} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="font-black text-gray-900 text-base leading-none">Almacén</h2>
                <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-widest">Selecciona un ítem</p>
              </div>
            </div>
            
            <div className="p-3 border-b border-gray-100 shrink-0 bg-white">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input 
                  type="text" 
                  value={busqueda} 
                  onChange={(e) => setBusqueda(e.target.value)} 
                  placeholder="Buscar insumo..." 
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-slate-50/30 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                </div>
              ) : filtrados.length === 0 ? (
                <div className="text-center py-10 flex flex-col items-center text-gray-400">
                  <Box size={20} className="mb-2 opacity-50" />
                  <span className="text-xs font-medium">No se encontraron insumos.</span>
                </div>
              ) : (
                <motion.div variants={listVariants} initial="hidden" animate="show" className="space-y-1">
                  {filtrados.map(i => {
                    const isSelected = insumoSel?.id === i.id;
                    return (
                      <motion.button 
                        variants={itemVariants}
                        key={i.id} 
                        onClick={() => seleccionarInsumo(i)} 
                        className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-200 flex justify-between items-center group relative overflow-hidden ${
                          isSelected 
                            ? 'bg-blue-50 border border-blue-200 shadow-sm' 
                            : 'bg-white border border-transparent hover:bg-gray-50 hover:border-gray-200'
                        }`}
                      >
                        {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l-lg"></div>}
                        
                        <div className="pl-1">
                          <p className={`font-bold text-[13px] transition-colors leading-tight ${isSelected ? 'text-blue-800' : 'text-gray-800 group-hover:text-blue-600'}`}>{i.nombre}</p>
                          <p className={`text-[10px] mt-0.5 font-bold ${isSelected ? 'text-blue-600/70' : 'text-gray-400'}`}>
                            Stock: {i.stockActual} {i.unidadMedida}
                          </p>
                        </div>
                        <ArrowRight size={14} className={`transition-transform ${isSelected ? 'text-blue-500' : 'text-gray-300 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0'}`} />
                      </motion.button>
                    )
                  })}
                </motion.div>
              )}
            </div>
          </div>

          <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col relative overflow-hidden">
            {!insumoSel ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-10 bg-gray-50/50">
                <FileText size={48} className="text-gray-200 mb-4" strokeWidth={1} />
                <h3 className="text-xl font-black text-gray-800 mb-1">Kardex en Blanco</h3>
                <p className="text-sm font-medium text-center">Selecciona un ítem de la izquierda para auditar sus movimientos.</p>
              </div>
            ) : (
              <>
                <div className="px-5 py-3 border-b border-gray-200 bg-gray-50/80 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 shrink-0 z-20">
                  <div className="flex items-center gap-4">
                    <h2 className="text-xl font-black text-gray-900 tracking-tight">{insumoSel.nombre}</h2>
                    <div className="h-6 w-px bg-gray-300 hidden sm:block"></div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-xs font-bold text-gray-500">Stock: <span className="text-gray-900 font-black text-sm">{insumoSel.stockActual} {insumoSel.unidadMedida}</span></span>
                      <span className="text-xs font-bold text-gray-500">Mínimo: <span className="text-amber-600 font-black text-sm">{insumoSel.stockMinimo} {insumoSel.unidadMedida}</span></span>
                      <span className="text-xs font-bold text-gray-500">Costo Ref: <span className="text-emerald-600 font-black text-sm">S/ {Number(insumoSel.costoUnitario).toFixed(4)}</span></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full xl:w-auto">
                    <motion.button 
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setModalOperacion({ isOpen: true, tipo: 'ENTRADA' })} 
                      className="flex-1 xl:flex-none justify-center px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-black rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <ArrowDownCircle size={14} /> Compra
                    </motion.button>
                    <motion.button 
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setModalOperacion({ isOpen: true, tipo: 'MERMA' })} 
                      className="flex-1 xl:flex-none justify-center px-4 py-2 bg-white border border-gray-300 text-red-600 hover:bg-red-50 hover:border-red-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <ArrowUpCircle size={14} /> Merma
                    </motion.button>
                    <motion.button 
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setModalOperacion({ isOpen: true, tipo: 'AJUSTE' })} 
                      className="flex-1 xl:flex-none justify-center px-4 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <Scale size={14} /> Ajuste
                    </motion.button>
                    <motion.button 
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setModalStockMin(true)} 
                      className="flex-1 xl:flex-none justify-center px-4 py-2 bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <Bell size={14} /> Alerta
                    </motion.button>
                  </div>
                </div>

                <div className="flex-1 overflow-auto bg-white [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                  {loadingKardex ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2">
                      <RefreshCw className="animate-spin" size={24}/>
                      <span className="font-bold text-sm">Cargando...</span>
                    </div>
                  ) : movimientos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <p className="font-bold text-sm">No hay movimientos registrados.</p>
                    </div>
                  ) : (
                    <table className="w-full text-left text-sm whitespace-nowrap min-w-[900px]">
                      <thead className="bg-gray-50 sticky top-0 border-b border-gray-200 text-[10px] text-gray-500 uppercase tracking-widest font-black z-10 shadow-sm">
                        <tr>
                          <th className="px-6 py-3">Fecha y Hora</th>
                          <th className="px-6 py-3">Tipo Movimiento</th>
                          <th className="px-6 py-3 text-right">Cant.</th>
                          <th className="px-6 py-3 text-right">Saldo F.</th>
                          <th className="px-6 py-3 text-right">Costo (S/)</th>
                          <th className="px-6 py-3">Responsable</th>
                          <th className="px-6 py-3">Observación</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        <AnimatePresence>
                          {movimientos.map((m) => {
                            const conf = formatTipoMovimiento(m.tipoMovimiento);
                            return (
                              <motion.tr 
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                key={m.id} 
                                className="hover:bg-blue-50/30 transition-colors"
                              >
                                <td className="px-6 py-3 font-bold text-gray-700 text-xs">{formatearFechaHoraPeru(m.fechaCreacion || m.createdAt)}</td>
                                <td className="px-6 py-3">
                                  <span className={`inline-flex items-center px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest border ${conf.color}`}>
                                    {conf.label}
                                  </span>
                                </td>
                                <td className="px-6 py-3 text-right font-black text-gray-900 text-[13px]">
                                  <span className={conf.sign === '+' ? 'text-gray-900' : 'text-red-600'}>{conf.sign} {m.cantidad}</span>
                                </td>
                                <td className="px-6 py-3 text-right font-black text-blue-700 bg-blue-50/30 text-[13px]">{m.stockPosterior}</td>
                                <td className="px-6 py-3 text-right font-mono font-bold text-gray-500 text-xs">{Number(m.costoUnitario).toFixed(4)}</td>
                                <td className="px-6 py-3 font-bold text-gray-600 text-xs">{m.usuario?.nombre || 'Sistema'}</td>
                                <td className="px-6 py-3 text-xs font-medium text-gray-500 max-w-[250px] truncate" title={m.observacion || '-'}>
                                  {m.observacion || '-'}
                                </td>
                              </motion.tr>
                            );
                          })}
                        </AnimatePresence>
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {modalOperacion?.isOpen && (
        <ModalOperacionKardex 
          tipo={modalOperacion.tipo} 
          insumo={insumoSel} 
          sedeId={sedeSeleccionadaId} 
          onClose={() => setModalOperacion(null)} 
          onGuardar={recargarDespuesDeOperacion} 
        />
      )}

      {modalStockMin && (
        <ModalConfigurarStock
          insumo={insumoSel}
          sedeId={sedeSeleccionadaId}
          onClose={() => setModalStockMin(false)}
          onGuardar={recargarDespuesDeOperacion}
        />
      )}
    </AdminLayout>
  );
}