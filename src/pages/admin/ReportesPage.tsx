import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { 
  Download, PieChart, Receipt, Box, FileSpreadsheet, ArrowRight, Activity, TrendingUp, Loader2, Lock,
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown, Check, RefreshCw
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { fechaPeruISO } from '@/lib/datetimePeru';
import AdminLayout from '@/components/layouts/AdminLayout';
import { getMargenVentas } from '@/api/reportes';
import { getHistorialPedidos } from '@/api/pedidos';
import type { MargenVentasDTO } from '@/api/reportes';
import type { PedidoActivo } from '@/types';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
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
        className={`px-4 h-[42px] bg-white border rounded-xl text-sm font-bold text-gray-900 flex items-center gap-2.5 transition-all shadow-sm ${abierto ? 'border-orange-500 ring-2 ring-orange-500/20' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
      >
        <CalendarIcon size={16} className="text-orange-500" strokeWidth={2.5} />
        <span className="capitalize">{label}</span>
        <ChevronDown size={14} className={`text-gray-400 transition-transform ${abierto ? 'rotate-180 text-orange-500' : ''}`} />
      </button>

      <AnimatePresence>
        {abierto && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 origin-top-right z-[100] mt-3 w-[21rem] bg-white rounded-3xl border border-gray-200 shadow-2xl p-5"
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

export default function ReportesPage() {
  const navigate = useNavigate();
  const { sedeSeleccionadaId } = useAuthStore();
  
  const [inicio, setInicio] = useState(hace30Dias());
  const [fin, setFin] = useState(hoy());
  
  const [margen, setMargen] = useState<MargenVentasDTO | null>(null);
  const [historial, setHistorial] = useState<PedidoActivo[]>([]);
  const [loading, setLoading] = useState(false);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const [dataMargen, dataHistorial] = await Promise.all([
        getMargenVentas(inicio, fin, sedeSeleccionadaId || undefined).catch(() => null),
        getHistorialPedidos(inicio, fin, sedeSeleccionadaId || undefined).catch(() => [])
      ]);
      setMargen(dataMargen);
      setHistorial(dataHistorial);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [inicio, fin, sedeSeleccionadaId]);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  const descargarExcelVentas = () => {
    const token = useAuthStore.getState().token;
    let url = `http://localhost:8080/api/reportes/excel?inicio=${inicio}&fin=${fin}&token=${encodeURIComponent(token || '')}`;
    if (sedeSeleccionadaId) url += `&sedeId=${sedeSeleccionadaId}`;
    window.location.href = url;
  };

  const pedidosPagados = historial.filter(p => p.estadoActual === 'PAGADO');
  const pedidosAnulados = historial.filter(p => p.estadoActual === 'CANCELADO');

  return (
    <AdminLayout>
      <div className="max-w-[1400px] mx-auto flex flex-col h-[calc(100vh-120px)] relative w-full">
        
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6 shrink-0 pr-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              Análisis y <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">Reportes</span>
            </h1>
            <p className="text-gray-500 font-medium text-sm mt-1">Monitoreo centralizado del desempeño financiero y operativo.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto ml-auto">
            <div className="flex gap-2 w-full sm:w-auto">
              <SelectorRangoFechas inicio={inicio} fin={fin} onChange={(i, f) => { setInicio(i); setFin(f); }} />
              <button onClick={cargarDatos} disabled={loading} title="Actualizar" className="w-[42px] h-[42px] bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-all active:scale-95 shadow-sm flex items-center justify-center shrink-0">
                <RefreshCw size={18} className={loading ? 'animate-spin text-gray-900' : ''} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pb-6 pr-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4 bg-white rounded-[2rem] border border-gray-200 shadow-sm">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
              <p className="font-bold text-gray-400">Compilando reportes...</p>
            </div>
          ) : (
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-min">
              
              <motion.div variants={itemVariants} className="md:col-span-2 xl:col-span-2 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                    <Receipt size={16} strokeWidth={2.5}/>
                  </div>
                  <h3 className="font-black text-gray-900 text-base">Rendimiento de Ventas</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-emerald-50 border border-emerald-100/50 p-4 rounded-xl">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1.5"><TrendingUp size={12}/> Facturación</p>
                    <p className="text-2xl font-black text-emerald-700 mt-1">
                      S/ {pedidosPagados.reduce((acc, p) => acc + p.total, 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-rose-50 border border-rose-100/50 p-4 rounded-xl">
                    <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest flex items-center gap-1.5"><Activity size={12}/> Anulados</p>
                    <p className="text-2xl font-black text-rose-700 mt-1">
                      {pedidosAnulados.length} <span className="text-xs text-rose-500/70 font-bold ml-1">tickets</span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button onClick={() => navigate('/historial')} className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold py-2.5 px-4 rounded-xl border border-gray-200 transition-colors text-xs flex items-center justify-center gap-2 shadow-sm">
                    <Receipt size={14} className="text-gray-500" /> Auditoría de Tickets
                  </button>
                  <button onClick={() => navigate('/admin/auditoria-cajas')} className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold py-2.5 px-4 rounded-xl border border-gray-200 transition-colors text-xs flex items-center justify-center gap-2 shadow-sm">
                    <Lock size={14} className="text-gray-500" /> Auditoría de Cajas
                  </button>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="md:col-span-1 xl:col-span-2 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                      <PieChart size={16} strokeWidth={2.5}/>
                    </div>
                    <h3 className="font-black text-gray-900 text-base">Top Rentabilidad</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Margen</p>
                    <p className="text-lg font-black text-indigo-600 leading-none">{margen?.margenBrutoPct.toFixed(1) || '0'}%</p>
                  </div>
                </div>
                
                <div className="flex-1 mb-4 flex flex-col justify-center">
                  {margen && margen.desglosePorProducto.length > 0 ? (
                    <div className="space-y-2">
                      {[...margen.desglosePorProducto].sort((a, b) => b.utilidadBruta - a.utilidadBruta).slice(0, 3).map((p, i) => (
                        <div key={p.productoId} className="flex justify-between items-center bg-gray-50/80 px-3 py-2 rounded-lg border border-gray-100">
                          <span className="text-xs font-bold text-gray-700 truncate mr-2"><span className="text-gray-400 mr-1.5">{i+1}.</span>{p.producto}</span>
                          <span className="text-xs font-black text-emerald-600 whitespace-nowrap">S/ {p.utilidadBruta.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-xs font-bold text-gray-400">Sin datos de utilidad.</div>
                  )}
                </div>

                <button onClick={() => navigate('/admin/finanzas')} className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold py-2.5 rounded-xl border border-gray-200 transition-colors text-xs flex items-center justify-center gap-2 mt-auto">
                  Análisis Financiero <ArrowRight size={14} />
                </button>
              </motion.div>

              <motion.div variants={itemVariants} className="md:col-span-2 xl:col-span-2 bg-[#0a0f1c] rounded-2xl shadow-xl relative overflow-hidden group flex flex-col sm:flex-row items-center border border-gray-800">
                <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/10 rounded-full blur-[40px] pointer-events-none group-hover:bg-orange-500/20 transition-colors"></div>
                
                <div className="p-6 relative z-10 flex-1 flex items-start gap-4 w-full">
                  <div className="w-10 h-10 shrink-0 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 border border-emerald-500/30">
                    <FileSpreadsheet size={20} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white tracking-tight mb-1">Exportar Reporte</h2>
                    <p className="text-gray-400 text-xs font-medium leading-relaxed mb-4">
                      Descarga un informe corporativo auto-formateado con el resumen de tickets del período ({pedidosPagados.length} tickets).
                    </p>
                    <button onClick={descargarExcelVentas} className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-black py-2.5 px-4 rounded-xl shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all active:scale-95 text-xs w-max">
                      <Download size={14} /> Descargar Archivo Excel
                    </button>
                  </div>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="md:col-span-1 xl:col-span-2 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl shadow-sm border border-orange-100 flex flex-col justify-between overflow-hidden relative">
                <div className="p-6 relative z-10 flex-1 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 shrink-0 bg-white rounded-xl flex items-center justify-center text-orange-500 border border-orange-200 shadow-sm">
                      <Box size={20} strokeWidth={2.5} />
                    </div>
                    <h2 className="text-lg font-black text-orange-900 tracking-tight">Control Kardex</h2>
                  </div>
                  <p className="text-orange-800/70 text-xs font-medium leading-relaxed mb-4">
                    Supervisa el inventario en tiempo real. Mermas, ajustes y compras al detalle.
                  </p>
                  <button onClick={() => navigate('/admin/kardex')} className="w-full bg-white hover:bg-orange-500 hover:text-white hover:border-orange-500 text-orange-600 font-black py-2.5 rounded-xl border border-orange-200 transition-all text-xs flex items-center justify-center gap-2 shadow-sm">
                    Revisar Almacén <ArrowRight size={14} />
                  </button>
                </div>
              </motion.div>

            </motion.div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}