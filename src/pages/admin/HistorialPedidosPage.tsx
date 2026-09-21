import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { Search, Calendar as CalendarIcon, Receipt, X, Filter, Box, ChevronLeft, ChevronRight, ChevronDown, Check, RefreshCw } from 'lucide-react';
import { getHistorialPedidos } from '@/api/pedidos';
import type { PedidoActivo } from '@/types';
import { fechaPeruISO, formatearFechaHoraPeru } from '@/lib/datetimePeru';
import AdminLayout from '@/components/layouts/AdminLayout';
import { useAuthStore } from '@/store/authStore';
import { sileo } from 'sileo';

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 400, damping: 30 } }
};

const DIAS_SEMANA = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function hoy() { return fechaPeruISO(); }
function hace1Dia() { const d = new Date(); d.setDate(d.getDate() - 1); return fechaPeruISO(d); }
function hace7Dias() { const d = new Date(); d.setDate(d.getDate() - 7); return fechaPeruISO(d); }
function hace30Dias() { const d = new Date(); d.setDate(d.getDate() - 30); return fechaPeruISO(d); }
function inicioDeMes() { const d = new Date(); d.setDate(1); return fechaPeruISO(d); }

function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseISODate(s: string) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function generarDiasMes(viewDate: Date) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const primerDia = new Date(year, month, 1);
  const ultimoDia = new Date(year, month + 1, 0);
  const diasEnMes = ultimoDia.getDate();
  let offset = primerDia.getDay() - 1;
  if (offset < 0) offset = 6;

  const dias: { fecha: Date; delMes: boolean }[] = [];
  for (let i = 0; i < offset; i++) {
    dias.push({ fecha: new Date(year, month, i - offset + 1), delMes: false });
  }
  for (let i = 1; i <= diasEnMes; i++) {
    dias.push({ fecha: new Date(year, month, i), delMes: true });
  }
  while (dias.length < 42) {
    const last = dias[dias.length - 1].fecha;
    dias.push({ fecha: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1), delMes: false });
  }
  return dias;
}

function SelectorRangoFechas({ inicio, fin, onChange }: { inicio: string; fin: string; onChange: (inicio: string, fin: string) => void }) {
  const [abierto, setAbierto] = useState(false);
  const [viewDate, setViewDate] = useState(() => parseISODate(inicio));
  const [tempInicio, setTempInicio] = useState<string | null>(inicio);
  const [tempFin, setTempFin] = useState<string | null>(fin);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (abierto) {
      setTempInicio(inicio);
      setTempFin(fin);
      setViewDate(parseISODate(inicio));
    }
  }, [abierto, inicio, fin]);

  const dias = generarDiasMes(viewDate);
  const hoyISO = toISODate(new Date());

  const manejarClickDia = (iso: string) => {
    if (!tempInicio || (tempInicio && tempFin)) {
      setTempInicio(iso);
      setTempFin(null);
      return;
    }
    if (iso < tempInicio) {
      setTempFin(tempInicio);
      setTempInicio(iso);
    } else {
      setTempFin(iso);
    }
  };

  const aplicar = () => {
    if (tempInicio) {
      onChange(tempInicio, tempFin || tempInicio);
      setAbierto(false);
    }
  };

  const aplicarPreset = (pInicio: string, pFin: string) => {
    onChange(pInicio, pFin);
    setAbierto(false);
  };

  const mismoDia = inicio === fin;
  const inicioObj = parseISODate(inicio);
  const finObj = parseISODate(fin);
  const label = mismoDia
    ? inicioObj.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
    : `${inicioObj.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })} – ${finObj.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}`;

  const presets = [
    { label: 'Hoy', inicio: hoy(), fin: hoy() },
    { label: 'Ayer', inicio: hace1Dia(), fin: hace1Dia() },
    { label: 'Últimos 7 días', inicio: hace7Dias(), fin: hoy() },
    { label: 'Últimos 30 días', inicio: hace30Dias(), fin: hoy() },
    { label: 'Este mes', inicio: inicioDeMes(), fin: hoy() },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setAbierto(o => !o)}
        className={`px-4 py-2.5 bg-white border rounded-xl text-sm font-bold text-gray-900 flex items-center gap-2.5 transition-all shadow-sm ${abierto ? 'border-orange-500 ring-2 ring-orange-500/20' : 'border-gray-200 hover:border-gray-300'}`}
      >
        <CalendarIcon size={16} className="text-orange-500" />
        <span className="capitalize">{label}</span>
        <ChevronDown size={15} className={`text-gray-400 transition-transform ${abierto ? 'rotate-180 text-orange-500' : ''}`} />
      </button>

      <AnimatePresence>
        {abierto && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 origin-top-right z-50 mt-2 w-[21rem] bg-white rounded-2xl border border-gray-200 shadow-xl p-4"
          >
            <div className="flex flex-wrap gap-1.5 mb-4 pb-4 border-b border-gray-100">
              {presets.map(p => (
                <button
                  type="button"
                  key={p.label}
                  onClick={() => aplicarPreset(p.inicio, p.fin)}
                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-gray-600 bg-gray-50 hover:bg-orange-50 hover:text-orange-600 transition-colors border border-gray-100"
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between mb-3">
              <button type="button" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-orange-50 text-gray-500 hover:text-orange-600 transition-colors">
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm font-black text-gray-900">{MESES[viewDate.getMonth()]} {viewDate.getFullYear()}</span>
              <button type="button" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-orange-50 text-gray-500 hover:text-orange-600 transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-y-1 mb-1">
              {DIAS_SEMANA.map(d => (
                <span key={d} className="text-[10px] font-black text-gray-400 text-center uppercase">{d}</span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-y-1">
              {dias.map(({ fecha, delMes }, i) => {
                const iso = toISODate(fecha);
                const esHoyDia = iso === hoyISO;
                const esInicio = iso === tempInicio;
                const esFin = iso === tempFin;
                const enRango = !!(tempInicio && tempFin && iso > tempInicio && iso < tempFin);
                return (
                  <div key={i} className="relative h-8 flex items-center justify-center">
                    {(enRango || esInicio || esFin) && tempFin && (
                      <div className={`absolute inset-y-0.5 bg-orange-50 ${esInicio ? 'left-1/2 right-0' : esFin ? 'left-0 right-1/2' : 'left-0 right-0'}`}></div>
                    )}
                    <button
                      type="button"
                      onClick={() => manejarClickDia(iso)}
                      className={`relative z-10 h-7 w-7 flex items-center justify-center rounded-full text-xs font-bold transition-all
                        ${!delMes ? 'text-gray-300' : 'text-gray-700'}
                        ${esInicio || esFin ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md' : ''}
                        ${esHoyDia && !esInicio && !esFin ? 'ring-2 ring-orange-300' : ''}
                        ${!esInicio && !esFin && !enRango ? 'hover:bg-orange-50' : ''}
                        ${enRango ? 'hover:bg-orange-100' : ''}`}
                    >
                      {fecha.getDate()}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
              <span className="text-[11px] font-bold text-gray-400">
                {tempInicio && !tempFin ? 'Selecciona la fecha final' : 'Elige un rango o atajo'}
              </span>
              <div className="flex gap-2">
                <button type="button" onClick={() => setAbierto(false)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-50 transition-colors">Cancelar</button>
                <button type="button" onClick={aplicar} className="px-4 py-1.5 rounded-lg text-xs font-black text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 flex items-center gap-1.5 shadow-sm transition-all">
                  <Check size={13} /> Aplicar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ModalDetalleHistorial({ pedido, onClose }: { pedido: PedidoActivo; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/80 shrink-0">
          <div>
            <h2 className="text-gray-900 font-black text-xl tracking-tight flex items-center gap-2">
              <Receipt className="text-blue-600" size={20} /> Orden #{pedido.id}
            </h2>
            <p className="text-gray-500 text-xs font-medium mt-1">{pedido.mesa || pedido.tipoConsumo}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 hover:bg-gray-100 p-2 rounded-xl transition-all active:scale-95"><X size={20} /></button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
          <div className="flex justify-between items-center bg-blue-50/50 p-3.5 rounded-xl border border-blue-100 mb-4">
            <div>
              <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest mb-1">Atendido por</p>
              <p className="font-bold text-blue-900 text-sm">{pedido.mozo}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest mb-1">Fecha de cobro</p>
              <p className="font-semibold text-blue-800 text-xs">{formatearFechaHoraPeru(pedido.fechaCreacion)}</p>
            </div>
          </div>

          <div className="space-y-2">
            {pedido.items.map((item) => (
              <div key={item.detalleId} className="flex justify-between items-center text-sm p-2.5 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                <div className="flex-1 pr-3">
                  <span className="font-black text-gray-900 mr-2">{item.cantidad}x</span> 
                  <span className="font-semibold text-gray-600 text-xs">{item.nombreProducto}</span>
                  {item.estadoItem === 'CANCELADO' && <span className="ml-2 text-[8px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-bold border border-red-100">CANCELADO</span>}
                </div>
                <span className="font-bold text-gray-900 text-xs">S/ {item.subtotal.toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-5 border-t border-gray-100">
            <div className="flex justify-between text-xs font-medium text-gray-500 mb-2">
              <span>Subtotal</span><span>S/ {(pedido.total + pedido.descuento).toFixed(2)}</span>
            </div>
            {pedido.descuento > 0 && (
              <div className="flex justify-between text-xs font-bold text-emerald-600 mb-2 bg-emerald-50 p-2 rounded-lg">
                <span>Descuento</span><span>- S/ {pedido.descuento.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Pagado</span>
              <span className="text-2xl font-black text-gray-900 tracking-tight">S/ {pedido.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HistorialPedidosPage() {
  const [inicio, setInicio] = useState(hace7Dias());
  const [fin, setFin] = useState(hoy());
  const [pedidos, setPedidos] = useState<PedidoActivo[]>([]);
  const [loading, setLoading] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<PedidoActivo | null>(null);

  const { sedeSeleccionadaId } = useAuthStore();
  
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const cargarHistorial = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getHistorialPedidos(inicio, fin, sedeSeleccionadaId || undefined);
      setPedidos(data);
      if (data.length > 0) sileo.success({ title: `Se cargaron ${data.length} pedidos.` });
      else sileo.error({ title: 'No hay pedidos en este rango.' });
    } catch (err: any) {
      sileo.error({ title: err.response?.data?.message || 'Error de conexión al servidor.' });
    } finally { setLoading(false); }
  }, [inicio, fin, sedeSeleccionadaId]);

  useEffect(() => { cargarHistorial(); }, [cargarHistorial]);

  const pedidosFiltrados = pedidos.filter(p => 
    p.id.toString().includes(busqueda) || 
    (p.mesa && p.mesa.toLowerCase().includes(busqueda.toLowerCase()))
  );

  return (
    <AdminLayout>
      <div className="max-w-[1600px] mx-auto flex flex-col h-[calc(100vh-120px)]">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 shrink-0 pr-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              Registro de <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">Ventas</span>
            </h1>
            <p className="text-gray-500 font-medium text-sm">Auditoría detallada de todos los tickets cerrados en caja.</p>
          </div>
          <button onClick={cargarHistorial} disabled={loading} className="flex-1 sm:flex-none bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex justify-center items-center gap-2 shadow-sm">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> {loading ? 'Refrescando...' : 'Refrescar Datos'}
          </button>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 mb-4 pr-1">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <motion.div
              initial={false}
              animate={{ width: isSearchExpanded || busqueda ? 280 : 44 }}
              className="relative flex items-center bg-white border border-gray-200 hover:border-gray-300 rounded-full h-11 transition-all shadow-sm shrink-0 overflow-hidden focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20"
            >
              <button
                onClick={() => {
                  if (!isSearchExpanded) {
                    setIsSearchExpanded(true);
                    setTimeout(() => searchInputRef.current?.focus(), 100);
                  }
                }}
                className={`absolute left-0 w-11 h-11 flex items-center justify-center text-gray-400 hover:text-orange-500 transition-colors z-10 ${isSearchExpanded || busqueda ? 'pointer-events-none' : ''}`}
              >
                <Search size={18} />
              </button>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Buscar mesa o Ticket..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                onFocus={() => setIsSearchExpanded(true)}
                onBlur={() => {
                  if (!busqueda) setIsSearchExpanded(false);
                }}
                className={`w-full h-full pl-11 pr-10 bg-transparent text-sm font-bold text-gray-700 outline-none placeholder-gray-400 ${isSearchExpanded || busqueda ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
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
                    className="absolute right-2 w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors bg-gray-50 hover:bg-red-50 rounded-full"
                  >
                    <X size={14} />
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          <div className="w-full sm:w-auto flex justify-end">
            <SelectorRangoFechas inicio={inicio} fin={fin} onChange={(i, f) => { setInicio(i); setFin(f); }} />
          </div>
        </div>

        <div className="flex-1 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden relative flex flex-col">
          <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full text-left text-sm whitespace-nowrap min-w-[800px]">
              <thead className="bg-gray-50 sticky top-0 border-b border-gray-200 text-[10px] text-gray-500 uppercase tracking-widest font-black z-10 shadow-sm">
                <tr>
                  <th className="px-6 py-4">Ticket</th>
                  <th className="px-6 py-4">Fecha Emisión</th>
                  <th className="px-6 py-4">Identificador</th>
                  <th className="px-6 py-4">Mozo Responsable</th>
                  <th className="px-6 py-4">Total Facturado</th>
                  <th className="px-6 py-4 text-center">Estado</th>
                  <th className="px-6 py-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <AnimatePresence>
                  {pedidosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-8 py-24 text-center text-gray-400">
                        <div className="flex flex-col items-center justify-center">
                          <Box size={32} className="text-gray-300 mb-3"/>
                          <p className="font-bold text-gray-600 text-base">No hay registros</p>
                          <p className="text-sm mt-1">Ajusta los filtros de fecha o tu búsqueda.</p>
                        </div>
                      </td>
                    </tr>
                  ) : pedidosFiltrados.map((pedido) => (
                    <motion.tr variants={itemVariants} initial="hidden" animate="show" exit="hidden" key={pedido.id} className="hover:bg-blue-50/30 transition-colors group cursor-default">
                      <td className="px-6 py-3 font-black text-gray-900 text-[13px]">#{pedido.id}</td>
                      <td className="px-6 py-3 text-gray-500 font-medium text-xs">{formatearFechaHoraPeru(pedido.fechaCreacion)}</td>
                      <td className="px-6 py-3 font-bold text-gray-700 text-[13px]">{pedido.mesa || pedido.tipoConsumo}</td>
                      <td className="px-6 py-3 text-gray-500 font-medium flex items-center gap-2 text-xs">
                        <div className="w-5 h-5 bg-gray-100 border border-gray-200 rounded-md flex items-center justify-center text-[9px] font-bold text-gray-500 uppercase">{pedido.mozo.charAt(0)}</div>
                        {pedido.mozo}
                      </td>
                      <td className="px-6 py-3 font-black text-gray-900 text-[14px]">S/ {pedido.total.toFixed(2)}</td>
                      <td className="px-6 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest ${pedido.estadoActual === 'PAGADO' ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-red-700 bg-red-50 border border-red-200'}`}>
                          {pedido.estadoActual}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <button onClick={() => setPedidoSeleccionado(pedido)} className="text-gray-600 bg-white border border-gray-200 hover:border-blue-300 hover:text-blue-600 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm">
                          Ver Ticket
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {pedidoSeleccionado && <ModalDetalleHistorial pedido={pedidoSeleccionado} onClose={() => setPedidoSeleccionado(null)} />}
    </AdminLayout>
  );
}